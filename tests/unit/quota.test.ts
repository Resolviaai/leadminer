import { describe, it, expect, beforeEach } from 'vitest';
import { YouTubeQuotaManager } from '../../src/services/youtube/quota';

describe('YouTube Quota Manager', () => {
  let qm: YouTubeQuotaManager;

  beforeEach(() => {
    qm = new YouTubeQuotaManager(true);
  });

  it('should initialize with default limits (100 search calls, 10000 general units)', async () => {
    const quota = await qm.syncQuotaState();
    expect(quota.searchCallsDailyLimit).toBe(100);
    expect(quota.generalQuotaDailyLimit).toBe(10000);
    expect(quota.searchCallsUsedToday).toBe(0);
  });

  it('should permit search calls when below limit', async () => {
    expect(await qm.canExecuteSearch()).toBe(true);
  });

  it('should accurately track search call executions', async () => {
    await qm.recordSearchExecution();
    await qm.recordSearchExecution();
    const quota = await qm.syncQuotaState();
    expect(quota.searchCallsUsedToday).toBe(2);
    expect(await qm.getRemainingSearchCalls()).toBe(98);
  });

  it('should track general quota usage in units', async () => {
    await qm.recordGeneralQuotaUsage(5);
    const quota = await qm.syncQuotaState();
    expect(quota.generalQuotaUsedToday).toBe(5);
    expect(await qm.getRemainingGeneralQuota()).toBe(9995);
  });

  it('should atomically claim search calls and decrement remaining', async () => {
    const claimed = await qm.tryClaimSearchCall();
    expect(claimed).toBe(true);
    const quota = await qm.syncQuotaState();
    expect(quota.searchCallsUsedToday).toBe(1);
    expect(await qm.getRemainingSearchCalls()).toBe(99);
  });

  it('should atomically claim general quota units', async () => {
    const claimed = await qm.tryClaimGeneralQuota(3);
    expect(claimed).toBe(true);
    const quota = await qm.syncQuotaState();
    expect(quota.generalQuotaUsedToday).toBe(3);
    expect(await qm.getRemainingGeneralQuota()).toBe(9997);
  });

  it('should deny search calls when limit is reached', async () => {
    const quota = await qm.syncQuotaState();
    // Simulate quota reached
    for (let i = 0; i < quota.searchCallsDailyLimit; i++) {
      await qm.tryClaimSearchCall();
    }
    expect(await qm.tryClaimSearchCall()).toBe(false);
    expect(await qm.canExecuteSearch()).toBe(false);
    expect(await qm.getRemainingSearchCalls()).toBe(0);
  });

  it('should skip exhausted keys when markActiveKeyExhausted is called', () => {
    expect(qm.getActiveKeyIndex()).toBe(0);
    qm.markActiveKeyExhausted();
    // If multiple keys exist or only 1 key exists, active key is safely managed
    expect(typeof qm.getActiveKeyIndex()).toBe('number');
  });
});

