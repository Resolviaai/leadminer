import { describe, it, expect } from 'vitest';
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

  it('should reject leads with DOMAIN_VALID email by default when ALLOW_DOMAIN_VALID_OUTREACH is false', () => {
    const candidate = {
      subscriberCount: 25000,
      email: 'domainonly@podcasts.com',
      emailStatus: 'DOMAIN_VALID',
      category: 'Top Podcasters',
      isSuppressed: false,
      alreadyContacted: false,
    };

    const res = leadQualificationService.qualify(candidate, defaultCriteria);
    expect(res.qualified).toBe(false);
    expect(res.reason).toContain('not verified as deliverable');
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
});
