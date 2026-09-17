import { describe, it, expect } from 'vitest';
import { env } from '../../src/config/env';
import { leadQualificationService } from '../../src/services/qualification/qualification.service';

describe('Lead Qualification Service', () => {
  const defaultCriteria = {
    minSubscribers: 5000,
    maxSubscribers: 500000,
    requireEmail: true,
    requireValidEmail: true,
    categoryWhitelist: ['Top Podcasters', 'Top YouTubers'],
  };

  it('should qualify leads that meet all thresholds', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'creator@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, defaultCriteria);
    expect(res.qualified).toBe(true);
  });

  it('should reject suppressed leads', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'creator@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      isSuppressed: true,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, defaultCriteria);
    expect(res.qualified).toBe(false);
    expect(res.reason).toContain('suppression');
  });

  it('should reject leads below minimum subscribers', () => {
    const candidate = {
      subscriberCount: 1500,
      email: 'small@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, defaultCriteria);
    expect(res.qualified).toBe(false);
    expect(res.reason).toContain('below minimum');
  });

  it('should reject leads without valid email', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'unverified@podcasts.com',
      emailStatus: 'UNKNOWN',
      category: 'Top Podcasters',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, defaultCriteria);
    expect(res.qualified).toBe(false);
    expect(res.reason).toContain('not verified as deliverable');
  });

  it('should qualify leads with MAILBOX_VERIFIED email', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'verified@podcasts.com',
      emailStatus: 'MAILBOX_VERIFIED',
      category: 'Top Podcasters',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, defaultCriteria);
    expect(res.qualified).toBe(true);
  });

  it('should qualify or reject DOMAIN_VALID email depending on ALLOW_DOMAIN_VALID_OUTREACH', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'domainonly@podcasts.com',
      emailStatus: 'DOMAIN_VALID',
      category: 'Top Podcasters',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const originalVal = env.ALLOW_DOMAIN_VALID_OUTREACH;
    try {
      env.ALLOW_DOMAIN_VALID_OUTREACH = false;
      const resFalse = leadQualificationService.qualify(candidate, defaultCriteria);
      expect(resFalse.qualified).toBe(false);
      expect(resFalse.reason).toContain('not verified as deliverable');

      env.ALLOW_DOMAIN_VALID_OUTREACH = true;
      const resTrue = leadQualificationService.qualify(candidate, defaultCriteria);
      expect(resTrue.qualified).toBe(true);
    } finally {
      env.ALLOW_DOMAIN_VALID_OUTREACH = originalVal;
    }
  });

  it('should qualify leads when country matches targetCountry', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'creator@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      country: 'US',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, {
      ...defaultCriteria,
      targetCountry: 'US',
    });
    expect(res.qualified).toBe(true);
  });

  it('should handle targetCountry case-insensitively', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'creator@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      country: 'us',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, {
      ...defaultCriteria,
      targetCountry: 'US',
    });
    expect(res.qualified).toBe(true);
  });

  it('should reject leads when country does not match targetCountry', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'creator@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      country: 'GB',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, {
      ...defaultCriteria,
      targetCountry: 'US',
    });
    expect(res.qualified).toBe(false);
    expect(res.reason).toBe('Channel country (GB) does not match target (US)');
  });

  it('should not reject leads when country is undefined or null even if targetCountry is set', () => {
    const candidateUndefined = {
      subscriberCount: 25000,
      email: 'creator@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      country: undefined,
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res1 = leadQualificationService.qualify(candidateUndefined, {
      ...defaultCriteria,
      targetCountry: 'US',
    });
    expect(res1.qualified).toBe(true);

    const candidateNull = {
      subscriberCount: 25000,
      email: 'creator@podcasts.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      country: null,
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res2 = leadQualificationService.qualify(candidateNull, {
      ...defaultCriteria,
      targetCountry: 'US',
    });
    expect(res2.qualified).toBe(true);
  });

  it('should qualify creators from all Tier 1 countries when targetCountry is TIER_1', () => {
    const tier1Codes = [
      'US', 'GB', 'CA', 'AU', 'NZ', 'IE',
      'NL', 'SE', 'DE', 'NO', 'DK', 'FI',
      'CH', 'AT', 'BE', 'SG', 'AE',
    ];

    for (const code of tier1Codes) {
      const candidate = {
        subscriberCount: 25000,
        email: `creator_${code}@channel.com`,
        emailStatus: 'VALID',
        category: 'Top Podcasters',
        country: code,
        isSuppressed: false,
        alreadyContacted: false,
      };

      const res = leadQualificationService.qualify(candidate, {
        ...defaultCriteria,
        targetCountry: 'TIER_1',
      });
      expect(res.qualified, `Expected ${code} to be qualified as Tier 1`).toBe(true);
    }
  });

  it('should reject creators from non-Tier 1 countries when targetCountry is TIER_1', () => {
    const nonTier1Codes = ['BR', 'IN', 'RU', 'MX', 'AR', 'VN'];

    for (const code of nonTier1Codes) {
      const candidate = {
        subscriberCount: 25000,
        email: `creator_${code}@channel.com`,
        emailStatus: 'VALID',
        category: 'Top Podcasters',
        country: code,
        isSuppressed: false,
        alreadyContacted: false,
      };

      const res = leadQualificationService.qualify(candidate, {
        ...defaultCriteria,
        targetCountry: 'TIER_1',
      });
      expect(res.qualified, `Expected ${code} to be rejected`).toBe(false);
      expect(res.reason).toContain('is not in Tier 1 target countries');
    }
  });

  it('should allow creators with undefined country when targetCountry is TIER_1', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'creator_global@channel.com',
      emailStatus: 'VALID',
      category: 'Top Podcasters',
      country: undefined,
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, {
      ...defaultCriteria,
      targetCountry: 'TIER_1',
    });
    expect(res.qualified).toBe(true);
  });
});
