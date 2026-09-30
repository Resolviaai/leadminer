import { describe, it, expect, beforeEach } from 'vitest';
import {
  domainIntelService,
  identifyProviderFromMx,
} from '../../src/services/verification/domain-intel.service';

describe('Domain Intelligence Service', () => {
  beforeEach(() => {
    domainIntelService.clearMemoryCache();
  });

  describe('MX Provider Identification Heuristics', () => {
    it('should correctly identify major consumer email providers', () => {
      expect(identifyProviderFromMx('gmail.com', 'gmail-smtp-in.l.google.com')).toBe('CONSUMER_GMAIL');
      expect(identifyProviderFromMx('googlemail.com', 'gmail-smtp-in.l.google.com')).toBe('CONSUMER_GMAIL');
      expect(identifyProviderFromMx('outlook.com', 'outlook-com.olc.protection.outlook.com')).toBe('CONSUMER_OUTLOOK');
      expect(identifyProviderFromMx('hotmail.com', 'outlook-com.olc.protection.outlook.com')).toBe('CONSUMER_OUTLOOK');
      expect(identifyProviderFromMx('yahoo.com', 'mta5.am0.yahoodns.net')).toBe('YAHOO');
      expect(identifyProviderFromMx('proton.me', 'mail.protonmail.ch')).toBe('PROTON');
      expect(identifyProviderFromMx('icloud.com', 'mx1.mail.icloud.com')).toBe('ICLOUD');
    });

    it('should identify enterprise Google Workspace and Microsoft 365 on custom domains', () => {
      expect(identifyProviderFromMx('myagency.com', 'aspmx.l.google.com')).toBe('GOOGLE_WORKSPACE');
      expect(identifyProviderFromMx('creatorstudio.co', 'creatorstudio-co.mail.protection.outlook.com')).toBe(
        'MICROSOFT_365'
      );
      expect(identifyProviderFromMx('custombrand.io', 'mail.custombrand.io')).toBe('CUSTOM');
      expect(identifyProviderFromMx('nodomain.xyz', null)).toBe('NONE');
    });
  });

  describe('Domain Profile Caching & Health', () => {
    it('should resolve and cache consumer profiles immediately without DNS lookups', async () => {
      const p1 = await domainIntelService.getDomainProfile('gmail.com');
      expect(p1.mxProvider).toBe('CONSUMER_GMAIL');
      expect(p1.hasMx).toBe(true);
      expect(p1.isDisposable).toBe(false);

      // Second call should return from memory cache
      const p2 = await domainIntelService.getDomainProfile('gmail.com');
      expect(p2.source).toBe('memory');
      expect(p2.mxProvider).toBe('CONSUMER_GMAIL');
    });

    it('should record domain bounce history safely', async () => {
      await domainIntelService.recordDomainBounce('gmail.com');
      const profile = await domainIntelService.getDomainProfile('gmail.com');
      expect(profile).toBeDefined();
      expect(profile.mxProvider).toBe('CONSUMER_GMAIL');
    });
  });
});
