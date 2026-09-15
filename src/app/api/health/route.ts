import { NextResponse } from 'next/server';
import { runHealthCheck } from '@/scripts/healthcheck';

export async function GET() {
  const result = await runHealthCheck();
  return NextResponse.json(result);
}
