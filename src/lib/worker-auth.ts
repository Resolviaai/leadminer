import { NextRequest, NextResponse } from 'next/server';
import { env } from '../config/env';

export interface WorkerAuthResult {
  authorized: boolean;
  response?: NextResponse;
}

export function verifyWorkerAuth(req: NextRequest): WorkerAuthResult {
  // 1. In test or development environments, allow execution
  if (process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
    return { authorized: true };
  }

  // 2. Vercel Cron header check (automatically populated by Vercel infrastructure)
  const vercelCronHeader = req.headers.get('x-vercel-cron');
  if (vercelCronHeader) {
    return { authorized: true };
  }

  // 3. Authorization Bearer Token check (CRON_SECRET or SESSION_SECRET)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (env.CRON_SECRET && token === env.CRON_SECRET) {
      return { authorized: true };
    }
    if (env.SESSION_SECRET && token === env.SESSION_SECRET) {
      return { authorized: true };
    }
  }

  // 4. Same-origin UI action check (dispatched from dashboard buttons)
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'same-origin') {
    return { authorized: true };
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host && origin.includes(host)) {
    return { authorized: true };
  }

  const referer = req.headers.get('referer');
  if (referer && host && referer.includes(host)) {
    return { authorized: true };
  }

  // 5. Unauthorized
  return {
    authorized: false,
    response: NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid worker credentials or untrusted origin' },
      { status: 401 }
    ),
  };
}
