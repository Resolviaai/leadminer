import { db } from '../../src/db/client';
import {
  campaigns,
  leads,
  contacts,
  gmailAccounts,
  messages,
  scheduledEmails,
  systemSettings,
  sequences,
  sequenceSteps,
  leadSequenceProgress,
  keywords,
} from '../../src/db/schema';
import { eq, and, inArray, isNotNull, sql, notInArray, desc } from 'drizzle-orm';
import { env } from '../config/env';
import { gmailSendingService } from '../services/outreach/gmail.service';
import { sequenceService } from '../services/outreach/sequence.service';
import { warmupService } from '../services/outreach/warmup.service';
import { outreachEligibilityEngine } from '../services/qualification/eligibility.service';
import { opportunityPriorityEngine, TIER_ORDER, OpportunityTier } from '../services/outreach/priority.engine';
import { telegramService } from '../services/notifications/telegram.service';

export interface PlannerResult {
  scheduled: number;
  scheduledNew: number;
  scheduledFollowUps: number;
  skipped: number;
  accountsAvailable: number;
  totalDailyQuota: number;
  details?: string;
}

/**
 * Return the number of daily sending slots still available after accounting
 * for both messages already sent and rows already scheduled.
 *
 * Keeping this as a pure helper makes the quota arithmetic easy to test and
 * prevents the planner from treating sent and scheduled work as overlapping.
 */
export function calculateRemainingSlots(sentCount: number, scheduledCount: number, effectiveLimit: number): number {
  return Math.max(0, effectiveLimit - Math.max(0, sentCount) - Math.max(0, scheduledCount));
}

/**
 * Morning Planner Worker (Sequence v2 Engine)
 * Runs each morning to plan the day's outreach.
 *
 * Architecture:
 * 1. Dynamic Phi Equilibrium Governor: Uses Sequence Expansion Factor (Phi = 1 + sum S_k)
 *    and database-measured survival rates to calculate equilibrium capacities.
 * 2. Strict Inbox Affinity: Follow-up steps (2..N) are permanently pinned to the exact
 *    Gmail inbox that sent Step 1.
 * 3. Fluid Spillover: If fewer follow-ups are due on an inbox, unused capacity rolls over
 *    into Step 1 new leads so zero daily quota is wasted.
 * 4. Priority Scoring: Ranks due follow-ups by overdue lateness, step, and subscriber tier.
 * 5. Bounded Scheduling Window: Monday smoothing and natural time dispersion (9 AM - 5 PM).
 */
export async function runPlanner(): Promise<PlannerResult> {
  console.log(`\n======================================================`);
  console.log(`📅 Starting Morning Outreach Planner Worker (Sequence v2)`);
  console.log(`======================================================\n`);

  // 1. Mandatory Kill Switch Check
  const killSwitchRecord = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'kill_switch'))
    .limit(1);
  if (killSwitchRecord.length > 0 && (killSwitchRecord[0].value as any)?.enabled) {
    console.warn('⛔ [Kill Switch Active] STOP ALL OUTREACH is enabled in dashboard. Halting planner.');
    return {
      scheduled: 0,
      scheduledNew: 0,
      scheduledFollowUps: 0,
      skipped: 0,
      accountsAvailable: 0,
      totalDailyQuota: 0,
      details: 'Kill switch active',
    };
  }

  // 2. Check for Pinned Inboxes with AUTH_ERROR and Pause Sequences (Bug #11)
  const authErrorAccounts = await db
    .select({ id: gmailAccounts.id, email: gmailAccounts.email })
    .from(gmailAccounts)
    .where(eq(gmailAccounts.status, 'AUTH_ERROR'));

  if (authErrorAccounts.length > 0) {
    for (const badAcc of authErrorAccounts) {
      const pausedProgress = await db
        .update(leadSequenceProgress)
        .set({
          status: 'PAUSED',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leadSequenceProgress.pinnedGmailAccountId, badAcc.id),
            eq(leadSequenceProgress.status, 'ACTIVE')
          )
        )
        .returning({ id: leadSequenceProgress.id });

      if (pausedProgress.length > 0) {
        console.warn(`⚠️ [Planner] Paused ${pausedProgress.length} sequences pinned to AUTH_ERROR inbox ${badAcc.email}.`);
        await telegramService.notifyCriticalError(
          'Inbox Auth Error - Sequences Paused',
          `Inbox ${badAcc.email} has status AUTH_ERROR. Paused ${pausedProgress.length} active lead sequences to preserve sender identity. Please re-authenticate in settings.`
        );
      }
    }
  }

  // 3. Query Active Gmail Accounts
  const activeAccounts = await db
    .select()
    .from(gmailAccounts)
    .where(eq(gmailAccounts.status, 'ACTIVE'));

  // Auto-resume sequences that were paused if their pinned inbox is now ACTIVE
  for (const account of activeAccounts) {
    await db
      .update(leadSequenceProgress)
      .set({
        status: 'ACTIVE',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leadSequenceProgress.pinnedGmailAccountId, account.id),
          eq(leadSequenceProgress.status, 'PAUSED')
        )
      );
  }

  if (activeAccounts.length === 0) {
    console.warn('⚠️ [Planner] No ACTIVE Gmail accounts connected. Cannot schedule outreach.');
    return {
      scheduled: 0,
      scheduledNew: 0,
      scheduledFollowUps: 0,
      skipped: 0,
      accountsAvailable: 0,
      totalDailyQuota: 0,
      details: 'No active Gmail accounts',
    };
  }

  // 3. Fetch All Active Campaigns (P2-6)
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, 'ACTIVE'))
    .orderBy(campaigns.id);

  if (activeCampaigns.length === 0) {
    console.log('ℹ️ [Planner] No campaigns marked ACTIVE. Halting.');
    return {
      scheduled: 0,
      scheduledNew: 0,
      scheduledFollowUps: 0,
      skipped: 0,
      accountsAvailable: activeAccounts.length,
      totalDailyQuota: 0,
      details: 'No active campaign',
    };
  }

  console.log(`📋 Planning outreach across ${activeCampaigns.length} active campaign(s)...`);

  const currentPtDate = gmailSendingService.getPacificDateStr(); // YYYY-MM-DD
  console.log(`🗓️ Planning date (Pacific reference): ${currentPtDate}`);

  // Fetch already scheduled rows for today across ALL campaigns
  const todayScheduledRows = await db
    .select({
      id: scheduledEmails.id,
      campaignId: scheduledEmails.campaignId,
      gmailAccountId: scheduledEmails.gmailAccountId,
      contactId: scheduledEmails.contactId,
      stepNumber: scheduledEmails.stepNumber,
    })
    .from(scheduledEmails)
    .where(
      and(
        eq(scheduledEmails.scheduledDate, currentPtDate),
        inArray(scheduledEmails.status, ['PENDING', 'SENDING', 'SENT'])
      )
    );

  const alreadyScheduledByAccount = new Map<number, number>();
  const alreadyScheduledContactSteps = new Set<string>();
  for (const row of todayScheduledRows) {
    alreadyScheduledContactSteps.add(`${row.contactId}_step_${row.stepNumber}`);
    const curr = alreadyScheduledByAccount.get(row.gmailAccountId) || 0;
    alreadyScheduledByAccount.set(row.gmailAccountId, curr + 1);
  }

  // Determine allowed email verification statuses
  const allowedEmailStatuses: ('MAILBOX_VERIFIED' | 'VALID' | 'DOMAIN_VALID')[] = env.ALLOW_DOMAIN_VALID_OUTREACH
    ? ['MAILBOX_VERIFIED', 'VALID', 'DOMAIN_VALID']
    : ['MAILBOX_VERIFIED', 'VALID'];

  // Base schedule start time: 9:15 AM Eastern Time dynamically computed in UTC (P3-9 / BUG-05)
  const now = new Date();
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = etFormatter.formatToParts(now);
  const etHour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const etMinute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const nowUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const etNowMinutes = etHour * 60 + etMinute;
  let etOffsetMinutes = etNowMinutes - nowUtcMinutes;
  if (etOffsetMinutes > 720) etOffsetMinutes -= 1440;
  if (etOffsetMinutes < -720) etOffsetMinutes += 1440;

  const targetUtcMinutes = 9 * 60 + 15 - etOffsetMinutes;
  const targetUtcHours = Math.floor(targetUtcMinutes / 60);
  const targetUtcMins = targetUtcMinutes % 60;
  const todayUtcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), targetUtcHours, targetUtcMins, 0));
  const startTime = now.getTime() > todayUtcStart.getTime()
    ? new Date(now.getTime() + 2 * 60 * 1000)
    : todayUtcStart;

  let totalScheduledNew = 0;
  let totalScheduledFollowUps = 0;
  let totalSkipped = 0;

  // 4. Iterate Over All Active Campaigns (P2-6)
  for (let campIdx = 0; campIdx < activeCampaigns.length; campIdx++) {
    const campaign = activeCampaigns[campIdx];
    const remainingCampaigns = activeCampaigns.length - campIdx;
    console.log(`\n======================================================`);
    console.log(`🎯 [Campaign ${campIdx + 1}/${activeCampaigns.length}] "${campaign.name}" (ID: ${campaign.id})`);
    console.log(`======================================================`);

    const { sequence, steps } = await sequenceService.getOrCreateCampaignSequence(campaign.id);
    const metrics = await sequenceService.getSequenceMetrics(sequence.id);

    console.log(
      `📊 [Dynamic Phi Governor] Steps: ${steps.length} | Phi: ${metrics.phi} | Equilibrium: ${Math.round(
        metrics.equilibriumNewRatio * 100
      )}% New / ${Math.round(metrics.equilibriumFollowUpRatio * 100)}% Follow-Up`
    );

    // Apply user-selected capacity bias (bounded to +/- 15%)
    const userBias = parseFloat(sequence.capacityBias || '0.00');
    const targetNewRatio = Math.max(0.15, Math.min(0.85, metrics.equilibriumNewRatio + userBias));
    const targetFuRatio = 1.0 - targetNewRatio;

    // Per-Account Scheduling Loop for this Campaign
    for (const account of activeAccounts) {
      const effectiveLimit = await warmupService.getEffectiveDailyLimit(account.id, account.dailyLimit, account.googleAccountId);
      const sentCount = account.sentToday || 0;
      const scheduledCount = alreadyScheduledByAccount.get(account.id) || 0;
      const usedSlots = sentCount + scheduledCount;
      const totalRemainingSlots = calculateRemainingSlots(sentCount, scheduledCount, effectiveLimit);

      if (totalRemainingSlots <= 0) {
        continue;
      }

      // Proportional fair share of remaining slots for this campaign
      const slotsForThisCampaign = Math.max(1, Math.ceil(totalRemainingSlots / remainingCampaigns));
      const remainingSlots = Math.min(totalRemainingSlots, slotsForThisCampaign);

      console.log(
        `\n  • Inbox: ${account.email} | Target: ${effectiveLimit}/day | Used: ${usedSlots} | Allocated to this campaign: ${remainingSlots}`
      );

      // Bugs #5, #6, #7: Priority Quota Allocation and Isolated Offset
      // Due follow-ups are given first priority to prevent dropping existing conversation threads,
      // while reserving a small floor (at least 2 or 10% of remaining slots) for new leads.
      const initialAccountScheduledToday = alreadyScheduledByAccount.get(account.id) || 0;
      const floorNew = Math.min(remainingSlots, Math.max(2, Math.ceil(remainingSlots * 0.1)));
      const maxAllowedFu = Math.max(0, remainingSlots - floorNew);
      let accountFuScheduled = 0;

      // ─────────────────────────────────────────────────────────────
      // PHASE A: SCHEDULE DUE FOLLOW-UPS (Pinned to this Account)
      // ─────────────────────────────────────────────────────────────
      if (steps.length > 1) {
        const dueFollowUps = await db
          .select({
            progressId: leadSequenceProgress.id,
            leadId: leadSequenceProgress.leadId,
            contactId: leadSequenceProgress.contactId,
            currentStep: leadSequenceProgress.currentStep,
            nextStepDueAt: leadSequenceProgress.nextStepDueAt,
            threadId: leadSequenceProgress.threadId,
            lastRfc822MessageId: leadSequenceProgress.lastRfc822MessageId,
            subscriberCount: leads.subscriberCount,
            channelTitle: leads.channelTitle,
            outreachStatus: leads.outreachStatus,
            email: contacts.email,
          })
          .from(leadSequenceProgress)
          .innerJoin(leads, eq(leadSequenceProgress.leadId, leads.id))
          .innerJoin(contacts, eq(leadSequenceProgress.contactId, contacts.id))
          .where(
            and(
              eq(leadSequenceProgress.sequenceId, sequence.id),
              eq(leadSequenceProgress.pinnedGmailAccountId, account.id),
              eq(leadSequenceProgress.status, 'ACTIVE'),
              sql`${leadSequenceProgress.currentStep} > 1`,
              sql`${leadSequenceProgress.nextStepDueAt} <= NOW()`,
              eq(leads.suppressionStatus, false),
              notInArray(leads.outreachStatus, ['REPLIED', 'UNSUBSCRIBED', 'BOUNCED'])
            )
          );

        // Score and rank due follow-ups:
        // P = 10 * daysOverdue + 1 * currentStep + 2 * log10(subs + 1)
        const scoredFollowUps = dueFollowUps
          .filter((fu) => !alreadyScheduledContactSteps.has(`${fu.contactId}_step_${fu.currentStep}`))
          .map((fu) => {
            const dueTime = fu.nextStepDueAt ? new Date(fu.nextStepDueAt).getTime() : Date.now();
            const daysOverdue = Math.max(0, (Date.now() - dueTime) / (1000 * 60 * 60 * 24));
            const subs = fu.subscriberCount ? Number(fu.subscriberCount) : 0;
            const score = 10 * daysOverdue + 1 * fu.currentStep + 2 * Math.log10(subs + 1);
            return { ...fu, score };
          })
          .sort((a, b) => b.score - a.score);

        // Priority quota allocation: follow-ups can take up to maxAllowedFu
        // Any unused follow-up capacity fluidly spills over into Step 1 below
        const targetFuSlots = Math.min(scoredFollowUps.length, maxAllowedFu);

        for (let i = 0; i < targetFuSlots; i++) {
          const item = scoredFollowUps[i];
          const slotOffsetMinutes = (initialAccountScheduledToday + accountFuScheduled) * 12;
          const scheduledTime = new Date(startTime.getTime() + slotOffsetMinutes * 60 * 1000);

          try {
            const inserted = await db
              .insert(scheduledEmails)
              .values({
                campaignId: campaign.id,
                leadId: item.leadId,
                contactId: item.contactId,
                gmailAccountId: account.id,
                stepNumber: item.currentStep,
                inReplyToRfcId: item.lastRfc822MessageId,
                scheduledAt: scheduledTime,
                scheduledDate: currentPtDate,
                status: 'PENDING',
              })
              .onConflictDoNothing()
              .returning({ id: scheduledEmails.id });

            if (inserted.length > 0) {
              alreadyScheduledContactSteps.add(`${item.contactId}_step_${item.currentStep}`);
              alreadyScheduledByAccount.set(account.id, (alreadyScheduledByAccount.get(account.id) || 0) + 1);
              accountFuScheduled++;
              totalScheduledFollowUps++;
            }
          } catch (err: any) {
            console.warn(`    ⚠️ Follow-up scheduling error for contact ${item.contactId}:`, err.message);
            totalSkipped++;
          }
        }

        console.log(`    🔄 Scheduled ${accountFuScheduled} follow-ups on inbox ${account.email}.`);
      }

      // ─────────────────────────────────────────────────────────────
      // PHASE B: FLUID SPILLOVER INTO STEP 1 (NEW LEADS)
      // ─────────────────────────────────────────────────────────────
      const slotsForNew = Math.max(0, remainingSlots - accountFuScheduled);
      if (slotsForNew <= 0) continue;

      // Fetch already contacted contact IDs in this campaign
      const contactedContacts = await db
        .select({ contactId: messages.contactId })
        .from(messages)
        .where(eq(messages.campaignId, campaign.id));
      const contactedIds = new Set(contactedContacts.map((c) => c.contactId).filter(Boolean));

      // Query Step 1 candidate leads and contacts
      const candidates = await db
        .select({
          leadId: leads.id,
          contactId: contacts.id,
          email: contacts.email,
          emailStatus: contacts.emailStatus,
          verificationReason: contacts.verificationReason,
          confidenceScore: contacts.confidenceScore,
          priorityScore: contacts.priorityScore,
          wasRepaired: contacts.wasRepaired,
          repairedFrom: contacts.repairedFrom,
          repairCode: contacts.repairCode,
          isPrimary: contacts.isPrimary,
          emailCategory: contacts.emailCategory,
          source: contacts.source,
          channelTitle: leads.channelTitle,
          subscriberCount: leads.subscriberCount,
          discoveredAt: leads.discoveredAt,
          country: leads.country,
          category: keywords.category,
          suppressionStatus: leads.suppressionStatus,
          outreachStatus: leads.outreachStatus,
        })
        .from(leads)
        .innerJoin(contacts, eq(leads.id, contacts.leadId))
        .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
        .where(
          and(
            eq(leads.qualificationStatus, 'QUALIFIED'),
            eq(leads.suppressionStatus, false),
            notInArray(leads.outreachStatus, ['CONTACTED', 'REPLIED', 'UNSUBSCRIBED', 'BOUNCED']),
            isNotNull(contacts.email)
          )
        )
        .orderBy(desc(contacts.priorityScore), desc(leads.subscriberCount), desc(leads.discoveredAt))
        .limit(slotsForNew * 10);

      // STRICT DELIVERABILITY & OPPORTUNITY PRIORITY OVERHAUL:
      // Layer 1: Hard negatives are completely dropped
      // Layer 2: Uncertain candidates evaluated against campaign policy
      // Layer 3: Eligible candidates ranked by explainable priority score
      // Priority NEVER overrides deliverability!
      const eligibleCandidates: (typeof candidates[0] & { calculatedTier: OpportunityTier; calculatedPriority: number })[] = [];

      for (const cand of candidates) {
        if (!cand.email) continue;
        if (contactedIds.has(cand.contactId)) continue;
        if (alreadyScheduledContactSteps.has(`${cand.contactId}_step_1`)) continue;

        const eligResult = outreachEligibilityEngine.evaluate(
          {
            contactId: cand.contactId,
            leadId: cand.leadId,
            email: cand.email,
            emailStatus: cand.emailStatus,
            verificationReason: cand.verificationReason,
            confidenceScore: cand.confidenceScore ? Number(cand.confidenceScore) : null,
            isPrimary: cand.isPrimary,
            emailCategory: cand.emailCategory,
            channelTitle: cand.channelTitle,
            subscriberCount: cand.subscriberCount || 0,
            category: cand.category,
            country: cand.country,
            isSuppressed: cand.suppressionStatus,
            alreadyContactedLead: false,
            alreadyContactedContact: false,
            outreachStatus: cand.outreachStatus,
          },
          {
            allowDomainValid: allowedEmailStatuses.includes('DOMAIN_VALID'),
            targetCountry: campaign.targetCountry || undefined,
            minSubscribers: campaign.minSubscribers ? Number(campaign.minSubscribers) : undefined,
            maxSubscribers: campaign.maxSubscribers ? Number(campaign.maxSubscribers) : undefined,
          }
        );

        if (!eligResult.eligible) {
          continue; // Hard negatives & policy exclusions dropped - never forced into quota
        }

        // Evaluate complete opportunity tier and priority score
        const evalScore = opportunityPriorityEngine.scoreCandidate({
          contactId: cand.contactId,
          leadId: cand.leadId,
          email: cand.email,
          isPrimary: cand.isPrimary,
          emailCategory: cand.emailCategory,
          source: cand.source,
          confidenceScore: eligResult.confidenceScore,
          subscriberCount: cand.subscriberCount || 0,
          discoveredAt: cand.discoveredAt,
          category: cand.category,
          country: cand.country,
          emailStatus: cand.emailStatus,
          verificationReasonCode: cand.verificationReason,
          wasRepaired: cand.wasRepaired,
          repairedFrom: cand.repairedFrom,
          repairCode: cand.repairCode,
        });

        // GRADIENT PROGRESSION POLICY:
        // A6: Strong hard negative -> strictly NEVER SEND.
        if (evalScore.opportunityTier === 'A6') {
          continue;
        }

        // A5: Reserve / highly uncertain -> preserved for re-verification, do not consume bulk outreach capacity.
        if (evalScore.opportunityTier === 'A5') {
          continue;
        }

        // A1, A2, A3, A4 are legitimate opportunities with progressively lower expected value!
        eligibleCandidates.push({
          ...cand,
          calculatedTier: evalScore.opportunityTier,
          calculatedPriority: evalScore.priorityScore,
        });
      }

      // Group eligible contacts by leadId for multi-contact 24h staggering
      const leadContactsMap = new Map<number, typeof eligibleCandidates>();
      for (const cand of eligibleCandidates) {
        const list = leadContactsMap.get(cand.leadId) || [];
        list.push(cand);
        leadContactsMap.set(cand.leadId, list);
      }

      // Rank leads by the best available opportunity tier (A1 -> A2 -> A3 -> A4)
      // and priority score descending
      const rankedLeads = Array.from(leadContactsMap.entries()).sort((a, b) => {
        const bestTierA = Math.min(...a[1].map((c) => TIER_ORDER[c.calculatedTier]));
        const bestTierB = Math.min(...b[1].map((c) => TIER_ORDER[c.calculatedTier]));
        if (bestTierA !== bestTierB) return bestTierA - bestTierB;

        const bestScoreA = Math.max(...a[1].map((c) => c.calculatedPriority));
        const bestScoreB = Math.max(...b[1].map((c) => c.calculatedPriority));
        if (bestScoreB !== bestScoreA) return bestScoreB - bestScoreA;

        return (b[1][0]?.subscriberCount || 0) - (a[1][0]?.subscriberCount || 0);
      });

      let accountNewScheduled = 0;
      for (const [leadId, leadContacts] of rankedLeads) {
        if (accountNewScheduled >= slotsForNew) break;

        // Lexicographic Contact Ranking (P7-2 fix):
        // 1. Opportunity tier (A1 > A2 > A3 > A4)
        // 2. Verification status strength (MAILBOX_VERIFIED > VALID > DOMAIN_VALID)
        // 3. Calculated priority score descending
        // 4. Primary flag as secondary tie-breaker
        // 5. Stable contactId ascending
        leadContacts.sort((a, b) => {
          const tierA = TIER_ORDER[a.calculatedTier] || 99;
          const tierB = TIER_ORDER[b.calculatedTier] || 99;
          if (tierA !== tierB) return tierA - tierB;

          const statusWeight: Record<string, number> = {
            MAILBOX_VERIFIED: 1,
            VALID: 2,
            DOMAIN_VALID: 3,
          };
          const weightA = statusWeight[a.emailStatus || ''] || 99;
          const weightB = statusWeight[b.emailStatus || ''] || 99;
          if (weightA !== weightB) return weightA - weightB;

          if (b.calculatedPriority !== a.calculatedPriority) {
            return b.calculatedPriority - a.calculatedPriority;
          }

          if (b.isPrimary !== a.isPrimary) {
            return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
          }

          return a.contactId - b.contactId;
        });

        // Bug #16: Secondary contacts are fallback only, never parallel-spammed.
        // Pick the single best eligible contact for this lead that hasn't been contacted or scheduled.
        const cand = leadContacts.find(
          (c) => c.email && !contactedIds.has(c.contactId) && !alreadyScheduledContactSteps.has(`${c.contactId}_step_1`)
        );
        if (!cand) continue;

        const slotOffsetMinutes = (initialAccountScheduledToday + accountFuScheduled + accountNewScheduled) * 12;
        const scheduledTime = new Date(startTime.getTime() + slotOffsetMinutes * 60 * 1000);

        try {
          let insertedId: number | null = null;
          // ATOMIC TRANSACTION: Insert scheduled email and leadSequenceProgress together (P2-4)
          await db.transaction(async (tx) => {
            const inserted = await tx
              .insert(scheduledEmails)
              .values({
                campaignId: campaign.id,
                leadId: cand.leadId,
                contactId: cand.contactId,
                gmailAccountId: account.id,
                stepNumber: 1,
                scheduledAt: scheduledTime,
                scheduledDate: currentPtDate,
                status: 'PENDING',
              })
              .onConflictDoNothing()
              .returning({ id: scheduledEmails.id });

            if (inserted.length > 0) {
              insertedId = inserted[0].id;
              // Initialize state machine for this lead
              await tx
                .insert(leadSequenceProgress)
                .values({
                  leadId: cand.leadId,
                  campaignId: campaign.id,
                  contactId: cand.contactId,
                  sequenceId: sequence.id,
                  currentStep: 1,
                  status: 'ACTIVE',
                  pinnedGmailAccountId: account.id,
                })
                .onConflictDoNothing();
            }
          });

          if (insertedId !== null) {
            alreadyScheduledContactSteps.add(`${cand.contactId}_step_1`);
            alreadyScheduledByAccount.set(account.id, (alreadyScheduledByAccount.get(account.id) || 0) + 1);
            contactedIds.add(cand.contactId);
            accountNewScheduled++;
            totalScheduledNew++;
          }
        } catch (err: any) {
          console.warn(`    ⚠️ Step 1 scheduling error for contact ${cand.contactId}:`, err.message);
          totalSkipped++;
        }
      }

      console.log(`    ✨ Scheduled ${accountNewScheduled} new Step 1 leads on inbox ${account.email}.`);
    }
  }

  const grandTotal = totalScheduledNew + totalScheduledFollowUps;
  console.log(`\n======================================================`);
  console.log(
    `✅ [Planner Completed] Scheduled ${grandTotal} total emails (${totalScheduledNew} new, ${totalScheduledFollowUps} follow-ups, ${totalSkipped} skipped).`
  );
  console.log(`======================================================\n`);

  return {
    scheduled: grandTotal,
    scheduledNew: totalScheduledNew,
    scheduledFollowUps: totalScheduledFollowUps,
    skipped: totalSkipped,
    accountsAvailable: activeAccounts.length,
    totalDailyQuota: activeAccounts.length * 25,
    details: `Scheduled ${totalScheduledNew} new touches and ${totalScheduledFollowUps} follow-up touches across ${activeAccounts.length} inboxes.`,
  };
}

if (require.main === module) {
  runPlanner()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal planner crash:', err);
      process.exit(1);
    });
}
