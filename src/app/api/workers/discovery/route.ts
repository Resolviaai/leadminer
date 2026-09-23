import { NextRequest, NextResponse } from 'next/server';
import { runDiscoveryBatch } from '@/workers/discovery.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max for Vercel Hobby plan compatibility

async function handleDiscovery(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const url = new URL(req.url);
    const rawBatch = parseInt(url.searchParams.get('batchSize') || '10', 10);
    const batchSize = isNaN(rawBatch) ? 10 : Math.min(Math.max(rawBatch, 1), 20);

    const result = await runDiscoveryBatch(batchSize);

    if (
      req.method === 'GET' ||
      req.headers.get('accept')?.includes('application/json') ||
      req.headers.get('content-type')?.includes('application/json')
    ) {
      return NextResponse.json({ success: true, result });
    }
    return NextResponse.redirect(new URL('/keywords', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleDiscovery(req);
}

export async function POST(req: NextRequest) {
  return handleDiscovery(req);
}
