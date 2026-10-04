import { NextRequest, NextResponse } from 'next/server';
import { runPlanner } from '@/workers/planner.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { withAdvisoryLock, LOCK_KEYS } from '@/lib/pipeline-lock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handlePlanner(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const lockResult = await withAdvisoryLock(LOCK_KEYS.PLANNER, 'Planner Worker', async () => {
      return await runPlanner();
    });

    if (!lockResult.executed) {
      return NextResponse.json({ success: true, skipped: true, reason: lockResult.reason }, { status: 409 });
    }

    const result = lockResult.result;

    if (
      req.headers.get('accept')?.includes('application/json') ||
      req.headers.get('content-type')?.includes('application/json')
    ) {
      return NextResponse.json({ success: true, result });
    }
    return NextResponse.redirect(new URL('/campaigns', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handlePlanner(req);
}

export async function POST(req: NextRequest) {
  return handlePlanner(req);
}
