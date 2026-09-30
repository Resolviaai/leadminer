import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactResolutionEngine } from '../../src/services/extraction/contact-resolution.engine';
import { linkPageScraper } from '../../src/services/extraction/linkpage.scraper';
import { websiteScraper } from '../../src/services/extraction/website.scraper';

describe('ContactResolutionEngine & Extraction Pipeline Suite', () => {
  it('deduplicates emails across sources and prioritizes BUSINESS over SUPPORT', () => {
    const rawCandidates = [
      {
        email: 'SUPPORT@CREATORSTUDIO.IO',
        role: 'SUPPORT' as const,
        priorityScore: 15,
        confidence: 0.95,
        source: 'contact_page',
      },
      {
        email: 'collabs@creatorstudio.io',
        role: 'BUSINESS' as const,
        priorityScore: 100,
        confidence: 0.90,
        source: 'description',
      },
      {
        email: 'collabs@creatorstudio.io', // Duplicate candidate from video description
        role: 'BUSINESS' as const,
        priorityScore: 100,
        confidence: 0.92,
        source: 'video_description',
      },
    ];

    const result = contactResolutionEngine.resolveEmails(rawCandidates);

    expect(result.allEmails).toHaveLength(2);
    // Primary must be the highest priority commercial address
    expect(result.primaryEmail).not.toBeNull();
    expect(result.primaryEmail?.email).toBe('collabs@creatorstudio.io');
    expect(result.primaryEmail?.role).toBe('BUSINESS');
    expect(result.primaryEmail?.priorityScore).toBe(100);

    // Secondary must be the support address
    expect(result.secondaryEmails).toHaveLength(1);
    expect(result.secondaryEmails[0].email).toBe('support@creatorstudio.io');
  });

  it('demotes domain typo candidates below valid clean addresses', () => {
    const rawCandidates = [
      {
        email: 'partnerships@gmial.com',
        role: 'BUSINESS' as const,
        priorityScore: 100,
        confidence: 0.65,
        possibleDomainTypo: true,
        source: 'description',
      },
      {
        email: 'hello@creator.com',
        role: 'GENERIC' as const,
        priorityScore: 50,
        confidence: 0.90,
        possibleDomainTypo: false,
        source: 'website',
      },
    ];

    const result = contactResolutionEngine.resolveEmails(rawCandidates);

    expect(result.primaryEmail?.email).toBe('hello@creator.com');
    expect(result.secondaryEmails[0].email).toBe('partnerships@gmial.com');
    expect(result.secondaryEmails[0].possibleDomainTypo).toBe(true);
  });

  it('evaluates sufficiency correctly: sufficient for clean commercial email, insufficient for typo/generic', () => {
    const cleanCommercial = [
      {
        email: 'business@creator.com',
        role: 'BUSINESS' as const,
        priorityScore: 100,
        confidence: 0.90,
        possibleDomainTypo: false,
        source: 'description' as const,
      },
    ];
    const suff1 = contactResolutionEngine.evaluateSufficiency(cleanCommercial);
    expect(suff1.isSufficient).toBe(true);

    const typoOnly = [
      {
        email: 'business@gmial.com',
        role: 'BUSINESS' as const,
        priorityScore: 100,
        confidence: 0.60,
        possibleDomainTypo: true,
        source: 'description' as const,
      },
    ];
    const suff2 = contactResolutionEngine.evaluateSufficiency(typoOnly);
    expect(suff2.isSufficient).toBe(false);

    const suff3 = contactResolutionEngine.evaluateSufficiency([]);
    expect(suff3.isSufficient).toBe(false);
  });

  it('determines the correct next action in Architecture B cascade', () => {
    // 1. If sufficient, STOP
    expect(
      contactResolutionEngine.getNextAction({
        hasSufficientEmail: true,
        videoMiningAttempted: false,
        hasUploadsPlaylist: true,
        externalCrawlAttempted: false,
        hasExternalTarget: true,
        jevAttempted: false,
        jevConfirmedContact: false,
        geminiAttempted: false,
      })
    ).toBe('STOP');

    // 2. If insufficient and videos not mined, CHECK_VIDEOS
    expect(
      contactResolutionEngine.getNextAction({
        hasSufficientEmail: false,
        videoMiningAttempted: false,
        hasUploadsPlaylist: true,
        externalCrawlAttempted: false,
        hasExternalTarget: true,
        jevAttempted: false,
        jevConfirmedContact: false,
        geminiAttempted: false,
      })
    ).toBe('CHECK_VIDEOS');

    // 3. If videos mined and external target available, CRAWL_EXTERNAL
    expect(
      contactResolutionEngine.getNextAction({
        hasSufficientEmail: false,
        videoMiningAttempted: true,
        hasUploadsPlaylist: true,
        externalCrawlAttempted: false,
        hasExternalTarget: true,
        jevAttempted: false,
        jevConfirmedContact: false,
        geminiAttempted: false,
      })
    ).toBe('CRAWL_EXTERNAL');

    // 4. If external crawl done and Jev not attempted, CALL_JEV
    expect(
      contactResolutionEngine.getNextAction({
        hasSufficientEmail: false,
        videoMiningAttempted: true,
        hasUploadsPlaylist: true,
        externalCrawlAttempted: true,
        hasExternalTarget: true,
        jevAttempted: false,
        jevConfirmedContact: false,
        geminiAttempted: false,
      })
    ).toBe('CALL_JEV');

    // 5. If Jev confirmed contact and Gemini not attempted, CALL_GEMINI
    expect(
      contactResolutionEngine.getNextAction({
        hasSufficientEmail: false,
        videoMiningAttempted: true,
        hasUploadsPlaylist: true,
        externalCrawlAttempted: true,
        hasExternalTarget: true,
        jevAttempted: true,
        jevConfirmedContact: true,
        geminiAttempted: false,
      })
    ).toBe('CALL_GEMINI');
  });

  it('consolidates socials from multiple sources preserving all unique platforms and items', () => {
    const s1 = {
      instagram: 'creator_ig',
      twitter: 'creator_tw',
      items: [
        { type: 'INSTAGRAM' as const, value: 'creator_ig', normalizedValue: 'creator_ig', source: 'desc' },
      ],
    };
    const s2 = {
      discord: 'https://discord.gg/creator',
      phone: '+1-555-0199',
      whatsapp: '+1-555-0199',
      items: [
        { type: 'DISCORD' as const, value: 'https://discord.gg/creator', normalizedValue: 'https://discord.gg/creator', source: 'link' },
        { type: 'PHONE' as const, value: '+1-555-0199', normalizedValue: '+15550199', source: 'link' },
      ],
    };

    const merged = contactResolutionEngine.consolidateSocials([s1, s2]);

    expect(merged.instagram).toBe('creator_ig');
    expect(merged.twitter).toBe('creator_tw');
    expect(merged.discord).toBe('https://discord.gg/creator');
    expect(merged.phone).toBe('+1-555-0199');
    expect(merged.whatsapp).toBe('+1-555-0199');
    expect(merged.items).toHaveLength(3);
  });
});

describe('LinkPageScraper Hostname Matching & Rich Metadata', () => {
  it('does not falsely block domains containing youtube as a substring (e.g. myyoutube.com)', () => {
    const isIgnored = (linkPageScraper as any).isIgnoredHost('myyoutube.com');
    expect(isIgnored).toBe(false);

    const isActualYoutube = (linkPageScraper as any).isIgnoredHost('www.youtube.com');
    expect(isActualYoutube).toBe(true);

    const isExactYoutube = (linkPageScraper as any).isIgnoredHost('youtube.com');
    expect(isExactYoutube).toBe(true);
  });

  it('preserves rich metadata (role, priorityScore, confidence) on scraped link page emails', async () => {
    vi.spyOn(linkPageScraper as any, 'fetchHtml').mockResolvedValue({
      html: `
        <html>
          <body>
            <a href="mailto:booking@creatorfanpage.com">Bookings</a>
          </body>
        </html>
      `,
    });

    const res = await linkPageScraper.scrapeLinkPage('https://stan.store/creator');
    expect(res.status).toBe('SUCCESS');
    expect(res.emails).toHaveLength(1);
    expect(res.emails[0].email).toBe('booking@creatorfanpage.com');
    expect(res.emails[0].role).toBe('BUSINESS');
    expect(res.emails[0].priorityScore).toBe(100);
    expect(res.emails[0].confidence).toBeGreaterThanOrEqual(0.9);
  });
});

describe('WebsiteScraper Continuation on Generic Email', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (websiteScraper as any).domainCache.clear();
  });

  it('continues crawling top contact subpage when homepage only contains generic support email', async () => {
    const homepageHtml = `
      <html>
        <body>
          <a href="/business-deals">Business Deals</a>
          <footer>Email: support@creatorstudio.io</footer>
        </body>
      </html>
    `;
    const subpageHtml = `
      <html>
        <body>
          <a href="mailto:partnerships@creatorstudio.io">Partner with Us</a>
        </body>
      </html>
    `;

    vi.spyOn(websiteScraper as any, 'fetchHtml').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('business-deals')) return subpageHtml;
      return homepageHtml;
    });

    const result = await websiteScraper.scrapeUrl('https://creatorstudio.io');

    // Both support and business should be discovered because it didn't abort on support@
    expect(result.emails).toContain('support@creatorstudio.io');
    expect(result.emails).toContain('partnerships@creatorstudio.io');
  });
});
