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

  describe('14-Day Inactivity Cold Reset & Streak Details', () => {
    it('should return 0 active days and isColdReset false for brand new account with 0 sends', async () => {
      vi.spyOn(warmupService, 'getStreakDetails').mockResolvedValue({
        activeSendDays: 0,
        daysSinceLastSend: null,
        isColdReset: false,
      });

      const status = await warmupService.getAccountWarmupStatus(10);
      expect(status.activeSendDays).toBe(0);
      expect(status.currentDay).toBe(0);
      expect(status.stageTarget).toBe(5);
      expect(status.isWarmedUp).toBe(false);
      expect(status.isColdReset).toBe(false);
    });

    it('should reset active days to 0 and set isColdReset true when inactive for > 14 days', async () => {
      vi.spyOn(warmupService, 'getStreakDetails').mockResolvedValue({
        activeSendDays: 0,
        daysSinceLastSend: 18,
        isColdReset: true,
      });

      const status = await warmupService.getAccountWarmupStatus(10);
      expect(status.activeSendDays).toBe(0);
      expect(status.currentDay).toBe(0);
      expect(status.stageTarget).toBe(5); // Reset back to Day 0 ramp (target 5)
      expect(status.isWarmedUp).toBe(false);
      expect(status.isColdReset).toBe(true);
      expect(status.daysSinceLastSend).toBe(18);
    });

    it('should maintain active streak when weekend or short gap <= 14 days occurs', async () => {
      vi.spyOn(warmupService, 'getStreakDetails').mockResolvedValue({
        activeSendDays: 5,
        daysSinceLastSend: 2, // 2 days ago (e.g. weekend pause)
        isColdReset: false,
      });

      const status = await warmupService.getAccountWarmupStatus(10);
      expect(status.activeSendDays).toBe(5);
      expect(status.currentDay).toBe(5);
      expect(status.stageTarget).toBe(21);
      expect(status.isWarmedUp).toBe(false);
      expect(status.isColdReset).toBe(false);
    });

    it('should mark account as fully warmed when activeSendDays >= 6', async () => {
      vi.spyOn(warmupService, 'getStreakDetails').mockResolvedValue({
        activeSendDays: 7,
        daysSinceLastSend: 0,
        isColdReset: false,
      });

      const status = await warmupService.getAccountWarmupStatus(10);
      expect(status.activeSendDays).toBe(7);
      expect(status.currentDay).toBe(6);
      expect(status.stageTarget).toBe(25);
      expect(status.isWarmedUp).toBe(true);
      expect(status.isColdReset).toBe(false);
    });
  });
});
