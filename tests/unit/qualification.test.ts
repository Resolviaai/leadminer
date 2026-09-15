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
    expect(res.reason).toContain('not verified as VALID');
  });
});
