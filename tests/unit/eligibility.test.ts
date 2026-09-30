import { describe, it, expect } from 'vitest';
import {
  outreachEligibilityEngine,
  ContactCandidate,
} from '../../src/services/qualification/eligibility.service';

describe('Outreach Deliverability & Eligibility Engine', () => {
  const baseCandidate: ContactCandidate = {
    contactId: 101,
    leadId: 501,
    email: 'business@creatorchannel.com',
    emailStatus: 'DOMAIN_VALID',
    confidenceScore: 0.80,
    isPrimary: true,
    isCommercialRole: true,
    isRoleBased: true,
    subscriberCount: 50000,
    category: 'tech',
    country: 'US',
    isSuppressed: false,
    alreadyContactedLead: false,
    alreadyContactedContact: false,
    outreachStatus: 'DISCOVERED',
  };

  describe('Layer 1: Hard Negatives (Absolute Non-Negotiable Blocks)', () => {
    it('should reject suppressed leads as HARD_NEGATIVE', () => {
      const res = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        isSuppressed: true,
      });
      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('HARD_NEGATIVE');
      expect(res.reason).toContain('suppression');
    });

    it('should reject already contacted leads as HARD_NEGATIVE', () => {
      const res = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        alreadyContactedLead: true,
      });
      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('HARD_NEGATIVE');
      expect(res.reason).toContain('already contacted');
    });

    it('should reject contacts with terminal outreach statuses as HARD_NEGATIVE', () => {
      const terminalStatuses = ['CONTACTED', 'REPLIED', 'UNSUBSCRIBED', 'BOUNCED'];
      for (const st of terminalStatuses) {
        const res = outreachEligibilityEngine.evaluate({
          ...baseCandidate,
          outreachStatus: st,
        });
        expect(res.eligible).toBe(false);
        expect(res.decision).toBe('HARD_NEGATIVE');
      }
    });

    it('should reject contacts with missing email as HARD_NEGATIVE', () => {
      const res = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        email: null,
      });
      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('HARD_NEGATIVE');
    });

    it('should reject INVALID and DISPOSABLE email statuses as HARD_NEGATIVE', () => {
      const badStatuses = ['INVALID', 'DISPOSABLE'];
      for (const st of badStatuses) {
        const res = outreachEligibilityEngine.evaluate({
          ...baseCandidate,
          emailStatus: st,
        });
        expect(res.eligible).toBe(false);
        expect(res.decision).toBe('HARD_NEGATIVE');
      }
    });

    it('should reject domains with excessive historical bounces as HARD_NEGATIVE', () => {
      const res = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        domainBounces: 3,
      }, { maxDomainBounces: 2 });

      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('HARD_NEGATIVE');
      expect(res.reason).toContain('excessive bounce history');
    });
  });

  describe('Layer 2: Uncertain & Policy Decisions', () => {
    it('should exclude UNKNOWN and FAILED emails from outreach by policy', () => {
      const resUnknown = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        emailStatus: 'UNKNOWN',
      });
      expect(resUnknown.eligible).toBe(false);
      expect(resUnknown.decision).toBe('POLICY_EXCLUDED');

      const resFailed = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        emailStatus: 'FAILED',
      });
      expect(resFailed.eligible).toBe(false);
      expect(resFailed.decision).toBe('POLICY_EXCLUDED');
    });

    it('should exclude DOMAIN_VALID if campaign policy disallows it', () => {
      const res = outreachEligibilityEngine.evaluate(baseCandidate, {
        allowDomainValid: false,
      });
      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('POLICY_EXCLUDED');
    });

    it('should allow DOMAIN_VALID if campaign policy permits it', () => {
      const res = outreachEligibilityEngine.evaluate(baseCandidate, {
        allowDomainValid: true,
      });
      expect(res.eligible).toBe(true);
      expect(res.decision).toBe('ELIGIBLE');
    });

    it('should exclude generic role-based addresses (info/support/admin) by policy', () => {
      const res = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        isRoleBased: true,
        isCommercialRole: false,
      }, { allowGenericRoleBased: false });

      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('POLICY_EXCLUDED');
      expect(res.reason).toContain('Generic role-based address');
    });

    it('should exclude candidates falling below the calibratable minimum confidence threshold', () => {
      const res = outreachEligibilityEngine.evaluate({
        ...baseCandidate,
        confidenceScore: 0.40,
      }, { minConfidenceScore: 0.60 });

      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('POLICY_EXCLUDED');
      expect(res.reason).toContain('below policy threshold');
    });

    it('should exclude candidates outside subscriber criteria', () => {
      const res = outreachEligibilityEngine.evaluate(baseCandidate, {
        minSubscribers: 100000,
      });
      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('POLICY_EXCLUDED');
      expect(res.reason).toContain('below minimum threshold');
    });
  });

  describe('Layer 3: Eligible Candidates', () => {
    it('should mark candidates passing all deliverability and policy checks as ELIGIBLE', () => {
      const res = outreachEligibilityEngine.evaluate(baseCandidate, {
        allowDomainValid: true,
        minConfidenceScore: 0.50,
      });
      expect(res.eligible).toBe(true);
      expect(res.decision).toBe('ELIGIBLE');
      expect(res.confidenceScore).toBe(0.80);
    });
  });
});
