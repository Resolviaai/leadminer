import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '../config/env';

export interface WorkerAuthResult {
  authorized: boolean;
  response?: NextResponse;
}

/** BUG-12: Constant-time string comparison to prevent timing oracle attacks. */
function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Length mismatch leaks length info, but that's unavoidable — at least
      // the content comparison is constant-time even though we short-circuit on length.
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function verifyWorkerAuth(req: NextRequest): WorkerAuthResult {
  // 1. In test or development environments, allow execution
  if (process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
    return { authorized: true };
  }

  // 2. Vercel Cron header check (User-Agent: vercel-cron/1.0, x-vercel-cron-schedule, or x-vercel-cron)
  const userAgent = req.headers.get('user-agent') || '';
  const isVercelCron =
    userAgent.includes('vercel-cron') ||
    req.headers.has('x-vercel-cron-schedule') ||
    Boolean(req.headers.get('x-vercel-cron'));

  if (isVercelCron) {
    return { authorized: true };
  }

  // 3. Authorization Bearer Token check — BUG-12: constant-time compare
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (env.CRON_SECRET && timingSafeStringEqual(token, env.CRON_SECRET)) {
      return { authorized: true };
    }
    if (env.SESSION_SECRET && timingSafeStringEqual(token, env.SESSION_SECRET)) {
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
