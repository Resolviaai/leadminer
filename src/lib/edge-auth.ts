import { NextRequest } from 'next/server';

const COOKIE_NAME = 'lm_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Edge Runtime compatible session verification using Web Crypto API.
 * Contains ZERO Node.js module dependencies ('crypto', 'dotenv', 'fs', etc.)
 * allowing Next.js Edge Middleware to compile and execute without warnings or errors.
 */
export async function verifySessionCookieEdge(
  req: NextRequest,
  secret: string
): Promise<{ authorized: boolean; email?: string; iat?: number; exp?: number }> {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    const token = match ? match[1] : null;

    if (!token) return { authorized: false };

    const [data, sig] = token.split('.');
    if (!data || !sig || !secret) return { authorized: false };

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert base64url to binary Uint8Array
    const base64Sig = sig.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64Sig.length % 4)) % 4;
    const paddedSig = base64Sig + '='.repeat(padLen);
    const binarySig = Uint8Array.from(atob(paddedSig), (c) => c.charCodeAt(0));

    const dataBytes = encoder.encode(data);

    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, dataBytes);
    if (!isValid) return { authorized: false };

    const base64Data = data.replace(/-/g, '+').replace(/_/g, '/');
    const paddedData = base64Data + '='.repeat((4 - (base64Data.length % 4)) % 4);
    const payload = JSON.parse(atob(paddedData));

    if (Date.now() > payload.exp) {
      return { authorized: false };
    }

    return {
      authorized: true,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return { authorized: false };
  }
}

/**
 * Creates a signed session cookie string in Edge Runtime using Web Crypto API.
 * Enables rolling session refresh in Middleware.
 */
export async function createSessionCookieEdge(
  email: string,
  secret: string,
  isProduction: boolean
): Promise<string> {
  const now = Date.now();
  const payload = { email, iat: now, exp: now + SESSION_DURATION_MS };
  const encoder = new TextEncoder();
  const data = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const token = `${data}.${sig}`;

  const expiresDate = new Date(now + SESSION_DURATION_MS).toUTCString();
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`,
    `Expires=${expiresDate}`,
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

export { COOKIE_NAME };
