import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockConnect = vi.fn();
const mockGetDbPool = vi.fn(() => ({
  connect: mockConnect,
}));

vi.mock('../../src/db/client', () => ({
  getDbPool: () => mockGetDbPool(),
}));

import { withAdvisoryLock, LOCK_KEYS } from '../../src/lib/pipeline-lock';
import { env } from '../../src/config/env';

describe('N-P1-1 / N-P2-12 Advisory Lock Dedicated Session & Fail-Closed Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acquires and releases advisory lock on the exact same dedicated database connection', async () => {
    const mockQuery = vi.fn();
    const mockRelease = vi.fn();

    mockQuery
      .mockResolvedValueOnce({ rows: [{ acquired: true }] }) // pg_try_advisory_lock
      .mockResolvedValueOnce({ rows: [{ pg_advisory_unlock: true }] }); // pg_advisory_unlock

    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });

    let operationRan = false;
    const res = await withAdvisoryLock(LOCK_KEYS.DISPATCHER, 'DISPATCHER', async () => {
      operationRan = true;
      return { sent: 5 };
    });

    expect(res.executed).toBe(true);
    expect(res.result).toEqual({ sent: 5 });
    expect(operationRan).toBe(true);

    // Verify lock acquired and released on the same client
    expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT pg_try_advisory_lock($1) AS acquired', [LOCK_KEYS.DISPATCHER]);
    expect(mockQuery).toHaveBeenNthCalledWith(2, 'SELECT pg_advisory_unlock($1)', [LOCK_KEYS.DISPATCHER]);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it('skips execution honestly when lock is held by another process', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [{ acquired: false }] });
    const mockRelease = vi.fn();

    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });

    let operationRan = false;
    const res = await withAdvisoryLock(LOCK_KEYS.DAILY_PIPELINE, 'PIPELINE', async () => {
      operationRan = true;
      return { ok: true };
    });

    expect(res.executed).toBe(false);
    expect(res.reason).toContain('ALREADY_RUNNING');
    expect(operationRan).toBe(false);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('fails closed in production mode when database pool fails to connect', async () => {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';

    mockConnect.mockRejectedValue(new Error('PostgreSQL connection pool timed out'));

    let operationRan = false;
    const res = await withAdvisoryLock(LOCK_KEYS.DISPATCHER, 'DISPATCHER', async () => {
      operationRan = true;
    });

    (env as any).NODE_ENV = originalEnv;

    expect(res.executed).toBe(false);
    expect(res.reason).toContain('LOCK_CONNECTION_FAILED');
    expect(operationRan).toBe(false);
  });
});
