import { NextRequest } from 'next/server';

const COOKIE_NAME = 'lm_session';

/**
 * Edge Runtime compatible session verification using Web Crypto API.
 * Contains ZERO Node.js module dependencies ('crypto', 'dotenv', 'fs', etc.)
 * allowing Next.js Edge Middleware to compile and execute without warnings or errors.
 */
export async function verifySessionCookieEdge(
  req: NextRequest,
  secret: string
): Promise<{ authorized: boolean; email?: string }> {
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

    return { authorized: true, email: payload.email };
  } catch {
    return { authorized: false };
  }
}

export { COOKIE_NAME };
