import { NextRequest, NextResponse } from 'next/server';
import { runDispatcher } from '@/workers/dispatcher.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { withAdvisoryLock, LOCK_KEYS } from '@/lib/pipeline-lock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max for Vercel Hobby plan compatibility

export async function GET(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const lockResult = await withAdvisoryLock(LOCK_KEYS.DISPATCHER, 'Dispatcher', async () => {
      return await runDispatcher(3);
    });

    if (!lockResult.executed) {
      return NextResponse.json({ success: true, skipped: true, reason: lockResult.reason });
    }

    return NextResponse.json({ success: true, result: lockResult.result });
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
    const lockResult = await withAdvisoryLock(LOCK_KEYS.DISPATCHER, 'Dispatcher', async () => {
      return await runDispatcher(3);
    });

    if (!lockResult.executed) {
      return NextResponse.json({ success: true, skipped: true, reason: lockResult.reason });
    }

    return NextResponse.json({ success: true, result: lockResult.result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

