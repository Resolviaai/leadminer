import { describe, it, expect, vi } from 'vitest';
import { linkPageScraper } from '../../src/services/extraction/linkpage.scraper';

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
});
