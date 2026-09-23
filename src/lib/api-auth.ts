import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { db } from '../db/client';
import { systemSettings } from '../db/schema';

// ─── Session token structure ──────────────────────────────────────────────────
// Signed token: base64(payload).base64(hmac)
// Persistent 30-day session with SameSite=Lax for reliable PWA & mobile retention.

const COOKIE_NAME = 'lm_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

// ─── Cryptographic Password Hashing Helpers ───────────────────────────────────

export function hashPasswordWithSalt(password: string, existingSalt?: string) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
    return (
      computedHash.length === storedHash.length &&
      crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash))
    );
  } catch {
    return false;
  }
}

// ─── Supabase Auth Integration ────────────────────────────────────────────────

export async function verifySupabaseAuth(email: string, password: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL || env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    if (!error && data.user && data.session) {
      return true;
    }
  } catch (err: any) {
    console.warn('[Supabase Auth] Login check error:', err.message);
  }
  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface DashboardAuthResult {
  authorized: boolean;
  email?: string;
  response?: NextResponse;
}

/**
 * Creates a signed session cookie string after successful login.
 * Uses SameSite=Lax and Path=/ so installed PWAs and top-level navigation retain sessions.
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
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`,
  ];
  if (isProduction) parts.push('Secure');

  return parts.join('; ');
}

/**
 * Cookie value to clear the session.
 */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
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
 * Validate login credentials:
 * 1. Primary: Supabase Auth API (auth.users)
 * 2. Secondary: PostgreSQL system_settings (salted scrypt)
 * 3. Fallback: Environment variables
 */
export async function validateLoginCredentialsAsync(email: string, password: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) return false;

  // 1. Primary: Verify with Supabase Auth
  const isSupabaseValid = await verifySupabaseAuth(cleanEmail, cleanPassword);
  if (isSupabaseValid) return true;

  // 2. Secondary: Check PostgreSQL system_settings (salted scrypt)
  try {
    const record = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'admin_auth'))
      .limit(1);

    if (record.length > 0 && record[0].value) {
      const data = record[0].value as {
        email?: string;
        password_hash?: string;
        salt?: string;
      };

      if (data.email && data.password_hash && data.salt) {
        if (data.email.trim().toLowerCase() === cleanEmail) {
          const isMatch = verifyPassword(cleanPassword, data.password_hash, data.salt);
          if (isMatch) return true;
        }
      }
    }
  } catch (err: any) {
    console.warn('[Auth] Database scrypt check error:', err.message);
  }

  // 3. Fallback: Environment variables
  return validateLoginCredentials(cleanEmail, cleanPassword);
}

/**
 * Synchronous validation against env vars (used in unit tests and fallback).
 */
export function validateLoginCredentials(email: string, password: string): boolean {
  const expectedEmail = (env.DASHBOARD_EMAIL || '').trim().toLowerCase();
  const expectedPassword = (env.DASHBOARD_PASSWORD || '').trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!expectedEmail || !expectedPassword) return false;

  const emailMatch =
    cleanEmail.length === expectedEmail.length &&
    crypto.timingSafeEqual(Buffer.from(cleanEmail), Buffer.from(expectedEmail));

  const passwordMatch =
    cleanPassword.length === expectedPassword.length &&
    crypto.timingSafeEqual(Buffer.from(cleanPassword), Buffer.from(expectedPassword));

  return emailMatch && passwordMatch;
}

export { COOKIE_NAME };
