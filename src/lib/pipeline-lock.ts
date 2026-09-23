import { db } from '../db/client';
import { sql } from 'drizzle-orm';

/**
 * PostgreSQL Advisory Lock helper.
 *
 * Prevents concurrent overlapping pipeline or dispatcher runs.
 * If another worker is already holding the lock, immediately returns
 * { acquired: false } without waiting, preventing race conditions and double sends.
 */

// Stable 32-bit integer lock keys for different pipeline tasks
export const LOCK_KEYS = {
  DAILY_PIPELINE: 10001,
  DISPATCHER: 10002,
  REPLY_SYNC: 10003,
  DISCOVERY: 10004,
  VERIFICATION: 10005,
} as const;

export async function tryAcquireAdvisoryLock(lockKey: number): Promise<boolean> {
  try {
    const result = await db.execute<{ acquired: boolean }>(
      sql`SELECT pg_try_advisory_lock(${lockKey}) AS acquired;`
    );
    const rows = (result as any).rows ?? result;
    return Boolean(rows[0]?.acquired);
  } catch (error: any) {
    console.warn(`[AdvisoryLock] Error acquiring lock ${lockKey}:`, error.message);
    // In local sqlite/dev without postgres advisory locks, allow execution
    return true;
  }
}

export async function releaseAdvisoryLock(lockKey: number): Promise<void> {
  try {
    await db.execute(sql`SELECT pg_advisory_unlock(${lockKey});`);
  } catch (error: any) {
    console.warn(`[AdvisoryLock] Error releasing lock ${lockKey}:`, error.message);
  }
}

/**
 * Wraps an async operation with an atomic advisory lock.
 * If the lock cannot be acquired, returns { executed: false, reason: 'LOCKED' }.
 */
export async function withAdvisoryLock<T>(
  lockKey: number,
  taskName: string,
  operation: () => Promise<T>
): Promise<{ executed: boolean; result?: T; reason?: string }> {
  const acquired = await tryAcquireAdvisoryLock(lockKey);
  if (!acquired) {
    console.warn(`⚠️ [AdvisoryLock] ${taskName} is already running in another process. Skipping.`);
    return { executed: false, reason: `ALREADY_RUNNING: ${taskName} is locked by another process` };
  }

  try {
    const result = await operation();
    return { executed: true, result };
  } finally {
    await releaseAdvisoryLock(lockKey);
  }
}
