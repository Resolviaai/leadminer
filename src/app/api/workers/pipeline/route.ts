import { NextRequest, NextResponse } from 'next/server';
import { runCleanup } from '@/workers/cleanup.worker';
import { runReplySync } from '@/workers/replies.worker';
import { runDiscoveryBatch } from '@/workers/discovery.worker';
import { runVerificationBatch } from '@/workers/verification.worker';
import { runPlanner } from '@/workers/planner.worker';
import { runDispatcher } from '@/workers/dispatcher.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { withAdvisoryLock, LOCK_KEYS } from '@/lib/pipeline-lock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max execution duration for Vercel Hobby plan compatibility

async function executePipeline() {
  const startedAt = new Date();
  const results: Record<string, any> = {};

  // 0. Watchdog & Self-Healing: Recover stale jobs/keywords/leads, reconcile qualifications, and prune old logs
  try {
    console.log('[Pipeline] Step 0/5: Running system watchdog & self-healing cleanup...');
    results.cleanup = await runCleanup();
  } catch (err: any) {
    console.error('[Pipeline] Error in cleanup step:', err);
    results.cleanup = { error: err.message };
  }

  // 1. Check for creator replies first (so we don't outreach creators who responded)
  try {
    console.log('[Pipeline] Step 1/5: Checking creator replies...');
    results.replies = await runReplySync();
  } catch (err: any) {
    console.error('[Pipeline] Error in replies step:', err);
    results.replies = { error: err.message };
  }

  // 2. Discover new YouTube channels using keyword queue (lean batch: 12 keywords to stay under 15s)
  try {
    console.log('[Pipeline] Step 2/5: Running channel discovery batch (12 keywords)...');
    results.discovery = await runDiscoveryBatch(12);
  } catch (err: any) {
    console.error('[Pipeline] Error in discovery step:', err);
    results.discovery = { error: err.message };
  }

  // 3. Verify extracted contact emails & auto-qualify eligible leads (lean batch: 25 contacts)
  try {
    console.log('[Pipeline] Step 3/5: Running email verification batch (25 contacts)...');
    results.verification = await runVerificationBatch(25);
  } catch (err: any) {
    console.error('[Pipeline] Error in verification step:', err);
    results.verification = { error: err.message };
  }

  // 4. Plan today's outreach schedule (volume jitter, time jitter, multi-contact staggering)
  try {
    console.log('[Pipeline] Step 4/5: Running morning planner to distribute daily schedule...');
    results.planner = await runPlanner();
  } catch (err: any) {
    console.error('[Pipeline] Error in planner step:', err);
    results.planner = { error: err.message };
  }

  // 5. Run immediate dispatcher tick for any emails scheduled due right now
  try {
    console.log('[Pipeline] Step 5/5: Running initial dispatch check...');
    results.dispatch = await runDispatcher(2);
  } catch (err: any) {
    console.error('[Pipeline] Error in dispatch step:', err);
    results.dispatch = { error: err.message };
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  return {
    success: true,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationSeconds: Number((durationMs / 1000).toFixed(2)),
    pipeline: results,
  };
}

async function handlePipelineRequest(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const lockResult = await withAdvisoryLock(LOCK_KEYS.DAILY_PIPELINE, 'Daily Pipeline', async () => {
      return await executePipeline();
    });

    if (!lockResult.executed) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: lockResult.reason,
      });
    }

    return NextResponse.json(lockResult.result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handlePipelineRequest(req);
}

export async function POST(req: NextRequest) {
  return handlePipelineRequest(req);
}
