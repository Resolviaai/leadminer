import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '../config/env';

export interface WorkerAuthResult {
  authorized: boolean;
  response?: NextResponse;
}

/**
 * Constant-time string comparison — prevents timing oracle attacks where
 * response latency leaks secret length or content via === comparison.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    // Length mismatch still leaks length, but that's unavoidable at this layer.
    // The critical thing is the content comparison is constant-time.
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Worker route authentication — Bearer token ONLY.
 *
 * Previously this also trusted Vercel cron headers (User-Agent: vercel-cron),
 * sec-fetch-site: same-origin, origin/referer matching — all of which can be
 * trivially forged by any HTTP client. Those branches are permanently removed.
 *
 * Only the CRON_SECRET Bearer token is trusted. Every scheduler (GitHub Actions,
 * cron-job.org) must send: Authorization: Bearer <CRON_SECRET>
 *
 * In test/development, auth is bypassed so local development works without secrets.
 */
export function verifyWorkerAuth(
  req: NextRequest,
  options?: { forceEnforce?: boolean }
): WorkerAuthResult {
  // Test / development bypass — can be overridden in tests via forceEnforce: true
  if (!options?.forceEnforce && (env.NODE_ENV === 'test' || env.NODE_ENV === 'development')) {
    return { authorized: true };
  }

  // Production: CRON_SECRET must be set — fail loud at startup if missing
  if (!env.CRON_SECRET) {
    console.error('[WorkerAuth] FATAL: CRON_SECRET is not set in production. All worker routes are locked.');
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Server misconfiguration: authentication secret not configured' },
        { status: 503 }
      ),
    };
  }

  // Bearer token check — only trusted auth method
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (timingSafeStringEqual(token, env.CRON_SECRET)) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    response: NextResponse.json(
      { success: false, error: 'Unauthorized: valid Bearer token required' },
      { status: 401 }
    ),
  };
}
