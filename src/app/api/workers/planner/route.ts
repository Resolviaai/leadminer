import { NextRequest, NextResponse } from 'next/server';
import { runPlanner } from '@/workers/planner.worker';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const result = await runPlanner();
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
    const result = await runPlanner();
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
