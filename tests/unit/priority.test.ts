import { describe, it, expect } from 'vitest';
import {
  opportunityPriorityEngine,
  PriorityCandidate,
} from '../../src/services/outreach/priority.engine';

describe('Opportunity Priority Engine', () => {
  const highTierLead: PriorityCandidate = {
    contactId: 1,
    leadId: 10,
    email: 'partnerships@mkbhd.com',
    isPrimary: true,
    isCommercialRole: true,
    emailCategory: 'BUSINESS',
    source: 'youtube_about',
    confidenceScore: 0.90,
    mxProvider: 'GOOGLE_WORKSPACE',
    subscriberCount: 150000,
    discoveredAt: new Date(),
    category: 'tech',
    country: 'US',
  };

  const midTierLead: PriorityCandidate = {
    contactId: 2,
    leadId: 20,
    email: 'john.creator@gmail.com',
    isPrimary: true,
    isCommercialRole: false,
    emailCategory: 'DIRECT',
    source: 'video_description',
    confidenceScore: 0.70,
    mxProvider: 'CONSUMER_GMAIL',
    subscriberCount: 45000,
    discoveredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days old
    category: 'tech',
    country: 'US',
  };

  const fallbackLead: PriorityCandidate = {
    contactId: 3,
    leadId: 30,
    email: 'contact@smallstudio.io',
    isPrimary: true,
    isCommercialRole: false,
    emailCategory: 'GENERIC',
    source: 'external_website',
    confidenceScore: 0.60,
    mxProvider: 'CUSTOM',
    subscriberCount: 10000,
    discoveredAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days old
    category: 'gaming',
    country: 'CA',
  };

  const acceptableFallbackA4: PriorityCandidate = {
    contactId: 4,
    leadId: 40,
    email: 'general@unknowncreator.net',
    isPrimary: true,
    isCommercialRole: false,
    emailCategory: 'GENERIC',
    source: 'external_website',
    confidenceScore: 0.40,
    mxProvider: 'CUSTOM',
    subscriberCount: 3000,
    discoveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    attemptCount: 1,
  };

  const reserveLeadA5: PriorityCandidate = {
    contactId: 5,
    leadId: 50,
    email: 'unverified@slowdns.com',
    isPrimary: true,
    confidenceScore: 0.20, // very low confidence / uncertain
    subscriberCount: 50000,
  };

  const hardNegativeA6: PriorityCandidate = {
    contactId: 6,
    leadId: 60,
    email: 'bounced@definitelyfake999.xyz',
    isPrimary: true,
    confidenceScore: 0.0,
    attemptCount: 3,
    subscriberCount: 50000,
    emailStatus: 'INVALID',
    verificationReasonCode: 'HARD_BOUNCE',
  };

  const secondaryContact: PriorityCandidate = {
    contactId: 7,
    leadId: 10, // Same lead as highTierLead
    email: 'team@mkbhd.com',
    isPrimary: false,
    isSecondaryContact: true,
    hasActiveSiblingContact: true,
    isCommercialRole: false,
    emailCategory: 'GENERIC',
    source: 'external_website',
    confidenceScore: 0.80,
    mxProvider: 'GOOGLE_WORKSPACE',
    subscriberCount: 150000,
    discoveredAt: new Date(),
    category: 'tech',
    country: 'US',
  };

  describe('Explainable Scoring & Factor Breakdown', () => {
    it('should generate an explainable score with all transparent factors', () => {
      const result = opportunityPriorityEngine.scoreCandidate(highTierLead);

      expect(result.priorityScore).toBeGreaterThanOrEqual(80);
      expect(result.factors.verification).toBeDefined();
      expect(result.factors.role).toBeDefined();
      expect(result.factors.source).toBeDefined();
      expect(result.factors.leadQuality).toBeDefined();
      expect(result.factors.engagement).toBeDefined();
      expect(result.opportunityTier).toBe('A1');
      expect(result.explanation).toContain('Score');
      expect(result.explanation).toContain('Ver:');
      expect(result.explanation).toContain('Role:');
    });

    it('should assign higher role score to commercial/partnership emails', () => {
      const commercial = opportunityPriorityEngine.scoreCandidate(highTierLead);
      const standard = opportunityPriorityEngine.scoreCandidate(midTierLead);

      expect(commercial.factors.role.rawScore).toBeGreaterThan(standard.factors.role.rawScore);
    });

    it('should reward official YouTube About page source over video descriptions', () => {
      const about = opportunityPriorityEngine.scoreCandidate(highTierLead);
      const description = opportunityPriorityEngine.scoreCandidate(midTierLead);

      expect(about.factors.source.rawScore).toBeGreaterThan(description.factors.source.rawScore);
    });

    it('should apply secondary contact staggering deduction to sibling contacts', () => {
      const primaryRes = opportunityPriorityEngine.scoreCandidate(highTierLead);
      const secondaryRes = opportunityPriorityEngine.scoreCandidate(secondaryContact);

      expect(secondaryRes.factors.penalties.length).toBeGreaterThan(0);
      expect(secondaryRes.factors.penalties[0].name).toBe('secondary_contact_stagger');
      expect(primaryRes.priorityScore).toBeGreaterThan(secondaryRes.priorityScore);
    });
  });

  describe('6-Tier Gradient Opportunity Ladder (A1 to A6)', () => {
    it('should classify top-tier opportunity as A1', () => {
      const res = opportunityPriorityEngine.scoreCandidate(highTierLead);
      expect(res.opportunityTier).toBe('A1');
      expect(res.tierReason).toContain('Top opportunity');
    });

    it('should classify solid mid-tier opportunity as A2', () => {
      const res = opportunityPriorityEngine.scoreCandidate(midTierLead);
      expect(res.opportunityTier).toBe('A2');
    });

    it('should classify usable fallback opportunity as A3', () => {
      const res = opportunityPriorityEngine.scoreCandidate(fallbackLead);
      expect(res.opportunityTier).toBe('A3');
    });

    it('should classify weaker opportunity as A4 (acceptable fallback)', () => {
      const res = opportunityPriorityEngine.scoreCandidate(acceptableFallbackA4);
      expect(res.opportunityTier).toBe('A4');
      expect(res.tierReason).toContain('Acceptable fallback');
    });

    it('should classify highly uncertain/low-confidence candidate as A5 (reserve)', () => {
      const res = opportunityPriorityEngine.scoreCandidate(reserveLeadA5);
      expect(res.opportunityTier).toBe('A5');
      expect(res.tierReason).toContain('reserve');
    });

    it('should classify definitively bad candidate as A6 (hard negative)', () => {
      const res = opportunityPriorityEngine.scoreCandidate(hardNegativeA6);
      expect(res.opportunityTier).toBe('A6');
    });

    it('should NOT classify DNS timeout / unresolved as A6 (must fall back to A5 reserve)', () => {
      const timeoutCandidate: PriorityCandidate = {
        contactId: 99,
        leadId: 990,
        email: 'transient@slowdns.com',
        isPrimary: true,
        confidenceScore: 0.0,
        attemptCount: 3,
        emailStatus: 'UNKNOWN',
        verificationReasonCode: 'DNS_TIMEOUT',
      };
      const res = opportunityPriorityEngine.scoreCandidate(timeoutCandidate);
      expect(res.opportunityTier).toBe('A5');
      expect(res.tierReason).toContain('reserve');
    });

    it('should cap repaired email candidates at Tier A4 even if high confidence and score', () => {
      const repairedCandidate: PriorityCandidate = {
        ...highTierLead,
        contactId: 88,
        email: 'creator@gmail.com',
        wasRepaired: true,
        repairedFrom: 'creator@gmial.com',
        repairCode: 'COMMON_TYPO_DOMAIN',
      };
      const res = opportunityPriorityEngine.scoreCandidate(repairedCandidate);
      expect(res.opportunityTier).toBe('A4');
      expect(res.tierReason).toContain('capped at Tier A4');
    });
  });

  describe('Gradient Ranking & Traversal', () => {
    it('should rank opportunities strictly by gradient precedence (A1 > A2 > A3 > A4 > A5 > A6)', () => {
      const allCandidates = [
        hardNegativeA6,
        acceptableFallbackA4,
        reserveLeadA5,
        midTierLead,
        fallbackLead,
        highTierLead,
      ];

      const ranked = opportunityPriorityEngine.rankCandidates(allCandidates);

      expect(ranked[0].opportunityTier).toBe('A1');
      expect(ranked[1].opportunityTier).toBe('A2');
      expect(ranked[2].opportunityTier).toBe('A3');
      expect(ranked[3].opportunityTier).toBe('A4');
      expect(ranked[4].opportunityTier).toBe('A5');
      expect(ranked[5].opportunityTier).toBe('A6');
    });

    it('should handle small pools honestly without creating artificial volume', () => {
      const smallPool = [midTierLead, highTierLead];
      const ranked = opportunityPriorityEngine.rankCandidates(smallPool);

      // If only 2 exist, exactly 2 are ranked
      expect(ranked.length).toBe(2);
      expect(ranked[0].priorityScore).toBeGreaterThan(ranked[1].priorityScore);
    });
  });
});
