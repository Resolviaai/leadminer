import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from '../../src/workers/discovery.worker';

describe('Keyword Operational Actions', () => {
  it('should toggle status correctly between PAUSED and PENDING', () => {
    const toggleStatus = (current: string) => (current === 'PAUSED' ? 'PENDING' : 'PAUSED');

    expect(toggleStatus('PENDING')).toBe('PAUSED');
    expect(toggleStatus('PAUSED')).toBe('PENDING');
    expect(toggleStatus('COMPLETED')).toBe('PAUSED');
  });

  it('should reset attempt count and error on retry', () => {
    const retryKeyword = (kw: { status: string; attemptCount: number; lastError: string | null }) => ({
      ...kw,
      status: 'PENDING',
      attemptCount: 0,
      lastError: null,
    });

    const failed = { status: 'FAILED', attemptCount: 3, lastError: 'API timeout' };
    const retried = retryKeyword(failed);

    expect(retried.status).toBe('PENDING');
    expect(retried.attemptCount).toBe(0);
    expect(retried.lastError).toBeNull();
  });

  it('should calculate priority scores based on yield', () => {
    expect(calculatePriorityScore(15)).toBe(90);
    expect(calculatePriorityScore(5)).toBe(65);
    expect(calculatePriorityScore(2)).toBe(40);
    expect(calculatePriorityScore(0)).toBe(20);
  });
});
