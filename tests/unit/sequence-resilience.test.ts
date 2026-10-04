import { describe, it, expect, vi } from 'vitest';
import { sequenceService } from '../../src/services/outreach/sequence.service';

describe('Sequence Service Resilience & Cold-Start Fallbacks', () => {
  it('should compute cold-start priors when steps have 0 historical sends', async () => {
    // When sequence has steps, coldStartPriors are used
    const metrics = await sequenceService.getSequenceMetrics(999999);
    expect(metrics).toBeDefined();
    expect(metrics.phi).toBeGreaterThanOrEqual(1.0);
    expect(metrics.equilibriumNewRatio).toBeGreaterThan(0);
    expect(metrics.equilibriumFollowUpRatio).toBeGreaterThanOrEqual(0);
    expect(metrics.equilibriumNewRatio + metrics.equilibriumFollowUpRatio).toBeCloseTo(1.0, 1);
  });

  it('should gracefully handle empty sequences with single-touch identity metrics', async () => {
    // When 0 steps exist, should return phi=1.0, 100% new, 0% follow-up
    const metrics = await sequenceService.getSequenceMetrics(-1);
    expect(metrics.phi).toBe(1.0);
    expect(metrics.equilibriumNewRatio).toBe(1.0);
    expect(metrics.equilibriumFollowUpRatio).toBe(0.0);
  });
});
