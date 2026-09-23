import { NextRequest, NextResponse } from 'next/server';
import { verifyDashboardAuth } from '@/lib/api-auth';
import { runDispatcher } from '@/workers/dispatcher.worker';
import { withAdvisoryLock, LOCK_KEYS } from '@/lib/pipeline-lock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const lockResult = await withAdvisoryLock(LOCK_KEYS.DISPATCHER, 'Manual Dispatcher', async () => {
      return await runDispatcher(3);
    });

    if (!lockResult.executed) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: lockResult.reason || 'Dispatcher is currently running in another process.',
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, result: lockResult.result });
  } catch (error: any) {
    console.error('[Action: Dispatch] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
