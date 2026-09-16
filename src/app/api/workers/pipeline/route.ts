import { NextRequest, NextResponse } from 'next/server';
import { runReplySync } from '@/workers/replies.worker';
import { runDiscoveryBatch } from '@/workers/discovery.worker';
import { runVerificationBatch } from '@/workers/verification.worker';
import { runOutreachBatch } from '@/workers/outreach.worker';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 300s max execution duration for batch processing

async function executePipeline() {
  const startedAt = new Date();
  const results: Record<string, any> = {};

  // 1. Check for creator replies first (so we don't outreach creators who responded)
  try {
    console.log('[Pipeline] Step 1/4: Checking creator replies...');
    results.replies = await runReplySync();
  } catch (err: any) {
    console.error('[Pipeline] Error in replies step:', err);
    results.replies = { error: err.message };
  }

  // 2. Discover new YouTube channels using keyword queue (quota safe: 15 searches / 100 daily limit, ~5 general units / 10,000)
  try {
    console.log('[Pipeline] Step 2/4: Running channel discovery batch (15 keywords)...');
    results.discovery = await runDiscoveryBatch(15);
  } catch (err: any) {
    console.error('[Pipeline] Error in discovery step:', err);
    results.discovery = { error: err.message };
  }

  // 3. Verify extracted contact emails
  try {
    console.log('[Pipeline] Step 3/4: Running email verification batch (up to 50 contacts)...');
    results.verification = await runVerificationBatch(50);
  } catch (err: any) {
    console.error('[Pipeline] Error in verification step:', err);
    results.verification = { error: err.message };
  }

  // 4. Dispatch outreach to verified and qualified leads (dynamically scaled across all active accounts)
  try {
    console.log('[Pipeline] Step 4/4: Running personalized outreach batch (dynamic account capacity)...');
    results.outreach = await runOutreachBatch();
  } catch (err: any) {
    console.error('[Pipeline] Error in outreach step:', err);
    results.outreach = { error: err.message };
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

// Vercel Cron sends GET requests
export async function GET(req: NextRequest) {
  try {
    const summary = await executePipeline();
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Support manual POST trigger from buttons / curl
export async function POST(req: NextRequest) {
  try {
    const summary = await executePipeline();
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
