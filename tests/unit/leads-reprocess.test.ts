import { describe, it, expect, vi, afterEach } from 'vitest';
import { websiteScraper } from '../../src/services/extraction/website.scraper';
import { socialExtractor } from '../../src/services/extraction/social.extractor';
import { leadQualificationService } from '../../src/services/qualification/qualification.service';

describe('Lead Reprocess & Multi-Channel Contact Discovery', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should recover missing email and phone from creator website during reprocess', async () => {
    const creatorWebsiteHtml = `
      <html>
        <body>
          <h1>Welcome to Tech Creator</h1>
          <p>Contact management directly at: <a href="mailto:partnerships@techcreator.io">partnerships@techcreator.io</a></p>
          <p>WhatsApp: <a href="https://wa.me/14155552671">Chat on WhatsApp</a></p>
          <p>Call us: 415-555-2671</p>
        </body>
      </html>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => creatorWebsiteHtml,
    } as any);

    const scraped = await websiteScraper.scrapeUrl('https://techcreator.io');

    expect(scraped.emails).toContain('partnerships@techcreator.io');
    expect(scraped.whatsapp).toBe('+14155552671');
    expect(scraped.phones.length).toBeGreaterThan(0);
  });

  it('should qualify lead once deliverable email is discovered and disqualify if suppressed', () => {
    // 1. Initial state: No email -> unqualified
    const candidateNoEmail = {
      subscriberCount: 25000,
      email: null,
      emailStatus: null,
      country: 'US',
    };

    const criteria = {
      minSubscribers: 1000,
      requireEmail: true,
      requireValidEmail: true,
      targetCountry: 'US',
    };

    const res1 = leadQualificationService.qualify(candidateNoEmail, criteria);
    expect(res1.qualified).toBe(false);

    // 2. Recovered email verified as deliverable -> qualified
    const candidateRecovered = {
      ...candidateNoEmail,
      email: 'partnerships@techcreator.io',
      emailStatus: 'VALID',
    };

    const res2 = leadQualificationService.qualify(candidateRecovered, criteria);
    expect(res2.qualified).toBe(true);

    // 3. If lead is suppressed -> immediately disqualified
    const candidateSuppressed = {
      ...candidateRecovered,
      isSuppressed: true,
    };

    const res3 = leadQualificationService.qualify(candidateSuppressed, criteria);
    expect(res3.qualified).toBe(false);
    expect(res3.reason).toContain('suppression');
  });

  it('should extract WhatsApp links and phone numbers from description text', () => {
    const description = `
      Tech Creator & AI builder.
      For sponsorships reach out on WhatsApp: +1 415 555 9999 or call: 415-555-9999.
      Join my Discord: https://discord.gg/techgang
    `;

    const extracted = socialExtractor.extractSocials(description);
    expect(extracted.whatsapp).toBe('+14155559999');
    expect(extracted.phone).toBeDefined();
    expect(extracted.discord).toBe('https://discord.gg/techgang');
  });
});
