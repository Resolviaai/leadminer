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
} from '../../src/db/schema';
import { eq, and, inArray, isNotNull, sql, notInArray, desc } from 'drizzle-orm';
import { env } from '../config/env';
import { gmailSendingService } from '../services/outreach/gmail.service';
import { sequenceService } from '../services/outreach/sequence.service';
import { warmupService } from '../services/outreach/warmup.service';

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

  // 2. Query Active Gmail Accounts
  const activeAccounts = await db
    .select()
    .from(gmailAccounts)
    .where(eq(gmailAccounts.status, 'ACTIVE'));

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

      // Target Follow-up capacity for this inbox today
      const targetFuSlots = Math.floor(remainingSlots * targetFuRatio);
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

        // P2-27: Strict Phi Governor — follow-ups capped strictly to targetFuSlots
        // Unused follow-up capacity fluidly spills over into Step 1 below
        const maxAllowedFu = Math.min(scoredFollowUps.length, targetFuSlots);

        for (let i = 0; i < maxAllowedFu; i++) {
          const item = scoredFollowUps[i];
          const slotOffsetMinutes = (accountFuScheduled + totalScheduledNew) * 12;
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

      // Query qualified Step 1 candidate leads sorted by subscriber count (Decision 8)
      const candidates = await db
        .select({
          leadId: leads.id,
          contactId: contacts.id,
          email: contacts.email,
          channelTitle: leads.channelTitle,
          subscriberCount: leads.subscriberCount,
          isPrimary: contacts.isPrimary,
        })
        .from(leads)
        .innerJoin(contacts, eq(leads.id, contacts.leadId))
        .where(
          and(
            eq(leads.qualificationStatus, 'QUALIFIED'),
            eq(leads.suppressionStatus, false),
            notInArray(leads.outreachStatus, ['CONTACTED', 'REPLIED', 'UNSUBSCRIBED', 'BOUNCED']),
            inArray(contacts.emailStatus, allowedEmailStatuses),
            isNotNull(contacts.email)
          )
        )
        .orderBy(desc(leads.subscriberCount), desc(leads.discoveredAt))
        .limit(slotsForNew * 5);

      // Group contacts by leadId for multi-contact 24h staggering (Decision 6, P1-13)
      const leadContactsMap = new Map<number, typeof candidates>();
      for (const cand of candidates) {
        const list = leadContactsMap.get(cand.leadId) || [];
        list.push(cand);
        leadContactsMap.set(cand.leadId, list);
      }

      let accountNewScheduled = 0;
      for (const [leadId, leadContacts] of leadContactsMap.entries()) {
        if (accountNewScheduled >= slotsForNew) break;

        // Primary contact first
        leadContacts.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

        for (let cIdx = 0; cIdx < leadContacts.length; cIdx++) {
          const cand = leadContacts[cIdx];
          if (!cand.email) continue;
          if (contactedIds.has(cand.contactId)) continue;
          if (alreadyScheduledContactSteps.has(`${cand.contactId}_step_1`)) continue;

          if (cIdx === 0) {
            // Primary contact: schedule for today
            if (accountNewScheduled >= slotsForNew) break;
            const slotOffsetMinutes = (accountFuScheduled + accountNewScheduled) * 12;
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
          } else {
            // Secondary contact: staggered +24h * cIdx (P1-9: Pacific Timezone)
            const slotOffsetMinutes = (accountFuScheduled + accountNewScheduled) * 12;
            const staggeredTime = new Date(startTime.getTime() + (cIdx * 24 * 60 + slotOffsetMinutes) * 60 * 1000);
            const staggeredDateStr = gmailSendingService.getPacificDateStr(staggeredTime);

            try {
              let insertedSecId: number | null = null;
              // ATOMIC TRANSACTION: Insert staggered scheduled email and progress together (P2-4)
              await db.transaction(async (tx) => {
                const inserted = await tx
                  .insert(scheduledEmails)
                  .values({
                    campaignId: campaign.id,
                    leadId: cand.leadId,
                    contactId: cand.contactId,
                    gmailAccountId: account.id,
                    stepNumber: 1,
                    scheduledAt: staggeredTime,
                    scheduledDate: staggeredDateStr,
                    status: 'PENDING',
                  })
                  .onConflictDoNothing()
                  .returning({ id: scheduledEmails.id });

                if (inserted.length > 0) {
                  insertedSecId = inserted[0].id;
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

              if (insertedSecId !== null) {
                alreadyScheduledContactSteps.add(`${cand.contactId}_step_1`);
                contactedIds.add(cand.contactId);
                if (staggeredDateStr === currentPtDate) {
                  alreadyScheduledByAccount.set(account.id, (alreadyScheduledByAccount.get(account.id) || 0) + 1);
                  accountNewScheduled++;
                  totalScheduledNew++;
                }
              }
            } catch (err: any) {
              console.warn(`    ⚠️ Staggered Step 1 scheduling error for secondary contact ${cand.contactId}:`, err.message);
            }
          }
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
