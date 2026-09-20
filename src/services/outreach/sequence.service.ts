import { db } from '../../db/client';
import {
  sequences,
  sequenceSteps,
  leadSequenceProgress,
  messages,
  replies,
  suppressions,
  scheduledEmails,
  leads,
  templates,
} from '../../db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

export interface SequenceStepWithTemplate {
  id: number;
  sequenceId: number;
  stepNumber: number;
  templateId: number;
  delayDays: number;
  delayHours: number;
  templateName?: string;
  templateSubject?: string;
  templateBody?: string;
}

export interface SequenceModelMetrics {
  sequenceId: number;
  stepCount: number;
  phi: number; // Sequence Expansion Factor
  equilibriumNewRatio: number; // R_new* (0.0 to 1.0)
  equilibriumFollowUpRatio: number; // R_fu* (0.0 to 1.0)
  empiricalSteps: {
    stepNumber: number;
    replyRate: number;
    bounceRate: number;
    survivalRate: number;
    isEmpirical: boolean;
  }[];
}

export class SequenceService {
  /**
   * Cold-start priors used when a step has < 50 sends in the database.
   */
  private coldStartPriors: Record<number, { replyRate: number; bounceRate: number }> = {
    1: { replyRate: 0.07, bounceRate: 0.02 },
    2: { replyRate: 0.05, bounceRate: 0.02 },
    3: { replyRate: 0.03, bounceRate: 0.02 },
    4: { replyRate: 0.02, bounceRate: 0.02 },
  };

  /**
   * Computes the empirical expansion factor Phi and equilibrium capacities
   * using database metrics from real sent messages and inbound replies.
   */
  public async getSequenceMetrics(sequenceId: number): Promise<SequenceModelMetrics> {
    const steps = await db
      .select()
      .from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, sequenceId))
      .orderBy(sequenceSteps.stepNumber);

    if (steps.length === 0) {
      return {
        sequenceId,
        stepCount: 1,
        phi: 1.0,
        equilibriumNewRatio: 1.0,
        equilibriumFollowUpRatio: 0.0,
        empiricalSteps: [],
      };
    }

    // Query send counts per step
    const sendStats = await db
      .select({
        stepNumber: messages.stepNumber,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(inArray(messages.sendStatus, ['SENT', 'SENDING']))
      .groupBy(messages.stepNumber);

    const sendsByStep = new Map<number, number>();
    for (const s of sendStats) {
      sendsByStep.set(s.stepNumber, s.count);
    }

    // Query reply counts per step (based on the outbound message's stepNumber)
    const replyStats = await db
      .select({
        stepNumber: messages.stepNumber,
        count: sql<number>`count(*)::int`,
      })
      .from(replies)
      .innerJoin(messages, eq(replies.threadId, messages.threadId))
      .groupBy(messages.stepNumber);

    const repliesByStep = new Map<number, number>();
    for (const r of replyStats) {
      repliesByStep.set(r.stepNumber, r.count);
    }

    // Query bounce / unsubscribe counts per step
    const suppressionStats = await db
      .select({
        stepNumber: messages.stepNumber,
        count: sql<number>`count(*)::int`,
      })
      .from(suppressions)
      .innerJoin(leads, eq(suppressions.channelId, leads.channelId))
      .innerJoin(messages, eq(leads.id, messages.leadId))
      .groupBy(messages.stepNumber);

    const unsubsByStep = new Map<number, number>();
    for (const u of suppressionStats) {
      unsubsByStep.set(u.stepNumber, u.count);
    }

    let cumulativeSurvival = 1.0;
    let sumOfSurvivals = 0; // sum of S_k for k=2..N
    const empiricalSteps: SequenceModelMetrics['empiricalSteps'] = [];

    for (let k = 1; k <= steps.length; k++) {
      const stepTotalSends = sendsByStep.get(k) || 0;
      const stepTotalReplies = repliesByStep.get(k) || 0;
      const stepTotalUnsubs = unsubsByStep.get(k) || 0;

      let r_k: number;
      let u_k: number;
      let isEmpirical = false;

      // Use empirical rates if >= 50 sends exist for this step; otherwise use cold-start prior
      if (stepTotalSends >= 50) {
        r_k = Math.max(0.005, Math.min(0.5, stepTotalReplies / stepTotalSends));
        u_k = Math.max(0.005, Math.min(0.3, stepTotalUnsubs / stepTotalSends));
        isEmpirical = true;
      } else {
        const prior = this.coldStartPriors[k] || { replyRate: 0.02, bounceRate: 0.02 };
        r_k = prior.replyRate;
        u_k = prior.bounceRate;
      }

      if (k === 1) {
        empiricalSteps.push({
          stepNumber: 1,
          replyRate: r_k,
          bounceRate: u_k,
          survivalRate: 1.0,
          isEmpirical,
        });
      } else {
        sumOfSurvivals += cumulativeSurvival;
        empiricalSteps.push({
          stepNumber: k,
          replyRate: r_k,
          bounceRate: u_k,
          survivalRate: cumulativeSurvival,
          isEmpirical,
        });
      }

      // Update survival for next step: S_{k+1} = S_k * (1 - r_k - u_k)
      cumulativeSurvival = Math.max(0.05, cumulativeSurvival * (1 - r_k - u_k));
    }

    // Sequence Expansion Factor: Phi = 1 + sum_{k=2}^N S_k
    const phi = Math.max(1.0, 1.0 + sumOfSurvivals);
    const equilibriumNewRatio = Math.round((1.0 / phi) * 100) / 100;
    const equilibriumFollowUpRatio = Math.round((1.0 - equilibriumNewRatio) * 100) / 100;

    return {
      sequenceId,
      stepCount: steps.length,
      phi: Math.round(phi * 100) / 100,
      equilibriumNewRatio,
      equilibriumFollowUpRatio,
      empiricalSteps,
    };
  }

  /**
   * Calculates the exact scheduled timestamp for the next sequence step,
   * factoring in:
   * - Delay in days & hours
   * - Weekend policy ('SKIP_WEEKENDS' shifts to Monday morning)
   * - Bounded scheduling jitter (+/- 3 hours within US business hours 9 AM - 5 PM)
   */
  public calculateNextStepDue(
    lastSentAt: Date,
    delayDays: number,
    delayHours: number,
    weekendPolicy: 'SKIP_WEEKENDS' | 'SEND_7_DAYS',
    leadId: number
  ): Date {
    const target = new Date(lastSentAt.getTime());

    if (weekendPolicy === 'SKIP_WEEKENDS') {
      // Advance by business days
      let daysRemaining = delayDays;
      while (daysRemaining > 0) {
        target.setDate(target.getDate() + 1);
        const dayOfWeek = target.getDay(); // 0 = Sun, 6 = Sat
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysRemaining--;
        }
      }
    } else {
      target.setDate(target.getDate() + delayDays);
    }

    if (delayHours > 0) {
      target.setHours(target.getHours() + delayHours);
    }

    // If target lands on Saturday or Sunday under SKIP_WEEKENDS, shift to Monday
    if (weekendPolicy === 'SKIP_WEEKENDS') {
      const day = target.getDay();
      if (day === 6) {
        target.setDate(target.getDate() + 2); // Sat -> Mon
      } else if (day === 0) {
        target.setDate(target.getDate() + 1); // Sun -> Mon
      }
    }

    // Bounded intra-day jitter within US Eastern business hours (9:00 AM - 5:00 PM)
    // Deterministic hash based on leadId prevents thrashing while distributing load
    const hash = Math.abs((leadId * 2654435761) ^ (leadId >> 16));
    const hourOffset = (hash % 7); // 0 to 6 hours after 9:00 AM => 9 AM to 3 PM
    const minuteOffset = (hash % 60);

    target.setHours(9 + hourOffset, minuteOffset, 0, 0);

    return target;
  }

  /**
   * Advances the state machine after a step is sent.
   * If the step was the last one, marks the sequence as COMPLETED.
   * Otherwise, schedules the next step.
   */
  public async advanceLeadSequence(params: {
    leadId: number;
    contactId: number;
    campaignId: number;
    sequenceId: number;
    stepNumber: number;
    pinnedAccountId: number;
    threadId: string;
    rfc822MessageId: string;
  }): Promise<void> {
    const { leadId, contactId, campaignId, sequenceId, stepNumber, pinnedAccountId, threadId, rfc822MessageId } =
      params;

    // Fetch all steps for this sequence
    const steps = await db
      .select()
      .from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, sequenceId))
      .orderBy(sequenceSteps.stepNumber);

    const currentStepIndex = steps.findIndex((s) => s.stepNumber === stepNumber);
    const nextStep = currentStepIndex >= 0 && currentStepIndex + 1 < steps.length ? steps[currentStepIndex + 1] : null;

    // Fetch sequence settings
    const seqRecord = await db.select().from(sequences).where(eq(sequences.id, sequenceId)).limit(1);
    const weekendPolicy = (seqRecord[0]?.weekendPolicy as any) || 'SKIP_WEEKENDS';

    const now = new Date();

    if (!nextStep) {
      // Sequence completed!
      await db
        .insert(leadSequenceProgress)
        .values({
          leadId,
          campaignId,
          contactId,
          sequenceId,
          currentStep: stepNumber,
          status: 'COMPLETED',
          pinnedGmailAccountId: pinnedAccountId,
          lastSentAt: now,
          nextStepDueAt: null,
          threadId,
          lastRfc822MessageId: rfc822MessageId,
        })
        .onConflictDoUpdate({
          target: [leadSequenceProgress.contactId, leadSequenceProgress.sequenceId],
          set: {
            currentStep: stepNumber,
            status: 'COMPLETED',
            lastSentAt: now,
            nextStepDueAt: null,
            threadId,
            lastRfc822MessageId: rfc822MessageId,
            updatedAt: now,
          },
        });

      console.log(`🎉 [Sequence Engine] Lead #${leadId} (Contact #${contactId}) COMPLETED sequence #${sequenceId}.`);
      return;
    }

    // Next step exists: compute next_step_due_at
    const nextDue = this.calculateNextStepDue(now, nextStep.delayDays, nextStep.delayHours, weekendPolicy, leadId);

    await db
      .insert(leadSequenceProgress)
      .values({
        leadId,
        campaignId,
        contactId,
        sequenceId,
        currentStep: nextStep.stepNumber,
        status: 'ACTIVE',
        pinnedGmailAccountId: pinnedAccountId,
        lastSentAt: now,
        nextStepDueAt: nextDue,
        threadId,
        lastRfc822MessageId: rfc822MessageId,
      })
      .onConflictDoUpdate({
        target: [leadSequenceProgress.contactId, leadSequenceProgress.sequenceId],
        set: {
          currentStep: nextStep.stepNumber,
          status: 'ACTIVE',
          pinnedGmailAccountId: pinnedAccountId,
          lastSentAt: now,
          nextStepDueAt: nextDue,
          threadId,
          lastRfc822MessageId: rfc822MessageId,
          updatedAt: now,
        },
      });

    console.log(
      `📅 [Sequence Engine] Lead #${leadId} (Contact #${contactId}) advanced to Step ${nextStep.stepNumber}. Due at: ${nextDue.toISOString()}`
    );
  }

  /**
   * Instantly cancels any active sequence progress for all contacts of a lead.
   * Triggered when a creator replies, unsubscribes, or bounces.
   */
  public async cancelSequenceForLead(
    leadId: number,
    status: 'CANCELLED_REPLY' | 'CANCELLED_OPT_OUT' | 'CANCELLED_BOUNCED'
  ): Promise<void> {
    try {
      // 1. Cancel sequence progress rows
      await db
        .update(leadSequenceProgress)
        .set({
          status,
          nextStepDueAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leadSequenceProgress.leadId, leadId),
            eq(leadSequenceProgress.status, 'ACTIVE')
          )
        );

      // 2. Cancel all pending scheduled emails for this lead
      await db
        .update(scheduledEmails)
        .set({
          status: 'CANCELLED',
          error: `Sequence halted: ${status}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(scheduledEmails.leadId, leadId),
            eq(scheduledEmails.status, 'PENDING')
          )
        );

      console.log(`🛑 [Sequence Engine] Cancelled active sequence for Lead #${leadId} (reason: ${status})`);
    } catch (e: any) {
      console.warn(`[Sequence Engine] Error cancelling sequence for lead #${leadId}:`, e.message);
    }
  }

  /**
   * Retrieves or automatically initializes a default Sequence for an active campaign.
   */
  public async getOrCreateCampaignSequence(campaignId: number): Promise<{
    sequence: typeof sequences.$inferSelect;
    steps: SequenceStepWithTemplate[];
  }> {
    const existingSeq = await db
      .select()
      .from(sequences)
      .where(and(eq(sequences.campaignId, campaignId), eq(sequences.isActive, true)))
      .limit(1);

    if (existingSeq.length > 0) {
      const seq = existingSeq[0];
      const steps = await db
        .select({
          id: sequenceSteps.id,
          sequenceId: sequenceSteps.sequenceId,
          stepNumber: sequenceSteps.stepNumber,
          templateId: sequenceSteps.templateId,
          delayDays: sequenceSteps.delayDays,
          delayHours: sequenceSteps.delayHours,
          templateName: templates.name,
          templateSubject: templates.subject,
          templateBody: templates.body,
        })
        .from(sequenceSteps)
        .leftJoin(templates, eq(sequenceSteps.templateId, templates.id))
        .where(eq(sequenceSteps.sequenceId, seq.id))
        .orderBy(sequenceSteps.stepNumber);

      return { sequence: seq, steps: steps as any };
    }

    // Auto-create default sequence for campaign
    const defaultTemplate = await db.select().from(templates).limit(1);
    const templateId = defaultTemplate.length > 0 ? defaultTemplate[0].id : 1;

    const insertedSeq = await db
      .insert(sequences)
      .values({
        campaignId,
        name: 'Default Outreach Sequence',
        weekendPolicy: 'SKIP_WEEKENDS',
        capacityBias: '0.00',
        isActive: true,
      })
      .returning();

    const newSeq = insertedSeq[0];

    // Insert Step 1 (Initial Pitch)
    await db.insert(sequenceSteps).values({
      sequenceId: newSeq.id,
      stepNumber: 1,
      templateId,
      delayDays: 0,
      delayHours: 0,
    });

    // Insert Step 2 (Follow-up #1, 2 days later)
    await db.insert(sequenceSteps).values({
      sequenceId: newSeq.id,
      stepNumber: 2,
      templateId,
      delayDays: 2,
      delayHours: 0,
    });

    const steps = await db
      .select({
        id: sequenceSteps.id,
        sequenceId: sequenceSteps.sequenceId,
        stepNumber: sequenceSteps.stepNumber,
        templateId: sequenceSteps.templateId,
        delayDays: sequenceSteps.delayDays,
        delayHours: sequenceSteps.delayHours,
        templateName: templates.name,
        templateSubject: templates.subject,
      })
      .from(sequenceSteps)
      .leftJoin(templates, eq(sequenceSteps.templateId, templates.id))
      .where(eq(sequenceSteps.sequenceId, newSeq.id))
      .orderBy(sequenceSteps.stepNumber);

    return { sequence: newSeq, steps: steps as any };
  }
}

export const sequenceService = new SequenceService();
