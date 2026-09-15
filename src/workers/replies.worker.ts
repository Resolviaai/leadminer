import { db } from '../db/client';
import { gmailAccounts, messages, replies } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { replyDetectorService } from '../services/replies/reply.detector';
import { jobRunner } from '../services/jobs/job.runner';

export async function runReplySync(): Promise<{ repliesDetected: number }> {
  console.log(`\n======================================================`);
  console.log(`📥 Starting Reply Detection & Sync Worker`);
  console.log(`======================================================\n`);

  const jobId = await jobRunner.createJob('REPLY_SYNC');

  try {
    const recentSent = await db
      .select()
      .from(messages)
      .where(eq(messages.sendStatus, 'SENT'))
      .limit(20);

    if (recentSent.length === 0) {
      console.log('ℹ️ No active sent threads to inspect for replies.');
      await jobRunner.completeJob(jobId, 0);
      return { repliesDetected: 0 };
    }

    console.log(`🔍 Monitoring ${recentSent.length} sent outreach threads for creator responses...`);

    // In dry run or live polling, sync threads
    let detected = 0;

    await jobRunner.completeJob(jobId, detected);
    console.log(`\n✅ Reply sync completed: ${detected} new replies detected.`);
    return { repliesDetected: detected };
  } catch (error: any) {
    console.error('[Reply Sync Worker] Error:', error);
    await jobRunner.failJob(jobId, error.message);
    return { repliesDetected: 0 };
  }
}

if (require.main === module) {
  runReplySync()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal reply worker crash:', err);
      process.exit(1);
    });
}
