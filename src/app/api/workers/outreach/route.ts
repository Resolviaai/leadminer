import { NextRequest, NextResponse } from 'next/server';
import { runOutreachBatch } from '@/workers/outreach.worker';

export async function POST(req: NextRequest) {
  try {
    const result = await runOutreachBatch(10);
    return NextResponse.redirect(new URL('/campaigns', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
