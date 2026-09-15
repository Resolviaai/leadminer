import { jobRunner } from '../services/jobs/job.runner';
import { quotaManager } from '../services/youtube/quota';

export async function runCleanup(): Promise<void> {
  console.log(`\n======================================================`);
  console.log(`🧹 Running System Watchdog & Cleanup Worker`);
  console.log(`======================================================\n`);

  const jobId = await jobRunner.createJob('CLEANUP');

  try {
    // 1. Recover stale keywords and jobs
    const recovery = await jobRunner.recoverStaleJobsAndKeywords(30);

    // 2. Sync YouTube quota and check Pacific Time daily reset
    const quota = await quotaManager.syncQuotaState();
    console.log(`[Quota Check] Search calls today: ${quota.searchCallsUsedToday}/${quota.searchCallsDailyLimit}`);

    await jobRunner.completeJob(jobId, recovery.recoveredKeywords + recovery.recoveredJobs);
    console.log(`✅ Cleanup completed. ${recovery.recoveredKeywords} keywords reset, ${recovery.recoveredJobs} abandoned jobs closed.`);
  } catch (error: any) {
    console.error('[Cleanup Worker] Error:', error);
    await jobRunner.failJob(jobId, error.message);
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
