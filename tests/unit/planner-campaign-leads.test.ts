import { describe, it, expect } from 'vitest';
import { leadQualificationService } from '../../src/services/qualification/qualification.service';
import { outreachEligibilityEngine } from '../../src/services/qualification/eligibility.service';

describe('Version 1.5 Source Independence & Qualification Resilience', () => {
  describe('1. Qualification Service Subscriber Threshold Bypass', () => {
    it('should disqualify YouTube leads with zero subscribers when minSubscribers is set', () => {
      const res = leadQualificationService.qualify(
        {
          subscriberCount: 0,
          sourceProvider: 'YOUTUBE',
          email: 'creator@youtube.com',
          emailStatus: 'VALID',
          isSuppressed: false,
          alreadyContacted: false,
        },
        {
          requireEmail: true,
          requireValidEmail: true,
          minSubscribers: 10,
        }
      );

      expect(res.qualified).toBe(false);
      expect(res.reason).toContain('Subscriber count (0) below minimum threshold');
    });

    it('should QUALIFY CSV/B2B leads with zero subscribers (subscriber threshold bypassed)', () => {
      const res = leadQualificationService.qualify(
        {
          subscriberCount: 0,
          sourceProvider: 'CSV',
          email: 'founder@saas-startup.io',
          emailStatus: 'VALID',
          isSuppressed: false,
          alreadyContacted: false,
        },
        {
          requireEmail: true,
          requireValidEmail: true,
          minSubscribers: 10,
        }
      );

      expect(res.qualified).toBe(true);
      expect(res.reason).toContain('Lead satisfies all campaign qualification criteria');
    });
  });

  describe('2. Outreach Eligibility Engine Source Awareness', () => {
    it('should exclude YouTube candidates below minSubscribers', () => {
      const res = outreachEligibilityEngine.evaluate(
        {
          contactId: 1,
          leadId: 101,
          email: 'creator@channel.com',
          emailStatus: 'MAILBOX_VERIFIED',
          subscriberCount: 5,
          sourceProvider: 'YOUTUBE',
          isPrimary: true,
          confidenceScore: 0.95,
        },
        {
          minSubscribers: 10,
        }
      );

      expect(res.eligible).toBe(false);
      expect(res.decision).toBe('POLICY_EXCLUDED');
      expect(res.reason).toContain('below minimum threshold');
    });

    it('should ALLOW CSV/B2B candidates with zero subscribers', () => {
      const res = outreachEligibilityEngine.evaluate(
        {
          contactId: 2,
          leadId: 102,
          email: 'ceo@enterprise.com',
          emailStatus: 'MAILBOX_VERIFIED',
          subscriberCount: 0,
          sourceProvider: 'CSV',
          isPrimary: true,
          confidenceScore: 0.95,
        },
        {
          minSubscribers: 10,
        }
      );

      expect(res.eligible).toBe(true);
      expect(res.decision).toBe('ELIGIBLE');
    });
  });
});
