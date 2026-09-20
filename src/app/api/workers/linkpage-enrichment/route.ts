import { NextRequest, NextResponse } from 'next/server';
import { runLinkpageEnrichmentBatch } from '@/workers/linkpage-enrichment.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 120 seconds max execution duration

export async function GET(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { searchParams } = new URL(req.url);
  const batchSize = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  try {
    const result = await runLinkpageEnrichmentBatch(batchSize);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { searchParams } = new URL(req.url);
  const batchSize = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  try {
    const result = await runLinkpageEnrichmentBatch(batchSize);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
