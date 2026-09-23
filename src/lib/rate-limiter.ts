/**
 * Shared in-memory sliding-window IP rate limiter
 * Used across public-facing routes (/api/unsubscribe, /api/health, /api/auth/login, /api/gdpr/delete).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Periodic cleanup of expired entries every 10 minutes
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores.entries()) {
      for (const [ip, entry] of store.entries()) {
        if (now > entry.resetAt) {
          store.delete(ip);
        }
      }
    }
  }, 10 * 60 * 1000).unref?.();
}

/**
 * Checks whether an IP has exceeded the allowed number of requests in a given time window.
 *
 * @param bucket Name of the rate-limit bucket (e.g. 'unsubscribe', 'health', 'gdpr')
 * @param ip Client IP address
 * @param limit Maximum allowed requests within windowMs
 * @param windowMs Window duration in milliseconds (default: 60,000 ms = 1 min)
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
export function checkRateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  scheduleCleanup();

  if (!stores.has(bucket)) {
    stores.set(bucket, new Map());
  }
  const store = stores.get(bucket)!;

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extracts client IP safely from request headers (x-forwarded-for, x-real-ip)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
