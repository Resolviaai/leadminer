import { describe, it, expect, vi } from 'vitest';
import { WarmupService, warmupService } from '../../src/services/outreach/warmup.service';

describe('WarmupService', () => {
  it('should return correct 7-day ramp intervals', () => {
    // Day 0: 4-6 (target 5)
    expect(WarmupService.getWarmupSchedule(0)).toEqual({ min: 4, max: 6 });
    // Day 1: 7-9 (target 8)
    expect(WarmupService.getWarmupSchedule(1)).toEqual({ min: 7, max: 9 });
    // Day 2: 9-11 (target 10)
    expect(WarmupService.getWarmupSchedule(2)).toEqual({ min: 9, max: 11 });
    // Day 3: 14-16 (target 15)
    expect(WarmupService.getWarmupSchedule(3)).toEqual({ min: 14, max: 16 });
    // Day 4: 17-19 (target 18)
    expect(WarmupService.getWarmupSchedule(4)).toEqual({ min: 17, max: 19 });
    // Day 5: 20-22 (target 21)
    expect(WarmupService.getWarmupSchedule(5)).toEqual({ min: 20, max: 22 });
    // Day 6+: 18-25 (target 25, fully warmed)
    expect(WarmupService.getWarmupSchedule(6)).toEqual({ min: 18, max: 25 });
    expect(WarmupService.getWarmupSchedule(30)).toEqual({ min: 18, max: 25 });
  });

  it('should compute effective daily limit bounded by ramp and base limit', async () => {
    // Mock getActiveSendDays to return 0 (brand new account)
    vi.spyOn(warmupService, 'getActiveSendDays').mockResolvedValue(0);

    const limitDay0 = await warmupService.getEffectiveDailyLimit(1, 25);
    expect(limitDay0).toBeGreaterThanOrEqual(4);
    expect(limitDay0).toBeLessThanOrEqual(6);

    // Mock getActiveSendDays to return 6 (fully warmed account)
    vi.spyOn(warmupService, 'getActiveSendDays').mockResolvedValue(6);
    const limitDay6 = await warmupService.getEffectiveDailyLimit(1, 25);
    expect(limitDay6).toBeGreaterThanOrEqual(18);
    expect(limitDay6).toBeLessThanOrEqual(25);
  });
});
