import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '../config/env';

// ─── Session token structure ──────────────────────────────────────────────────
// Simple signed token: base64(payload).base64(hmac)
// No external JWT library needed — keeps dependencies minimal.

const COOKIE_NAME = 'lm_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SessionPayload {
  email: string;
  iat: number; // issued at (unix ms)
  exp: number; // expires at (unix ms)
}

function signPayload(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', env.SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;

    const expectedSig = crypto
      .createHmac('sha256', env.SESSION_SECRET)
      .update(data)
      .digest('base64url');

    // Constant-time comparison
    if (
      sig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (Date.now() > payload.exp) return null; // expired

    return payload;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface DashboardAuthResult {
  authorized: boolean;
  email?: string;
  response?: NextResponse;
}

/**
 * Creates a signed session cookie string after successful login.
 */
export function createSessionCookie(email: string): string {
  const now = Date.now();
  const payload: SessionPayload = { email, iat: now, exp: now + SESSION_DURATION_MS };
  const token = signPayload(payload);

  const isProduction = env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`,
  ];
  if (isProduction) parts.push('Secure');

  return parts.join('; ');
}

/**
 * Cookie value to clear the session.
 */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/**
 * Verify a dashboard API request has a valid session cookie.
 * In test/dev: always authorized (so local dev works without logging in).
 */
export function verifyDashboardAuth(req: NextRequest): DashboardAuthResult {
  if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
    return { authorized: true, email: 'dev@local' };
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const token = match ? match[1] : null;

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: session required' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: invalid or expired session' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, email: payload.email };
}

/**
 * Validate login credentials against env vars.
 */
export function validateLoginCredentials(email: string, password: string): boolean {
  const expectedEmail = (env.DASHBOARD_EMAIL || '').trim().toLowerCase();
  const expectedPassword = (env.DASHBOARD_PASSWORD || '').trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!expectedEmail || !expectedPassword) return false;

  // Constant-time comparisons for both fields
  const emailMatch =
    cleanEmail.length === expectedEmail.length &&
    crypto.timingSafeEqual(Buffer.from(cleanEmail), Buffer.from(expectedEmail));

  const passwordMatch =
    cleanPassword.length === expectedPassword.length &&
    crypto.timingSafeEqual(Buffer.from(cleanPassword), Buffer.from(expectedPassword));

  return emailMatch && passwordMatch;
}

export { COOKIE_NAME };
