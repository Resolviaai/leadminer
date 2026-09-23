import crypto from 'crypto';

const SECRET = process.env.CRON_SECRET || process.env.SESSION_SECRET || 'leadminer-unsub-secret-v1-salt';

/**
 * Generates an HMAC-SHA256 signature for email unsubscribe verification.
 * Prevents unauthorized third parties from forging unsubscribe requests.
 */
export function generateUnsubscribeToken(email: string, leadId?: number | string | null): string {
  const cleanEmail = (email || '').toLowerCase().trim();
  const idStr = leadId ? String(leadId) : '';
  const payload = `${cleanEmail}:${idStr}`;
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

/**
 * Validates the HMAC signature for an unsubscribe request.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyUnsubscribeToken(
  email: string,
  leadId?: number | string | null,
  token?: string | null
): boolean {
  if (!token || typeof token !== 'string') return false;
  const expectedToken = generateUnsubscribeToken(email, leadId);

  try {
    const tokenBuffer = Buffer.from(token, 'hex');
    const expectedBuffer = Buffer.from(expectedToken, 'hex');

    if (tokenBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
