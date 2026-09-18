import { NextRequest, NextResponse } from 'next/server';
import { runDispatcher } from '@/workers/dispatcher.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Max 120 seconds (allows 30-45s natural pause buffer)

export async function GET(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const result = await runDispatcher(2);
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

  try {
    const result = await runDispatcher(2);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
