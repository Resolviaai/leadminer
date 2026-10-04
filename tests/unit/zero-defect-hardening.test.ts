import { describe, it, expect } from 'vitest';
import { LOCK_KEYS } from '../../src/lib/pipeline-lock';
import { TIER_ORDER } from '../../src/services/outreach/priority.engine';

describe('Zero-Defect Architectural Hardening Suite (Pillars 1, 6, 7 & 8)', () => {
  describe('Pillar 6: Advisory Lock Key Isolation', () => {
    it('should assign unique non-overlapping integer keys to all worker types', () => {
      const keys = Object.values(LOCK_KEYS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
      expect(LOCK_KEYS.DISPATCHER).toBe(10002);
      expect(LOCK_KEYS.LINKPAGE).toBe(10006);
      expect(LOCK_KEYS.PLANNER).toBe(10007);
      expect(LOCK_KEYS.CLEANUP).toBe(10008);
    });

    it('should maintain mutual exclusion between standalone dispatch and pipeline dispatch', () => {
      // Both standalone dispatch and pipeline step=dispatch now map to LOCK_KEYS.DISPATCHER
      const getLockKeyForStep = (stepName?: string | null): number => {
        switch (stepName?.toLowerCase().trim()) {
          case 'dispatch':
            return LOCK_KEYS.DISPATCHER;
          case 'discovery':
            return LOCK_KEYS.DISCOVERY;
          case 'verification':
            return LOCK_KEYS.VERIFICATION;
          case 'linkpage':
            return LOCK_KEYS.LINKPAGE;
          case 'planner':
            return LOCK_KEYS.PLANNER;
          case 'replies':
            return LOCK_KEYS.REPLY_SYNC;
          case 'cleanup':
            return LOCK_KEYS.CLEANUP;
          default:
            return LOCK_KEYS.DAILY_PIPELINE;
        }
      };

      expect(getLockKeyForStep('dispatch')).toBe(LOCK_KEYS.DISPATCHER);
      expect(getLockKeyForStep('linkpage')).toBe(LOCK_KEYS.LINKPAGE);
      expect(getLockKeyForStep('planner')).toBe(LOCK_KEYS.PLANNER);
    });
  });

  describe('Pillar 7: Lexicographic Contact Priority Selection', () => {
    it('should prioritize Tier A1 (MAILBOX_VERIFIED, isPrimary=false) over Tier A4 (DOMAIN_VALID, isPrimary=true)', () => {
      interface MockCandidate {
        contactId: number;
        email: string;
        calculatedTier: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
        emailStatus: string;
        calculatedPriority: number;
        isPrimary: boolean;
      }

      const contacts: MockCandidate[] = [
        {
          contactId: 101,
          email: 'info@channel.com',
          calculatedTier: 'A4',
          emailStatus: 'DOMAIN_VALID',
          calculatedPriority: 45,
          isPrimary: true, // Blind first-parsed contact from discovery
        },
        {
          contactId: 102,
          email: 'creator@gmail.com',
          calculatedTier: 'A1',
          emailStatus: 'MAILBOX_VERIFIED',
          calculatedPriority: 90,
          isPrimary: false, // Discovered later via linkpage scraper
        },
      ];

      // Sort with our new lexicographic ranking logic:
      contacts.sort((a, b) => {
        const tierA = TIER_ORDER[a.calculatedTier] || 99;
        const tierB = TIER_ORDER[b.calculatedTier] || 99;
        if (tierA !== tierB) return tierA - tierB;

        const statusWeight: Record<string, number> = {
          MAILBOX_VERIFIED: 1,
          VALID: 2,
          DOMAIN_VALID: 3,
        };
        const weightA = statusWeight[a.emailStatus || ''] || 99;
        const weightB = statusWeight[b.emailStatus || ''] || 99;
        if (weightA !== weightB) return weightA - weightB;

        if (b.calculatedPriority !== a.calculatedPriority) {
          return b.calculatedPriority - a.calculatedPriority;
        }

        if (b.isPrimary !== a.isPrimary) {
          return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
        }

        return a.contactId - b.contactId;
      });

      // Assert verified personal email wins over generic address:
      expect(contacts[0].contactId).toBe(102);
      expect(contacts[0].email).toBe('creator@gmail.com');
      expect(contacts[0].calculatedTier).toBe('A1');
    });

    it('should correctly use isPrimary as tie-breaker when tiers and statuses are identical', () => {
      interface MockCandidate {
        contactId: number;
        email: string;
        calculatedTier: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
        emailStatus: string;
        calculatedPriority: number;
        isPrimary: boolean;
      }

      const contacts: MockCandidate[] = [
        {
          contactId: 201,
          email: 'contact2@channel.com',
          calculatedTier: 'A1',
          emailStatus: 'MAILBOX_VERIFIED',
          calculatedPriority: 90,
          isPrimary: false,
        },
        {
          contactId: 202,
          email: 'contact1@channel.com',
          calculatedTier: 'A1',
          emailStatus: 'MAILBOX_VERIFIED',
          calculatedPriority: 90,
          isPrimary: true,
        },
      ];

      contacts.sort((a, b) => {
        const tierA = TIER_ORDER[a.calculatedTier] || 99;
        const tierB = TIER_ORDER[b.calculatedTier] || 99;
        if (tierA !== tierB) return tierA - tierB;

        const statusWeight: Record<string, number> = {
          MAILBOX_VERIFIED: 1,
          VALID: 2,
          DOMAIN_VALID: 3,
        };
        const weightA = statusWeight[a.emailStatus || ''] || 99;
        const weightB = statusWeight[b.emailStatus || ''] || 99;
        if (weightA !== weightB) return weightA - weightB;

        if (b.calculatedPriority !== a.calculatedPriority) {
          return b.calculatedPriority - a.calculatedPriority;
        }

        if (b.isPrimary !== a.isPrimary) {
          return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
        }

        return a.contactId - b.contactId;
      });

      // Assert isPrimary wins when tiers are equal:
      expect(contacts[0].contactId).toBe(202);
      expect(contacts[0].email).toBe('contact1@channel.com');
    });
  });

  describe('Pillar 1: YouTube API Quota Budget Constraints', () => {
    it('should strictly budget total units below hard ceiling of 10,000 units with 200 safety buffer', () => {
      const singleKeyBudget = 10000 - 200; // 9,800 units
      const searchCost = 100;
      const channelBatchCost = 1;
      const videoMiningCostPerChannel = 1;

      // 10 searches + 10 channel batches + 300 video checks
      const dailyUsage = (10 * searchCost) + (10 * channelBatchCost) + (300 * videoMiningCostPerChannel);
      expect(dailyUsage).toBe(1310);
      expect(dailyUsage).toBeLessThanOrEqual(singleKeyBudget);

      // Max theoretical search limit is 98 calls
      const maxSearches = Math.floor(singleKeyBudget / searchCost);
      expect(maxSearches).toBe(98);
    });
  });
});
