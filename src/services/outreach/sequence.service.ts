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
    const [seq] = await db
      .select({ campaignId: sequences.campaignId })
      .from(sequences)
      .where(eq(sequences.id, sequenceId))
      .limit(1);

    const campaignId = seq?.campaignId;

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

    // Query send counts per step (confirmed SENT sends only, filtered by campaign)
    const sendStats = await db
      .select({
        stepNumber: messages.stepNumber,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.sendStatus, 'SENT'),
          campaignId ? eq(messages.campaignId, campaignId) : undefined
        )
      )
      .groupBy(messages.stepNumber);

    const sendsByStep = new Map<number, number>();
    for (const s of sendStats) {
      sendsByStep.set(s.stepNumber, s.count);
    }

    // Query reply counts per step (deduplicated replies, filtered by campaign)
    const replyStats = await db
      .select({
        stepNumber: messages.stepNumber,
        count: sql<number>`count(DISTINCT replies.id)::int`,
      })
      .from(replies)
      .innerJoin(messages, eq(replies.threadId, messages.threadId))
      .where(
        and(
          eq(messages.sendStatus, 'SENT'),
          campaignId ? eq(messages.campaignId, campaignId) : undefined
        )
      )
      .groupBy(messages.stepNumber);

    const repliesByStep = new Map<number, number>();
    for (const r of replyStats) {
      repliesByStep.set(r.stepNumber, r.count);
    }

    // Query bounce / unsubscribe counts per step (deduplicated suppressions, filtered by campaign)
    const suppressionStats = await db
      .select({
        stepNumber: messages.stepNumber,
        count: sql<number>`count(DISTINCT suppressions.id)::int`,
      })
      .from(suppressions)
      .innerJoin(leads, eq(suppressions.channelId, leads.channelId))
      .innerJoin(messages, eq(leads.id, messages.leadId))
      .where(
        and(
          eq(messages.sendStatus, 'SENT'),
          campaignId ? eq(messages.campaignId, campaignId) : undefined
        )
      )
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
      // Advance by business days (BUG-18: use UTC methods to be server-TZ independent)
      let daysRemaining = delayDays;
      while (daysRemaining > 0) {
        target.setUTCDate(target.getUTCDate() + 1);
        const dayOfWeek = target.getUTCDay(); // 0 = Sun, 6 = Sat
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysRemaining--;
        }
      }
    } else {
      target.setUTCDate(target.getUTCDate() + delayDays);
    }

    // If target lands on Saturday or Sunday under SKIP_WEEKENDS, shift to Monday
    // BUG-18: use getUTCDay() — consistent with UTC-based arithmetic above
    if (weekendPolicy === 'SKIP_WEEKENDS') {
      const day = target.getUTCDay();
      if (day === 6) {
        target.setUTCDate(target.getUTCDate() + 2); // Sat → Mon
      } else if (day === 0) {
        target.setUTCDate(target.getUTCDate() + 1); // Sun → Mon
      }
    }

    // ── BUG-05 fix: pin scheduled time to America/New_York, not server TZ ──
    // ── BUG-06 fix: delayHours is honoured as an offset within ET window ──
    //
    // Strategy:
    //   1. Determine the UTC offset for America/New_York on the target date
    //      (handles DST automatically via Intl.DateTimeFormat).
    //   2. Choose a base ET hour: 9 AM + deterministic jitter (0–5 h),
    //      then add delayHours inside the window, capped at 16:45 ET.
    //   3. Convert that ET wall-clock time to a UTC timestamp and set it on target.

    // Step 1 – get the UTC offset for New York on this calendar date.
    // We do this by formatting a reference UTC midnight of the target date
    // and reading back the local hour/minute offsets via Intl.
    const etFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    // Build a UTC midnight for the current target date so we can measure offset.
    const utcMidnight = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), 0, 0, 0)
    );
    const parts = etFormatter.formatToParts(utcMidnight);
    const etHourAtMidnight = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const etMinuteAtMidnight = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);

    // UTC offset in minutes: how many minutes ahead of UTC is New York at midnight UTC.
    // If ET midnight is "19:00" it means ET is UTC-5 (utcMidnight maps to 7 PM prev day ET).
    // We use the sign convention: utcOffsetMinutes = ET_hour*60+ET_min  (could be negative).
    // Simpler: offsetMinutes = etHour*60 + etMin (this is the ET clock reading at UTC 00:00,
    // which directly tells us how many minutes to subtract from UTC to get ET).
    const etMinutesAtUtcMidnight = etHourAtMidnight * 60 + etMinuteAtMidnight;
    // ET offset from UTC (minutes): negative in winter (UTC-5→-300), negative in summer (UTC-4→-240)
    const etOffsetMinutes = etMinutesAtUtcMidnight === 0 ? 0 : etMinutesAtUtcMidnight - 24 * 60;

    // Step 2 – choose target ET time.
    // Deterministic jitter: 0–5 h based on leadId hash.
    const hash = Math.abs((leadId * 2654435761) ^ (leadId >> 16));
    const jitterHours = hash % 6;        // 0–5 h  → base window 9:00–14:59 ET
    const jitterMinutes = hash % 60;     // 0–59 min

    // delayHours shifts within the window; total capped at 16:45 ET (1005 min from midnight ET).
    const baseEtMinutes = 9 * 60 + jitterHours * 60 + jitterMinutes + delayHours * 60;
    const cappedEtMinutes = Math.min(baseEtMinutes, 16 * 60 + 45); // never past 16:45 ET

    const targetEtHour = Math.floor(cappedEtMinutes / 60);
    const targetEtMinute = cappedEtMinutes % 60;

    // Step 3 – convert ET wall-clock to UTC and apply to target.
    // targetUTCMinutesFromMidnight = targetEtMinutes - etOffsetMinutes
    const targetUtcMinutes = cappedEtMinutes - etOffsetMinutes;
    const targetUtcHour = Math.floor(targetUtcMinutes / 60) % 24;
    const targetUtcMinute = targetUtcMinutes % 60;

    target.setUTCHours(targetUtcHour, targetUtcMinute, 0, 0);

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
      await db.transaction(async (tx) => {
        // 1. Cancel sequence progress rows
        await tx
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
        await tx
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
      });

      console.log(`🛑 [Sequence Engine] Cancelled active sequence for Lead #${leadId} (reason: ${status})`);
    } catch (e: any) {
      console.error(`[Sequence Engine] Critical: failed cancelling sequence for lead #${leadId}:`, e);
      throw e;
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

    // Auto-create default sequence for campaign (wrapped in transaction to prevent orphaned sequences)
    const defaultTemplate = await db.select().from(templates).limit(1);
    const templateId = defaultTemplate.length > 0 ? defaultTemplate[0].id : 1;

    const newSeq = await db.transaction(async (tx) => {
      const insertedSeq = await tx
        .insert(sequences)
        .values({
          campaignId,
          name: 'Default Outreach Sequence',
          weekendPolicy: 'SKIP_WEEKENDS',
          capacityBias: '0.00',
          isActive: true,
        })
        .returning();

      const seq = insertedSeq[0];

      // Insert Step 1 (Initial Pitch)
      await tx.insert(sequenceSteps).values({
        sequenceId: seq.id,
        stepNumber: 1,
        templateId,
        delayDays: 0,
        delayHours: 0,
      });

      // Insert Step 2 (Follow-up #1, 2 days later)
      await tx.insert(sequenceSteps).values({
        sequenceId: seq.id,
        stepNumber: 2,
        templateId,
        delayDays: 2,
        delayHours: 0,
      });

      return seq;
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
