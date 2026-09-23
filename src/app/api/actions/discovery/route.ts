import { NextRequest, NextResponse } from 'next/server';
import { verifyDashboardAuth } from '@/lib/api-auth';
import { runDiscoveryBatch } from '@/workers/discovery.worker';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const result = await runDiscoveryBatch(10);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[Action: Discovery] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
