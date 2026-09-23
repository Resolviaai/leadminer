import { db } from '../db/client';
import { logs, jobs, gmailAccounts, leads, scheduledEmails, leadSequenceProgress, contacts, messages } from '../db/schema';
import { lt, and, inArray, eq, isNotNull, sql } from 'drizzle-orm';
import { jobRunner } from '../services/jobs/job.runner';
import { quotaManager } from '../services/youtube/quota';
import { reconcilePendingLeadQualifications } from './verification.worker';
import { telegramService } from '../services/notifications/telegram.service';
import { gmailSendingService } from '../services/outreach/gmail.service';

export async function runCleanup(): Promise<{
  recoveredKeywords: number;
  recoveredJobs: number;
  recoveredLeads: number;
  requalifiedLeads: number;
  logsPruned: boolean;
}> {
  console.log(`\n======================================================`);
  console.log(`🧹 Running System Watchdog & Cleanup Worker`);
  console.log(`======================================================\n`);

  const jobId = await jobRunner.createJob('CLEANUP');

  try {
    // 1. Recover stale keywords and abandoned jobs (> 30m timeout)
    const recovery = await jobRunner.recoverStaleJobsAndKeywords(30);

    // 2. Recover any stale QUEUED v1 leads and stale SENDING scheduled emails (BUG-03)
    const recoveredLeads = await jobRunner.recoverStaleOutreachLeads(30);
    const recoveredScheduledEmails = await jobRunner.recoverStaleScheduledEmails(30);

    // 3. Reconcile pending lead qualifications against active campaigns
    const requalifiedLeads = await reconcilePendingLeadQualifications();

    // 4. Prune logs older than 30 days to maintain fast query performance
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
      await db.delete(logs).where(lt(logs.createdAt, thirtyDaysAgo));
      console.log(`[Watchdog] Pruned audit logs older than 30 days.`);
    } catch (logErr: any) {
      console.warn(`[Watchdog] Note on log pruning:`, logErr.message);
    }

    // 5. Prune completed or failed jobs older than 60 days
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    try {
      await db.delete(jobs).where(
        and(
          inArray(jobs.status, ['COMPLETED', 'FAILED', 'STOPPED_QUOTA']),
          lt(jobs.createdAt, sixtyDaysAgo)
        )
      );
    } catch (jobErr: any) {
      // Non-critical
    }

    // 6. Sync YouTube quota and check Pacific Time daily reset
    const quota = await quotaManager.syncQuotaState();
    console.log(`[Quota Check] Search calls today: ${quota.searchCallsUsedToday}/${quota.searchCallsDailyLimit}`);

    // 7. Check for Gmail accounts nearing 7-day token expiration (Google Testing Mode)
    try {
      const activeInboxes = await db
        .select({
          id: gmailAccounts.id,
          email: gmailAccounts.email,
          tokenGrantedAt: gmailAccounts.tokenGrantedAt,
        })
        .from(gmailAccounts)
        .where(eq(gmailAccounts.status, 'ACTIVE'));

      for (const inbox of activeInboxes) {
        if (inbox.tokenGrantedAt) {
          const daysOld = Math.floor((Date.now() - new Date(inbox.tokenGrantedAt).getTime()) / (24 * 60 * 60 * 1000));
          if (daysOld >= 5) {
            console.warn(`⚠️ [Token Expiry Warning] Inbox ${inbox.email} token is ${daysOld} days old (Testing Mode)!`);
            await telegramService.notifyCriticalError(
              'Gmail OAuth Token Expiry Warning',
              `Inbox ${inbox.email} token was granted ${daysOld} days ago. In Google Testing mode, refresh tokens expire after 7 days. Reconnect this account at /gmail to prevent outreach disruption.`
            );
          }
        }
      }
    } catch (tokenWarnErr: any) {
      console.warn('[Cleanup Watchdog] Error checking token expiry:', tokenWarnErr.message);
    }

    // 8. Re-cancel orphaned sequences/scheduled emails for leads that already replied, bounced, or unsubscribed (TASK-17 / P1-14)
    try {
      const suppressedOrRepliedLeads = await db
        .select({ id: leads.id, status: leads.outreachStatus })
        .from(leads)
        .where(inArray(leads.outreachStatus, ['REPLIED', 'UNSUBSCRIBED', 'BOUNCED']));

      const leadIds = suppressedOrRepliedLeads.map((l) => l.id);
      if (leadIds.length > 0) {
        const cancelledScheduled = await db
          .update(scheduledEmails)
          .set({
            status: 'CANCELLED',
            error: 'Cleanup watchdog: lead already replied, unsubscribed, or bounced',
            updatedAt: new Date(),
          })
          .where(and(inArray(scheduledEmails.leadId, leadIds), eq(scheduledEmails.status, 'PENDING')))
          .returning({ id: scheduledEmails.id });

        if (cancelledScheduled.length > 0) {
          console.warn(`[Cleanup Watchdog] Cancelled ${cancelledScheduled.length} orphaned pending scheduled email(s) for replied/suppressed leads.`);
        }

        await db
          .update(leadSequenceProgress)
          .set({
            status: 'CANCELLED_REPLY',
            nextStepDueAt: null,
            updatedAt: new Date(),
          })
          .where(and(inArray(leadSequenceProgress.leadId, leadIds), eq(leadSequenceProgress.status, 'ACTIVE')));
      }
    } catch (cancelErr: any) {
      console.warn('[Cleanup Watchdog] Error re-cancelling sequences for suppressed leads:', cancelErr.message);
    }

    // 9. Recover stale scraping link pages (> 15 minutes) and stuck verification contacts (TASK-35 / P2-25)
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const resetScraping = await db
        .update(contacts)
        .set({
          linkScrapeStatus: 'PENDING',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(contacts.linkScrapeStatus, 'SCRAPING'),
            lt(contacts.updatedAt, fifteenMinutesAgo)
          )
        )
        .returning({ id: contacts.id });

      if (resetScraping.length > 0) {
        console.warn(`[Cleanup Watchdog] Reset ${resetScraping.length} stale scraping link page contact(s) back to PENDING.`);
      }

      const resetVerifying = await db
        .update(contacts)
        .set({
          verificationProvider: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(contacts.verificationProvider, 'IN_PROGRESS'),
            lt(contacts.updatedAt, fifteenMinutesAgo)
          )
        )
        .returning({ id: contacts.id });

      if (resetVerifying.length > 0) {
        console.warn(`[Cleanup Watchdog] Reset ${resetVerifying.length} stuck in-progress verification contact(s).`);
      }
    } catch (staleContactErr: any) {
      console.warn('[Cleanup Watchdog] Error resetting stale contact statuses:', staleContactErr.message);
    }

    // 10. Comply with YouTube 30-day data retention: null rawPayload on leads older than 30 days (TASK-34 / P2-31 / P2-32)
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const prunedLeads = await db
        .update(leads)
        .set({
          rawPayload: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            lt(leads.discoveredAt, thirtyDaysAgo),
            isNotNull(leads.rawPayload)
          )
        )
        .returning({ id: leads.id });

      if (prunedLeads.length > 0) {
        console.log(`[Cleanup Watchdog] Pruned raw YouTube payload for ${prunedLeads.length} leads older than 30 days.`);
      }
    } catch (pruneErr: any) {
      console.warn('[Cleanup Watchdog] Error pruning 30-day raw lead payloads:', pruneErr.message);
    }

    // 11. Reconcile crashed Gmail reservations (P2-28):
    // Compare account.sentToday against actual messages marked 'SENT' today in Pacific Time.
    // If a worker crashed after reserving an account but before sending or completing,
    // and no emails are currently in-flight SENDING, synchronize sentToday to match reality.
    try {
      const activeInboxes = await db
        .select({ id: gmailAccounts.id, email: gmailAccounts.email, sentToday: gmailAccounts.sentToday })
        .from(gmailAccounts)
        .where(eq(gmailAccounts.status, 'ACTIVE'));

      const ptTodayStr = gmailSendingService.getPacificDateStr(); // YYYY-MM-DD
      const ptMidnight = new Date(`${ptTodayStr}T00:00:00-07:00`);

      for (const inbox of activeInboxes) {
        const actualSentResult = await db.execute<{ count: string }>(sql`
          SELECT COUNT(*)::text as count
          FROM ${messages}
          WHERE ${messages.gmailAccountId} = ${inbox.id}
            AND ${messages.sendStatus} = 'SENT'
            AND ${messages.sentAt} >= ${ptMidnight}
        `);
        const actualCount = parseInt(actualSentResult.rows[0]?.count || '0', 10);

        const inFlightResult = await db.execute<{ count: string }>(sql`
          SELECT COUNT(*)::text as count
          FROM ${scheduledEmails}
          WHERE ${scheduledEmails.gmailAccountId} = ${inbox.id}
            AND ${scheduledEmails.status} = 'SENDING'
            AND ${scheduledEmails.updatedAt} > NOW() - INTERVAL '5 minutes'
        `);
        const inFlightCount = parseInt(inFlightResult.rows[0]?.count || '0', 10);

        if ((inbox.sentToday || 0) > actualCount + inFlightCount) {
          const correctedCount = actualCount + inFlightCount;
          console.warn(`[Cleanup Watchdog] Reconciled crashed Gmail reservations for ${inbox.email}: sentToday corrected from ${inbox.sentToday} to ${correctedCount}.`);
          await db
            .update(gmailAccounts)
            .set({ sentToday: correctedCount, updatedAt: new Date() })
            .where(eq(gmailAccounts.id, inbox.id));
        }
      }
    } catch (reconcileErr: any) {
      console.warn('[Cleanup Watchdog] Note on Gmail reservation reconciliation:', reconcileErr.message);
    }

    const totalProcessed = recovery.recoveredKeywords + recovery.recoveredJobs + recoveredLeads + requalifiedLeads;
    await jobRunner.completeJob(jobId, totalProcessed);
    console.log(
      `✅ Cleanup completed. ${recovery.recoveredKeywords} keywords reset, ${recovery.recoveredJobs} abandoned jobs closed, ${recoveredLeads} leads unlocked, ${requalifiedLeads} leads qualified.`
    );

    return {
      recoveredKeywords: recovery.recoveredKeywords,
      recoveredJobs: recovery.recoveredJobs,
      recoveredLeads,
      requalifiedLeads,
      logsPruned: true,
    };
  } catch (error: any) {
    console.error('[Cleanup Worker] Error:', error);
    await jobRunner.failJob(jobId, error.message);
    return {
      recoveredKeywords: 0,
      recoveredJobs: 0,
      recoveredLeads: 0,
      requalifiedLeads: 0,
      logsPruned: false,
    };
  }
}

if (require.main === module) {
  runCleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal cleanup crash:', err);
      process.exit(1);
    });
}
