import { db } from '../db/client';
import {
  campaigns,
  leads,
  contacts,
  gmailAccounts,
  messages,
  scheduledEmails,
  systemSettings,
} from '../db/schema';
import { eq, and, inArray, isNotNull, sql } from 'drizzle-orm';
import { env } from '../config/env';
import { gmailSendingService } from '../services/outreach/gmail.service';
import { jobRunner } from '../services/jobs/job.runner';

export interface PlannerResult {
  scheduled: number;
  skipped: number;
  accountsAvailable: number;
  totalDailyQuota: number;
  details?: string;
}

/**
 * Morning Planner Worker
 * Runs once daily (e.g. at 09:00 EDT / 13:00 UTC) to prepare the day's dispatch schedule.
 *
 * Randomizer & Safety Architecture:
 * 1. Volume Jitter: 18-25 emails/day per active connected Gmail account.
 * 2. Time Jitter: Disperses timestamps organically across 9 AM - 5 PM recipient time (never clockwork).
 * 3. Multi-Contact Staggering: Separates contacts for the same channel hours apart (never simultaneous).
 * 4. Account Rotation: Interleaves sending accounts (Account A -> B -> C -> A) to distribute IP/domain load.
 * 5. Idempotent: Can be triggered multiple times safely without double-scheduling.
 */
export async function runPlanner(): Promise<PlannerResult> {
  console.log(`\n======================================================`);
  console.log(`📅 Starting Morning Outreach Planner Worker`);
  console.log(`======================================================\n`);

  // 1. Mandatory Kill Switch Check
  const killSwitchRecord = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'kill_switch'))
    .limit(1);
  if (killSwitchRecord.length > 0 && (killSwitchRecord[0].value as any)?.enabled) {
    console.warn('⛔ [Kill Switch Active] STOP ALL OUTREACH is enabled in dashboard. Halting planner.');
    return { scheduled: 0, skipped: 0, accountsAvailable: 0, totalDailyQuota: 0, details: 'Kill switch active' };
  }

  // 2. Fetch Active Campaign
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, 'ACTIVE'))
    .limit(5);

  if (activeCampaigns.length === 0) {
    console.log('ℹ️ [Planner] No campaigns marked ACTIVE. Halting (will not plan without an active campaign).');
    return { scheduled: 0, skipped: 0, accountsAvailable: 0, totalDailyQuota: 0, details: 'No active campaign' };
  }

  const campaign = activeCampaigns[0];
  console.log(`📋 Planning schedule for campaign: "${campaign.name}" (ID: ${campaign.id})`);

  // 3. Query Active Gmail Accounts (supports 1 to 10+ accounts)
  const activeAccounts = await db
    .select()
    .from(gmailAccounts)
    .where(eq(gmailAccounts.status, 'ACTIVE'));

  if (activeAccounts.length === 0) {
    console.warn('⚠️ [Planner] No ACTIVE Gmail accounts connected. Cannot schedule outreach.');
    return { scheduled: 0, skipped: 0, accountsAvailable: 0, totalDailyQuota: 0, details: 'No active Gmail accounts' };
  }

  const currentPtDate = gmailSendingService.getPacificDateStr(); // YYYY-MM-DD
  console.log(`🗓️ Planning date (Pacific reference): ${currentPtDate}`);

  // Fetch already scheduled rows for today to avoid exceeding daily capacity
  const todayScheduledRows = await db
    .select({
      id: scheduledEmails.id,
      gmailAccountId: scheduledEmails.gmailAccountId,
      contactId: scheduledEmails.contactId,
      leadId: scheduledEmails.leadId,
      status: scheduledEmails.status,
    })
    .from(scheduledEmails)
    .where(
      and(
        eq(scheduledEmails.campaignId, campaign.id),
        eq(scheduledEmails.scheduledDate, currentPtDate),
        inArray(scheduledEmails.status, ['PENDING', 'SENDING', 'SENT'])
      )
    );

  const alreadyScheduledByAccount = new Map<number, number>();
  const alreadyScheduledContactIds = new Set<number>();
  for (const row of todayScheduledRows) {
    alreadyScheduledContactIds.add(row.contactId);
    const curr = alreadyScheduledByAccount.get(row.gmailAccountId) || 0;
    alreadyScheduledByAccount.set(row.gmailAccountId, curr + 1);
  }

  // Calculate remaining capacity per account for today using daily volume jitter (18-25)
  interface AccountQuota {
    account: typeof activeAccounts[0];
    effectiveLimit: number;
    remainingSlots: number;
  }

  const accountQuotas: AccountQuota[] = [];
  let totalSlotsNeeded = 0;

  for (const account of activeAccounts) {
    const effectiveLimit = gmailSendingService.getTodayEffectiveLimit(account.id, account.dailyLimit);
    const sentCount = account.sentToday || 0;
    const scheduledCount = alreadyScheduledByAccount.get(account.id) || 0;
    const usedSlots = Math.max(sentCount, scheduledCount);
    const remainingSlots = Math.max(0, effectiveLimit - usedSlots);

    accountQuotas.push({
      account,
      effectiveLimit,
      remainingSlots,
    });
    totalSlotsNeeded += remainingSlots;

    console.log(
      `  • Account: ${account.email} | Target: ${effectiveLimit}/day | Used/Scheduled: ${usedSlots} | Remaining slots: ${remainingSlots}`
    );
  }

  if (totalSlotsNeeded <= 0) {
    console.log('✅ [Planner] All active accounts have already reached their scheduled daily quota for today.');
    return {
      scheduled: 0,
      skipped: 0,
      accountsAvailable: activeAccounts.length,
      totalDailyQuota: accountQuotas.reduce((sum, a) => sum + a.effectiveLimit, 0),
      details: 'Daily quota already fulfilled',
    };
  }

  // 4. Determine allowed email verification statuses
  const allowedEmailStatuses: ('MAILBOX_VERIFIED' | 'VALID' | 'DOMAIN_VALID')[] = env.ALLOW_DOMAIN_VALID_OUTREACH
    ? ['MAILBOX_VERIFIED', 'VALID', 'DOMAIN_VALID']
    : ['MAILBOX_VERIFIED', 'VALID'];

  // Fetch already sent messages in this campaign to never re-contact sent contacts
  const sentMessages = await db
    .select({
      contactId: messages.contactId,
      cleanEmail: sql<string>`lower(trim(${messages.recipientEmail}))`.as('clean_email'),
    })
    .from(messages)
    .where(
      and(
        eq(messages.campaignId, campaign.id),
        inArray(messages.sendStatus, ['SENT', 'SENDING', 'UNCONFIRMED'])
      )
    );

  const sentContactIds = new Set<number>();
  const sentEmailAddresses = new Set<string>();
  for (const sm of sentMessages) {
    if (sm.contactId) sentContactIds.add(sm.contactId);
    if (sm.cleanEmail) sentEmailAddresses.add(sm.cleanEmail);
  }

  // 5. Query Qualified Candidate Contacts
  const candidateRows = await db
    .select({
      leadId: leads.id,
      contactId: contacts.id,
      email: contacts.email,
      channelTitle: leads.channelTitle,
      isPrimary: contacts.isPrimary,
      outreachStatus: leads.outreachStatus,
    })
    .from(leads)
    .innerJoin(contacts, eq(leads.id, contacts.leadId))
    .where(
      and(
        eq(leads.qualificationStatus, 'QUALIFIED'),
        eq(leads.suppressionStatus, false),
        inArray(contacts.emailStatus, allowedEmailStatuses),
        isNotNull(contacts.email)
      )
    )
    .limit(totalSlotsNeeded * 5);

  // Filter candidates: must not be sent before, must not be scheduled today
  const eligibleCandidates = candidateRows.filter((c) => {
    if (!c.email) return false;
    const cleanEmail = c.email.toLowerCase().trim();
    if (sentContactIds.has(c.contactId)) return false;
    if (alreadyScheduledContactIds.has(c.contactId)) return false;
    if (sentEmailAddresses.has(cleanEmail)) return false;
    return true;
  });

  if (eligibleCandidates.length === 0) {
    console.log('ℹ️ [Planner] No eligible contacts available to schedule at this time.');
    return {
      scheduled: 0,
      skipped: 0,
      accountsAvailable: activeAccounts.length,
      totalDailyQuota: totalSlotsNeeded,
      details: 'No eligible candidate contacts',
    };
  }

  // 6. Group by Lead ID to enable Multi-Contact Staggering
  // If a lead has Contact A and Contact B, they will be separated across time/accounts
  const contactsByLead = new Map<number, typeof eligibleCandidates>();
  for (const cand of eligibleCandidates) {
    const list = contactsByLead.get(cand.leadId) || [];
    // Deduplicate by email address per lead
    if (!list.some((existing) => existing.email?.toLowerCase().trim() === cand.email?.toLowerCase().trim())) {
      list.push(cand);
      contactsByLead.set(cand.leadId, list);
    }
  }

  // Flatten into a staggered queue:
  // Pass 1: Primary contacts for each lead
  // Pass 2: Secondary contacts for each lead (staggered to later in the queue)
  const primaryQueue: typeof eligibleCandidates = [];
  const secondaryQueue: typeof eligibleCandidates = [];

  for (const [, leadContacts] of contactsByLead.entries()) {
    // Sort contacts: primary first
    leadContacts.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    if (leadContacts[0]) {
      primaryQueue.push(leadContacts[0]);
    }
    for (let i = 1; i < leadContacts.length; i++) {
      secondaryQueue.push(leadContacts[i]);
    }
  }

  // Assemble final contact list up to totalSlotsNeeded
  const finalContactsToSchedule: typeof eligibleCandidates = [];
  for (const c of primaryQueue) {
    if (finalContactsToSchedule.length >= totalSlotsNeeded) break;
    finalContactsToSchedule.push(c);
  }
  // Fill remaining slots with secondary contacts (staggered)
  if (finalContactsToSchedule.length < totalSlotsNeeded) {
    for (const c of secondaryQueue) {
      if (finalContactsToSchedule.length >= totalSlotsNeeded) break;
      finalContactsToSchedule.push(c);
    }
  }

  const countToSchedule = finalContactsToSchedule.length;
  console.log(`🎯 Scheduling ${countToSchedule} emails across ${activeAccounts.length} account(s) for today.`);

  // 7. Calculate Timestamp Distribution Across US Business Hours (9:00 AM – 5:00 PM EDT / 13:00 – 21:00 UTC)
  // Window: 8 hours = 480 minutes
  const now = new Date();
  // Anchor to today 13:15 UTC (9:15 AM EDT) or current time if running after 13:15 UTC
  const todayUtcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 15, 0));
  const startTime = now.getTime() > todayUtcStart.getTime()
    ? new Date(now.getTime() + 2 * 60 * 1000) // start 2 mins from now if running midday
    : todayUtcStart;

  const windowMinutes = 450; // ~7.5 hours sending span
  const baseIntervalMinutes = Math.max(8, Math.floor(windowMinutes / Math.max(1, countToSchedule)));

  // 8. Account Distributor: Interleave accounts so each account sends gradually throughout the day
  const accountPool: number[] = [];
  for (const aq of accountQuotas) {
    for (let i = 0; i < aq.remainingSlots; i++) {
      accountPool.push(aq.account.id);
    }
  }

  // Interleave the account pool (Round-robin shuffle)
  // If accounts are [1, 1, 1, 2, 2, 2], interleave to [1, 2, 1, 2, 1, 2]
  const interleavedAccountIds: number[] = [];
  const accountsMap = new Map<number, number[]>();
  for (const id of accountPool) {
    const list = accountsMap.get(id) || [];
    list.push(id);
    accountsMap.set(id, list);
  }
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const [, list] of accountsMap.entries()) {
      if (list.length > 0) {
        interleavedAccountIds.push(list.shift()!);
        hasMore = true;
      }
    }
  }

  // 9. Generate Scheduled Entries with Natural Time Jitter
  let scheduledCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < countToSchedule; idx++) {
    const contactItem = finalContactsToSchedule[idx];
    const assignedAccountId = interleavedAccountIds[idx % interleavedAccountIds.length];

    // Jitter: interval ± 35% of interval length
    const jitterRange = baseIntervalMinutes * 0.35;
    const jitterMinutes = (Math.random() * (jitterRange * 2)) - jitterRange;
    const slotMinuteOffset = Math.round(idx * baseIntervalMinutes + jitterMinutes);

    const scheduledTime = new Date(startTime.getTime() + slotMinuteOffset * 60 * 1000);

    try {
      // Atomic insert with ON CONFLICT DO NOTHING to guarantee idempotency
      await db
        .insert(scheduledEmails)
        .values({
          campaignId: campaign.id,
          leadId: contactItem.leadId,
          contactId: contactItem.contactId,
          gmailAccountId: assignedAccountId,
          scheduledAt: scheduledTime,
          scheduledDate: currentPtDate,
          status: 'PENDING',
        })
        .onConflictDoNothing({
          target: [
            scheduledEmails.contactId,
            scheduledEmails.campaignId,
            scheduledEmails.scheduledDate,
          ],
        });

      scheduledCount++;
    } catch (err: any) {
      console.warn(`  ⚠️ Failed to schedule contact ${contactItem.contactId}: ${err.message}`);
      skippedCount++;
    }
  }

  console.log(`\n✅ [Planner Completed] Scheduled ${scheduledCount} emails for today (${skippedCount} skipped).`);
  return {
    scheduled: scheduledCount,
    skipped: skippedCount,
    accountsAvailable: activeAccounts.length,
    totalDailyQuota: totalSlotsNeeded,
    details: `Successfully scheduled ${scheduledCount} emails with time and volume jitter across ${activeAccounts.length} inboxes.`,
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
