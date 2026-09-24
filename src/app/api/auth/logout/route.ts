import { NextResponse } from 'next/server';
import { clearSessionCookie, clearClientAuthCookie } from '../../../../lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', clearSessionCookie());
  res.headers.append('Set-Cookie', clearClientAuthCookie());
  return res;
}
