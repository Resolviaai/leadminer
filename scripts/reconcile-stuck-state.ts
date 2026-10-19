import { db } from '../src/db/client';
import { keywords, jobs } from '../src/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

async function main() {
  console.log('🔄 Reconciling stuck in-flight DB state...');

  // 1. Find all keywords currently stuck in PROCESSING
  const stuckKeywords = await db
    .select({ id: keywords.id, keyword: keywords.keyword, attemptCount: keywords.attemptCount })
    .from(keywords)
    .where(eq(keywords.status, 'PROCESSING'));

  console.log(`Found ${stuckKeywords.length} stuck PROCESSING keyword(s):`, stuckKeywords.map(k => `#${k.id} "${k.keyword}"`));

  if (stuckKeywords.length > 0) {
    const ids = stuckKeywords.map(k => k.id);
    const updated = await db
      .update(keywords)
      .set({
        status: 'PENDING',
        attemptCount: sql`GREATEST(0, ${keywords.attemptCount} - 1)`,
        lastError: 'Reset from abandoned PROCESSING state due to Vercel invocation timeout',
        updatedAt: new Date(),
      })
      .where(inArray(keywords.id, ids))
      .returning({ id: keywords.id });

    console.log(`✅ Successfully reset ${updated.length} keyword(s) to PENDING with attemptCount decremented.`);
  }

  // 2. Mark abandoned RUNNING jobs as FAILED
  const stuckJobs = await db
    .select({ id: jobs.id, jobType: jobs.jobType, startedAt: jobs.startedAt })
    .from(jobs)
    .where(eq(jobs.status, 'RUNNING'));

  console.log(`Found ${stuckJobs.length} stuck RUNNING job(s):`, stuckJobs.map(j => `#${j.id} ${j.jobType}`));

  if (stuckJobs.length > 0) {
    const jobIds = stuckJobs.map(j => j.id);
    const updatedJobs = await db
      .update(jobs)
      .set({
        status: 'FAILED',
        error: 'Process terminated unexpectedly due to serverless execution timeout (recovered)',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(jobs.id, jobIds))
      .returning({ id: jobs.id });

    console.log(`✅ Successfully marked ${updatedJobs.length} abandoned job(s) as FAILED.`);
  }

  console.log('🎉 DB state reconciliation completed.');
  process.exit(0);
}

main().catch(err => {
  console.error('Reconciliation error:', err);
  process.exit(1);
});
