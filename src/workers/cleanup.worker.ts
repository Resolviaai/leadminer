import { db } from '../db/client';
import { logs, jobs, gmailAccounts } from '../db/schema';
import { lt, and, inArray, eq } from 'drizzle-orm';
import { jobRunner } from '../services/jobs/job.runner';
import { quotaManager } from '../services/youtube/quota';
import { reconcilePendingLeadQualifications } from './verification.worker';
import { telegramService } from '../services/notifications/telegram.service';

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
