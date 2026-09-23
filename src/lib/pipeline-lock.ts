import { getDbPool } from '../db/client';
import { env } from '../config/env';

/**
 * PostgreSQL Advisory Lock helper.
 *
 * Prevents concurrent overlapping pipeline or dispatcher runs.
 * Uses a dedicated checked-out client from the pool so that pg_try_advisory_lock
 * and pg_advisory_unlock are guaranteed to execute on the same PostgreSQL backend session.
 *
 * In production, fails CLOSED on database error to prevent race conditions and duplicate sends.
 */

// Stable 32-bit integer lock keys for different pipeline tasks
export const LOCK_KEYS = {
  DAILY_PIPELINE: 10001,
  DISPATCHER: 10002,
  REPLY_SYNC: 10003,
  DISCOVERY: 10004,
  VERIFICATION: 10005,
} as const;

/**
 * Wraps an async operation with an atomic PostgreSQL advisory lock.
 * If the lock cannot be acquired or another process holds it, returns { executed: false, reason: '...' }.
 */
export async function withAdvisoryLock<T>(
  lockKey: number,
  taskName: string,
  operation: () => Promise<T>
): Promise<{ executed: boolean; result?: T; reason?: string }> {
  const pool = getDbPool();
  let client;

  try {
    client = await pool.connect();
  } catch (connErr: any) {
    console.error(`[AdvisoryLock] Connection error acquiring lock for ${taskName}:`, connErr.message);
    // In local dev/test without Postgres, allow operation to run
    if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
      const result = await operation();
      return { executed: true, result };
    }
    // Production: FAIL CLOSED (N-P1-1)
    return {
      executed: false,
      reason: `LOCK_CONNECTION_FAILED: Database unavailable for ${taskName} advisory lock (${connErr.message})`,
    };
  }

  let lockAcquired = false;

  try {
    const res = await client.query('SELECT pg_try_advisory_lock($1) AS acquired', [lockKey]);
    lockAcquired = Boolean(res.rows[0]?.acquired);

    if (!lockAcquired) {
      console.warn(`⚠️ [AdvisoryLock] ${taskName} is already running in another process (key ${lockKey}). Skipping.`);
      return {
        executed: false,
        reason: `ALREADY_RUNNING: ${taskName} is locked by another process`,
      };
    }

    // Execute protected operation while holding lock on this exact client connection
    const result = await operation();
    return { executed: true, result };
  } catch (err: any) {
    console.error(`[AdvisoryLock] Error during locked operation for ${taskName}:`, err.message);
    if (!lockAcquired && (env.NODE_ENV === 'test' || env.NODE_ENV === 'development')) {
      const result = await operation();
      return { executed: true, result };
    }
    throw err;
  } finally {
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [lockKey]);
      } catch (unlockErr: any) {
        console.warn(`[AdvisoryLock] Error unlocking ${taskName} (key ${lockKey}):`, unlockErr.message);
      }
    }
    client.release();
  }
}
