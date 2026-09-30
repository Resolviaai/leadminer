import { describe, it, expect, vi } from 'vitest';
import { linkPageScraper } from '../../src/services/extraction/linkpage.scraper';
import * as ssrfModule from '../../src/lib/ssrf-guard';

describe('N-P2-1 Linkpage Scraper SSRF Guard Suite', () => {
  it('blocks localhost / loopback targets with SSRF_BLOCKED', async () => {
    const res = await (linkPageScraper as any).fetchHtml('http://127.0.0.1:8080/admin');
    expect(res.html).toBeNull();
    expect(res.error).toBe('SSRF_BLOCKED');
  });

  it('blocks AWS/GCP cloud metadata targets (169.254.169.254)', async () => {
    const res = await (linkPageScraper as any).fetchHtml('http://169.254.169.254/latest/meta-data/');
    expect(res.html).toBeNull();
    expect(res.error).toBe('SSRF_BLOCKED');
  });

  it('blocks RFC1918 private network targets (192.168.1.1, 10.0.0.1)', async () => {
    const res1 = await (linkPageScraper as any).fetchHtml('http://192.168.1.1/router');
    expect(res1.html).toBeNull();
    expect(res1.error).toBe('SSRF_BLOCKED');

    const res2 = await (linkPageScraper as any).fetchHtml('http://10.0.0.1/internal');
    expect(res2.html).toBeNull();
    expect(res2.error).toBe('SSRF_BLOCKED');
  });

  it('blocks external redirect hops to private / cloud metadata targets', async () => {
    const originalFetch = globalThis.fetch;
    const ssrfSpy = vi.spyOn(ssrfModule, 'isSafePublicUrl').mockImplementation(async (url: string) => {
      // Allow the initial public hop, but reject private / metadata IP on redirect
      return !url.includes('169.254') && !url.includes('127.0.0.1');
    });

    try {
      // Mock initial public fetch returning a 302 to AWS cloud metadata IP
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 302,
        ok: false,
        headers: new Headers({
          location: 'http://169.254.169.254/latest/meta-data/',
        }),
      } as any);

      const res = await (linkPageScraper as any).fetchHtml('https://legit-public-redirector.com/link');
      expect(res.html).toBeNull();
      expect(res.error).toBe('SSRF_BLOCKED');
      // Proves isSafePublicUrl was called for BOTH hop 0 and hop 1
      expect(ssrfSpy).toHaveBeenCalledTimes(2);
    } finally {
      globalThis.fetch = originalFetch;
      ssrfSpy.mockRestore();
    }
  });

  it('handles malformed percent encoding without crashing scrapeLinkPage', async () => {
    const originalFetch = (linkPageScraper as any).fetchHtml;
    try {
      (linkPageScraper as any).fetchHtml = vi.fn().mockResolvedValue({
        html: `
          <html>
            <body>
              <a href="mailto:malformed%E0%A4%20@test.com">Broken Mailto</a>
              <a href="mailto:valid%2bpartner@company.com">Valid Encoded Mailto</a>
            </body>
          </html>
        `,
      });

      const res = await linkPageScraper.scrapeLinkPage('https://mycreator.linktr.ee/profile');
      expect(res.status).toBe('SUCCESS');
      expect(res.emails.map((e) => e.email)).toContain('valid+partner@company.com');
    } finally {
      (linkPageScraper as any).fetchHtml = originalFetch;
    }
  });
});
