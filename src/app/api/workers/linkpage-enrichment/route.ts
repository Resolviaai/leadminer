import { NextRequest, NextResponse } from 'next/server';
import { runLinkpageEnrichmentBatch } from '@/workers/linkpage-enrichment.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { withAdvisoryLock, LOCK_KEYS } from '@/lib/pipeline-lock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds execution limit for Hobby plan

async function handleLinkpage(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { searchParams } = new URL(req.url);
  const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
  const batchSize = isNaN(rawLimit) ? 20 : Math.max(1, Math.min(50, rawLimit));

  try {
    const lockResult = await withAdvisoryLock(LOCK_KEYS.LINKPAGE, 'Linkpage Enrichment Worker', async () => {
      return await runLinkpageEnrichmentBatch(batchSize);
    });

    if (!lockResult.executed) {
      return NextResponse.json({ success: true, skipped: true, reason: lockResult.reason }, { status: 409 });
    }

    return NextResponse.json({ success: true, result: lockResult.result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleLinkpage(req);
}

export async function POST(req: NextRequest) {
  return handleLinkpage(req);
}
