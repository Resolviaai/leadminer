import { NextRequest, NextResponse } from 'next/server';
import { runDiscoveryBatch } from '@/workers/discovery.worker';

export async function POST(req: NextRequest) {
  try {
    const result = await runDiscoveryBatch(10);
    return NextResponse.redirect(new URL('/keywords', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
