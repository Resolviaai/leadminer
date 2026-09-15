import { NextRequest, NextResponse } from 'next/server';
import { runVerificationBatch } from '@/workers/verification.worker';

export async function POST(req: NextRequest) {
  try {
    const result = await runVerificationBatch(25);
    return NextResponse.redirect(new URL('/leads', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
