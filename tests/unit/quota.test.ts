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

  it('should deny search calls when limit is reached', async () => {
    const quota = await qm.syncQuotaState();
    // Simulate quota reached
    for (let i = 0; i < quota.searchCallsDailyLimit; i++) {
      await qm.recordSearchExecution();
    }
    expect(await qm.canExecuteSearch()).toBe(false);
    expect(await qm.getRemainingSearchCalls()).toBe(0);
  });
});
