import { describe, it, expect, vi, beforeEach } from 'vitest';
import { websiteScraper } from '../../src/services/extraction/website.scraper';

describe('Website Scraper & Targeted Contact Crawler Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (websiteScraper as any).domainCache.clear();
  });

  it('should score and prioritize commercial contact subpages over generic pages', () => {
    const html = `
      <html>
        <body>
          <a href="/privacy-policy">Privacy</a>
          <a href="/cart">Cart</a>
          <a href="/about-us">About Our Team</a>
          <a href="/press-media">Press Kit</a>
          <a href="/business-inquiries">Sponsor & Business Inquiries</a>
          <a href="/contact">Get in Touch</a>
        </body>
      </html>
    `;

    const subpages = (websiteScraper as any).findContactSubpageUrls(html, 'https://creatorstudio.io');

    expect(subpages).toHaveLength(2);
    // Highest scored pages must be picked
    expect(subpages).toContain('https://creatorstudio.io/business-inquiries');
    expect(subpages).toContain('https://creatorstudio.io/contact');
    // Negative pages must never be included
    expect(subpages).not.toContain('https://creatorstudio.io/privacy-policy');
    expect(subpages).not.toContain('https://creatorstudio.io/cart');
  });

  it('should detect contact form presence and extract microdata itemprop attributes', async () => {
    const sampleHtml = `
      <html>
        <body>
          <div itemscope itemtype="http://schema.org/Organization">
            <span itemprop="name">Creator Studio Agency</span>
            <span itemprop="email">mailto:agency@creatorstudio.io</span>
            <span itemprop="telephone">+1-800-555-0199</span>
          </div>
          <form action="/api/contact" method="POST">
            <input type="text" name="name" placeholder="Your Name" />
            <input type="email" name="email" placeholder="Your Email" />
            <textarea name="message" placeholder="Business Inquiry Details"></textarea>
            <button type="submit">Send Message</button>
          </form>
        </body>
      </html>
    `;

    vi.spyOn(websiteScraper as any, 'fetchHtml').mockResolvedValue(sampleHtml);

    const result = await websiteScraper.scrapeUrl('https://creatorstudio.io');

    expect(result.contactFormAvailable).toBe(true);
    expect(result.emails).toContain('agency@creatorstudio.io');
    expect(result.phones).toContain('+1-800-555-0199');
  });

  it('should extract Schema.org ContactPoint object from JSON-LD', async () => {
    const sampleHtml = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SuperMedia Corp",
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "telephone": "+1-415-555-1234",
                "contactType": "sales",
                "email": "partnerships@supermedia.com"
              }
            ]
          }
          </script>
        </head>
        <body>
          <h1>Welcome</h1>
        </body>
      </html>
    `;

    vi.spyOn(websiteScraper as any, 'fetchHtml').mockResolvedValue(sampleHtml);

    const result = await websiteScraper.scrapeUrl('https://supermedia.com');

    expect(result.emails).toContain('partnerships@supermedia.com');
    expect(result.phones).toContain('+1-415-555-1234');
  });

  it('should deduplicate repeated scrapes using in-memory domain crawl cache', async () => {
    const fetchSpy = vi.spyOn(websiteScraper as any, 'fetchHtml').mockResolvedValue(`
      <html>
        <body>
          <a href="mailto:hello@cachedsite.com">Email Us</a>
        </body>
      </html>
    `);

    const firstResult = await websiteScraper.scrapeUrl('https://cachedsite.com');
    const secondResult = await websiteScraper.scrapeUrl('https://cachedsite.com');

    expect(firstResult.emails).toContain('hello@cachedsite.com');
    expect(secondResult.emails).toContain('hello@cachedsite.com');
    // Only 1 network request fired because the 2nd was served from DomainCrawlCache
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
