import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}
