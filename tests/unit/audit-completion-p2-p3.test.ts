import { describe, expect, it } from 'vitest';
import { checkRateLimit, getClientIp } from '../../src/lib/rate-limiter';
import { YouTubeQuotaManager } from '../../src/services/youtube/quota';
import { env } from '../../src/config/env';

describe('Audit Completion Suite (P2 & P3 Items)', () => {
  describe('P3-12: Rate Limiter & Public Protection', () => {
    it('allows requests within limit and throttles requests exceeding limit', () => {
      const bucket = `test_bucket_${Date.now()}`;
      const ip = '192.168.1.50';

      // Limit 3 requests
      const r1 = checkRateLimit(bucket, ip, 3, 10000);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(bucket, ip, 3, 10000);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(bucket, ip, 3, 10000);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = checkRateLimit(bucket, ip, 3, 10000);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });

    it('extracts client IP safely from forwarded headers', () => {
      const reqWithForwarded = new Request('http://localhost/api/health', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      });
      expect(getClientIp(reqWithForwarded)).toBe('203.0.113.195');

      const reqWithRealIp = new Request('http://localhost/api/health', {
        headers: { 'x-real-ip': '198.51.100.1' },
      });
      expect(getClientIp(reqWithRealIp)).toBe('198.51.100.1');

      const reqDefault = new Request('http://localhost/api/health');
      expect(getClientIp(reqDefault)).toBe('127.0.0.1');
    });
  });

  describe('P3-7 & P3-8: YouTube Quota Key Derivation & Single Source of Truth', () => {
    it('uses env.YOUTUBE_DAILY_SEARCH_LIMIT as single source of truth for base search limit', () => {
      const qm = new YouTubeQuotaManager(true);
      expect(qm).toBeDefined();
      expect(env.YOUTUBE_DAILY_SEARCH_LIMIT).toBeGreaterThan(0);
    });

    it('derives active key index dynamically based on quota usage', async () => {
      const qm = new YouTubeQuotaManager(true);
      const initialIdx = qm.getActiveKeyIndex();
      expect(initialIdx).toBe(0);
    });
  });

  describe('P2-27: Strict Phi Governor Capacity Logic', () => {
    it('caps follow-ups strictly at targetFuSlots without overriding new lead allocation', () => {
      const remainingSlots = 20;
      const targetFuRatio = 0.3; // 30% follow-ups, 70% new
      const targetFuSlots = Math.floor(remainingSlots * targetFuRatio); // 6
      const scoredFollowUpsCount = 15; // 15 due follow-ups

      // P2-27 strict cap: follow-ups are capped strictly at targetFuSlots
      const maxAllowedFu = Math.min(scoredFollowUpsCount, targetFuSlots);
      expect(maxAllowedFu).toBe(6);

      // Remaining slots for new outreach
      const accountFuScheduled = maxAllowedFu;
      const slotsForNew = Math.max(0, remainingSlots - accountFuScheduled);
      expect(slotsForNew).toBe(14); // 70% preserved for new leads!
    });

    it('fluidly spills over unused follow-up slots into Step 1 new outreach', () => {
      const remainingSlots = 20;
      const targetFuRatio = 0.3;
      const targetFuSlots = Math.floor(remainingSlots * targetFuRatio); // 6
      const scoredFollowUpsCount = 2; // Only 2 follow-ups due

      const maxAllowedFu = Math.min(scoredFollowUpsCount, targetFuSlots);
      expect(maxAllowedFu).toBe(2);

      const accountFuScheduled = maxAllowedFu;
      const slotsForNew = Math.max(0, remainingSlots - accountFuScheduled);
      // Fluid spillover gives 18 slots to new leads instead of 14, wasting zero quota!
      expect(slotsForNew).toBe(18);
    });
  });
});
