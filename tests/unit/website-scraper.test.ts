import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { websiteScraper } from '../../src/services/extraction/website.scraper';

describe('Website Scraper', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should extract mailto, tel, and socials from homepage HTML', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Creator Site</title></head>
        <body>
          <h1>Welcome</h1>
          <a href="mailto:hello@creatorhq.com">Email Us</a>
          <a href="tel:+15551234567">Call Us</a>
          <a href="https://instagram.com/creatorhq">Instagram</a>
          <a href="https://x.com/creatorhq_x">Twitter</a>
          <a href="https://wa.me/15559876543">WhatsApp</a>
        </body>
      </html>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => mockHtml,
    } as any);

    const result = await websiteScraper.scrapeUrl('https://creatorhq.com');

    expect(result.emails).toContain('hello@creatorhq.com');
    expect(result.phones).toContain('+15551234567');
    expect(result.whatsapp).toBe('+15559876543');
    expect(result.socials.instagram).toBe('creatorhq');
    expect(result.socials.twitter).toBe('creatorhq_x');
    expect(result.rawItems.length).toBeGreaterThanOrEqual(4);
  });

  it('should follow /contact subpage if homepage contains no emails', async () => {
    const homepageHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Home Page</h1>
          <p>Read our portfolio.</p>
          <a href="/contact">Get in Touch</a>
        </body>
      </html>
    `;

    const contactHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Contact Us</h1>
          <p>For business: business@creatorhq.com</p>
          <p>Direct line: 555-321-7654</p>
        </body>
      </html>
    `;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/contact')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => contactHtml,
        });
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => homepageHtml,
      });
    });

    const result = await websiteScraper.scrapeUrl('https://creatorhq.com');

    expect(result.emails).toContain('business@creatorhq.com');
    expect(result.contactPageUrl).toBe('https://creatorhq.com/contact');
  });

  it('should handle fetch errors and timeouts gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const result = await websiteScraper.scrapeUrl('https://offline-domain-xyz.com');
    expect(result.emails).toEqual([]);
    expect(result.phones).toEqual([]);
    expect(result.rawItems).toEqual([]);
  });
});
