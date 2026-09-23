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

async function executeSingleStep(stepName: string) {
  const startedAt = new Date();
  let result: any;

  switch (stepName.toLowerCase()) {
    case 'cleanup':
      result = await runCleanup();
      break;
    case 'replies':
      result = await runReplySync();
      break;
    case 'discovery':
      result = await runDiscoveryBatch(10);
      break;
    case 'verification':
      result = await runVerificationBatch(25);
      break;
    case 'planner':
      result = await runPlanner();
      break;
    case 'dispatch':
      result = await runDispatcher(3);
      break;
    default:
      throw new Error(`Unknown pipeline step: "${stepName}". Valid steps: cleanup, replies, discovery, verification, planner, dispatch`);
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  return {
    success: true,
    step: stepName,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationSeconds: Number((durationMs / 1000).toFixed(2)),
    result,
  };
}

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

  // 2. Discover new YouTube channels using keyword queue (lean batch: 10 keywords)
  try {
    console.log('[Pipeline] Step 2/5: Running channel discovery batch (10 keywords)...');
    results.discovery = await runDiscoveryBatch(10);
  } catch (err: any) {
    console.error('[Pipeline] Error in discovery step:', err);
    results.discovery = { error: err.message };
  }

  // Defensive elapsed time check to avoid Vercel 60s hard kill
  const elapsedSeconds = (Date.now() - startedAt.getTime()) / 1000;
  if (elapsedSeconds > 40) {
    console.warn(`[Pipeline] Execution taking ${elapsedSeconds}s, skipping remaining steps to avoid Hobby timeout.`);
    return {
      success: true,
      partial: true,
      durationSeconds: Number(elapsedSeconds.toFixed(2)),
      pipeline: results,
      notice: 'Skipped planner and dispatch due to execution time limit. Use step-by-step triggers.',
    };
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

  const step = req.nextUrl.searchParams.get('step');

  try {
    const lockResult = await withAdvisoryLock(
      LOCK_KEYS.DAILY_PIPELINE,
      step ? `Pipeline Step: ${step}` : 'Daily Pipeline',
      async () => {
        if (step) {
          return await executeSingleStep(step);
        }
        return await executePipeline();
      }
    );

    if (!lockResult.executed) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          reason: lockResult.reason,
        },
        { status: 409 }
      );
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
