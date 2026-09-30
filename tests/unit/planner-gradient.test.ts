import { describe, it, expect } from 'vitest';
import {
  opportunityPriorityEngine,
  TIER_ORDER,
  OpportunityTier,
  PriorityCandidate,
} from '../../src/services/outreach/priority.engine';

describe('Planner Gradient Traversal & Low-Volume Integrity Suite', () => {
  function makeCandidate(
    id: number,
    tierTarget: OpportunityTier,
    overrides: Partial<PriorityCandidate> = {}
  ): PriorityCandidate {
    switch (tierTarget) {
      case 'A1':
        return {
          contactId: id,
          leadId: id * 10,
          email: `partner${id}@mkbhd.com`,
          isPrimary: true,
          isCommercialRole: true,
          emailCategory: 'BUSINESS',
          source: 'youtube_about',
          confidenceScore: 0.95,
          mxProvider: 'GOOGLE_WORKSPACE',
          subscriberCount: 200000,
          discoveredAt: new Date(),
          ...overrides,
        };
      case 'A2':
        return {
          contactId: id,
          leadId: id * 10,
          email: `creator${id}@gmail.com`,
          isPrimary: true,
          isCommercialRole: false,
          emailCategory: 'DIRECT',
          source: 'video_description',
          confidenceScore: 0.75,
          mxProvider: 'CONSUMER_GMAIL',
          subscriberCount: 50000,
          discoveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          ...overrides,
        };
      case 'A3':
        return {
          contactId: id,
          leadId: id * 10,
          email: `inquiries${id}@customstudio.org`,
          isPrimary: true,
          isCommercialRole: false,
          emailCategory: 'GENERIC',
          source: 'external_website',
          confidenceScore: 0.55,
          mxProvider: 'CUSTOM',
          subscriberCount: 15000,
          discoveredAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
          ...overrides,
        };
      case 'A4':
        return {
          contactId: id,
          leadId: id * 10,
          email: `general${id}@lowtier.net`,
          isPrimary: true,
          isCommercialRole: false,
          emailCategory: 'GENERIC',
          source: 'external_website',
          confidenceScore: 0.40,
          mxProvider: 'CUSTOM',
          subscriberCount: 3000,
          discoveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          attemptCount: 1,
          ...overrides,
        };
      case 'A5':
        return {
          contactId: id,
          leadId: id * 10,
          email: `unverified${id}@unknownhost.io`,
          isPrimary: true,
          confidenceScore: 0.20, // Low confidence -> reserve
          subscriberCount: 40000,
          ...overrides,
        };
      case 'A6':
        return {
          contactId: id,
          leadId: id * 10,
          email: `bounced${id}@deadhost.xyz`,
          isPrimary: true,
          confidenceScore: 0.0,
          attemptCount: 3,
          subscriberCount: 40000,
          ...overrides,
        };
    }
  }

  /**
   * Helper function that simulates the planner selection logic:
   * 1. Evaluates each candidate for tier & score
   * 2. Drops A6 (hard negative) and A5 (reserve)
   * 3. Sorts sendable opportunities by Tier ASC (A1 -> A2 -> A3 -> A4), then Score DESC
   * 4. Takes up to daily capacity K
   */
  function simulatePlannerSelection(
    candidates: PriorityCandidate[],
    dailyCapacity: number
  ): { scheduled: ReturnType<typeof opportunityPriorityEngine.scoreCandidate>[]; tierCounts: Record<OpportunityTier, number> } {
    const scored = candidates.map((c) => opportunityPriorityEngine.scoreCandidate(c));

    // Filter out A6 (hard negative) and A5 (reserve)
    const sendable = scored.filter(
      (c) => c.opportunityTier !== 'A6' && c.opportunityTier !== 'A5'
    );

    // Sort by gradient precedence
    sendable.sort((a, b) => {
      const tierDiff = TIER_ORDER[a.opportunityTier] - TIER_ORDER[b.opportunityTier];
      if (tierDiff !== 0) return tierDiff;
      return b.priorityScore - a.priorityScore;
    });

    const scheduled = sendable.slice(0, dailyCapacity);

    const tierCounts: Record<OpportunityTier, number> = {
      A1: 0,
      A2: 0,
      A3: 0,
      A4: 0,
      A5: 0,
      A6: 0,
    };
    for (const item of scheduled) {
      tierCounts[item.opportunityTier]++;
    }

    return { scheduled, tierCounts };
  }

  it('Scenario 1: Capacity = 5, A1 pool is sufficient (10 A1 available) -> consumes only A1', () => {
    const pool = Array.from({ length: 10 }, (_, i) => makeCandidate(i + 1, 'A1'));
    const { scheduled, tierCounts } = simulatePlannerSelection(pool, 5);

    expect(scheduled.length).toBe(5);
    expect(tierCounts.A1).toBe(5);
    expect(tierCounts.A2).toBe(0);
  });

  it('Scenario 2: Capacity = 5, A1 has 2, A2 has 10 -> consumes 2 A1 + 3 A2 (seamless gradient descent)', () => {
    const pool = [
      makeCandidate(1, 'A1'),
      makeCandidate(2, 'A1'),
      ...Array.from({ length: 10 }, (_, i) => makeCandidate(i + 10, 'A2')),
    ];
    const { scheduled, tierCounts } = simulatePlannerSelection(pool, 5);

    expect(scheduled.length).toBe(5);
    expect(tierCounts.A1).toBe(2);
    expect(tierCounts.A2).toBe(3);
    expect(tierCounts.A3).toBe(0);
  });

  it('Scenario 3: Capacity = 5, A1=1, A2=1, A3=2, A4=10 -> consumes 1 A1 + 1 A2 + 2 A3 + 1 A4', () => {
    const pool = [
      makeCandidate(1, 'A1'),
      makeCandidate(2, 'A2'),
      makeCandidate(3, 'A3'),
      makeCandidate(4, 'A3'),
      ...Array.from({ length: 10 }, (_, i) => makeCandidate(i + 20, 'A4')),
    ];
    const { scheduled, tierCounts } = simulatePlannerSelection(pool, 5);

    expect(scheduled.length).toBe(5);
    expect(tierCounts.A1).toBe(1);
    expect(tierCounts.A2).toBe(1);
    expect(tierCounts.A3).toBe(2);
    expect(tierCounts.A4).toBe(1);
  });

  it('Scenario 4: Capacity = 50, only A5 reserve exists -> schedules 0 and preserves A5', () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeCandidate(i + 1, 'A5'));
    const { scheduled } = simulatePlannerSelection(pool, 50);

    expect(scheduled.length).toBe(0); // Zero fake volume!
  });

  it('Scenario 5: Capacity = 50, only A6 hard negatives exist -> schedules 0', () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeCandidate(i + 1, 'A6'));
    const { scheduled } = simulatePlannerSelection(pool, 50);

    expect(scheduled.length).toBe(0);
  });

  it('Scenario 6: Tomorrow fresh A1 opportunities arrive -> naturally rise to the top', () => {
    // Yesterday: A1 exhausted, only A3 remained
    const yesterdayPool = Array.from({ length: 5 }, (_, i) => makeCandidate(i + 1, 'A3'));
    const resYesterday = simulatePlannerSelection(yesterdayPool, 3);
    expect(resYesterday.tierCounts.A3).toBe(3);

    // Today: 5 fresh A1 contacts discovered
    const todayPool = [
      ...yesterdayPool,
      ...Array.from({ length: 5 }, (_, i) => makeCandidate(i + 100, 'A1')),
    ];
    const resToday = simulatePlannerSelection(todayPool, 3);

    // Today's dispatch prioritizes fresh A1s over older A3s
    expect(resToday.tierCounts.A1).toBe(3);
    expect(resToday.tierCounts.A3).toBe(0);
  });

  it('Opportunity Maximization with Honesty: If only 12 meet A1-A4 and capacity is 50, schedule exactly 12', () => {
    const pool = [
      ...Array.from({ length: 4 }, (_, i) => makeCandidate(i + 1, 'A1')),
      ...Array.from({ length: 4 }, (_, i) => makeCandidate(i + 10, 'A2')),
      ...Array.from({ length: 4 }, (_, i) => makeCandidate(i + 20, 'A3')),
      ...Array.from({ length: 15 }, (_, i) => makeCandidate(i + 30, 'A5')), // reserve
      ...Array.from({ length: 15 }, (_, i) => makeCandidate(i + 50, 'A6')), // hard negative
    ];

    const { scheduled } = simulatePlannerSelection(pool, 50);

    // Exactly 12 scheduled! Does not downgrade A5 to fill capacity to 50
    expect(scheduled.length).toBe(12);
  });
});
