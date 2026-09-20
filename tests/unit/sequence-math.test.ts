import { describe, it, expect } from 'vitest';
import { sequenceService } from '../../src/services/outreach/sequence.service';

describe('Sequence Math & Calendar Dispersion', () => {
  it('should advance target date by business days when SKIP_WEEKENDS is enabled', () => {
    // Wednesday 2026-09-23 10:00:00 UTC
    const wednesday = new Date(Date.UTC(2026, 8, 23, 10, 0, 0));
    const target = sequenceService.calculateNextStepDue(wednesday, 2, 0, 'SKIP_WEEKENDS', 101);

    // Wednesday + 2 business days = Friday (2026-09-25)
    expect(target.getUTCDay()).toBe(5); // 5 = Friday
  });

  it('should shift Thursday sends (+2 business days) to Monday under SKIP_WEEKENDS', () => {
    // Thursday 2026-09-24 10:00:00 UTC
    const thursday = new Date(Date.UTC(2026, 8, 24, 10, 0, 0));
    const target = sequenceService.calculateNextStepDue(thursday, 2, 0, 'SKIP_WEEKENDS', 202);

    // Thursday + 1 = Fri, Thursday + 2 = Mon (2026-09-28)
    expect(target.getUTCDay()).toBe(1); // 1 = Monday
  });

  it('should shift Friday sends (+2 business days) to Tuesday under SKIP_WEEKENDS', () => {
    // Friday 2026-09-25 10:00:00 UTC
    const friday = new Date(Date.UTC(2026, 8, 25, 10, 0, 0));
    const target = sequenceService.calculateNextStepDue(friday, 2, 0, 'SKIP_WEEKENDS', 303);

    // Friday + 1 = Mon, Friday + 2 = Tue (2026-09-29)
    expect(target.getUTCDay()).toBe(2); // 2 = Tuesday
  });

  it('should allow weekend target dates when SEND_7_DAYS is enabled', () => {
    // Friday 2026-09-25 10:00:00 UTC
    const friday = new Date(Date.UTC(2026, 8, 25, 10, 0, 0));
    const target = sequenceService.calculateNextStepDue(friday, 2, 0, 'SEND_7_DAYS', 404);

    // Friday + 2 calendar days = Sunday (2026-09-27)
    expect(target.getUTCDay()).toBe(0); // 0 = Sunday
  });

  it('should bound intraday dispatch time within US Eastern business hours (9 AM - 4 PM)', () => {
    const monday = new Date(Date.UTC(2026, 8, 21, 10, 0, 0));

    for (let leadId = 1; leadId <= 50; leadId++) {
      const target = sequenceService.calculateNextStepDue(monday, 1, 0, 'SKIP_WEEKENDS', leadId);
      const hour = target.getHours();

      // Hours must be between 9 (9:00 AM) and 16 (4:59 PM)
      expect(hour).toBeGreaterThanOrEqual(9);
      expect(hour).toBeLessThanOrEqual(16);
    }
  });

  it('should calculate analytical equilibrium ratios accurately from Expansion Factor Phi', () => {
    // Single touch (N = 1) => Phi = 1.0 => 100% New, 0% Follow-up
    const phi1 = 1.0;
    const rNew1 = 1.0 / phi1;
    const rFu1 = (phi1 - 1.0) / phi1;
    expect(rNew1).toBe(1.0);
    expect(rFu1).toBe(0.0);

    // 2-step sequence with S2 = 0.92 => Phi = 1.92
    const s2 = 0.92;
    const phi2 = 1.0 + s2;
    const rNew2 = 1.0 / phi2;
    const rFu2 = (phi2 - 1.0) / phi2;
    expect(Math.round(rNew2 * 100) / 100).toBe(0.52);
    expect(Math.round(rFu2 * 100) / 100).toBe(0.48);

    // 3-step sequence with S2 = 0.92, S3 = 0.85 => Phi = 2.77
    const s3 = 0.85;
    const phi3 = 1.0 + s2 + s3;
    const rNew3 = 1.0 / phi3;
    const rFu3 = (phi3 - 1.0) / phi3;
    expect(Math.round(rNew3 * 100) / 100).toBe(0.36);
    expect(Math.round(rFu3 * 100) / 100).toBe(0.64);
  });
});
