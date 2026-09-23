import { NextRequest, NextResponse } from 'next/server';
import { runDiscoveryBatch } from '@/workers/discovery.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max for Vercel Hobby plan compatibility

export async function POST(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const result = await runDiscoveryBatch(10);
    if (
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
