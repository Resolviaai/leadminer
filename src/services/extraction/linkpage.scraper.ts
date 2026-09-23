import * as cheerio from 'cheerio';
import { emailExtractor, categorizeEmail, EmailCategory } from './email.extractor';
import { socialExtractor } from './social.extractor';
import { isSafePublicUrl } from '../../lib/ssrf-guard';

export interface ScrapedLinkPageResult {
  url: string;
  emails: { email: string; category: EmailCategory }[];
  socials: Record<string, string>;
  status: 'SUCCESS' | 'NO_EMAIL' | 'FAILED' | 'TIMEOUT';
  error?: string;
}

export class LinkPageScraper {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  private isIgnoredUrl(url: string): boolean {
    const lower = url.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico|js|css|woff|woff2|ttf|eot)(\?.*)?$/i.test(lower)) {
      return true;
    }
    const ignoredHosts = [
      'schema.org',
      'spotifycdn.com',
      'facebook.net',
      'facebook.com',
      'fb.com',
      'instagram.com',
      'twitter.com',
      'x.com',
      'tiktok.com',
      'assetlab.io',
      'doubleclick.net',
      'google-analytics.com',
      'googletagmanager.com',
      'googleusercontent.com',
      'googleapis.com',
      'gstatic.com',
      'youtube.com',
      'youtu.be',
      'lpcontent.net',
    ];
    return ignoredHosts.some((h) => lower.includes(h));
  }

  private normalizeUrl(rawUrl: string): string | null {
    let url = rawUrl.trim();
    if (!url || this.isIgnoredUrl(url)) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    try {
      const parsed = new URL(url);
      if (this.isIgnoredUrl(parsed.hostname)) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private async fetchHtml(url: string, maxBytes = 524288): Promise<{ html: string | null; error?: string }> {
    try {
      // N-P2-1: Reject loopback, private IP, and cloud metadata targets
      if (!(await isSafePublicUrl(url))) {
        console.warn(`[SSRF Guard] Blocked unsafe linkpage target URL: ${url}`);
        return { html: null, error: 'SSRF_BLOCKED' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { html: null, error: `HTTP_${response.status}` };
      }

      const text = await response.text();
      return { html: text.slice(0, maxBytes) };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { html: null, error: 'TIMEOUT' };
      }
      return { html: null, error: err.message || 'FETCH_ERROR' };
    }
  }

  /**
   * Scrapes Linktree, Beacons, Stan.store, Carrd, or personal landing pages.
   */
  public async scrapeLinkPage(targetUrl: string): Promise<ScrapedLinkPageResult> {
    const normalized = this.normalizeUrl(targetUrl);
    if (!normalized) {
      return { url: targetUrl, emails: [], socials: {}, status: 'FAILED', error: 'INVALID_URL' };
    }

    const { html, error } = await this.fetchHtml(normalized);
    if (!html) {
      return {
        url: normalized,
        emails: [],
        socials: {},
        status: error === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED',
        error: error || 'UNREACHABLE',
      };
    }

    const emailSet = new Set<string>();
    let emails: { email: string; category: EmailCategory }[] = [];
    const socials: Record<string, string> = {};

    const addEmail = (rawEmail: string) => {
      let clean = decodeURIComponent(rawEmail).toLowerCase().trim();
      clean = clean.replace(/^(\\u003e|u003e|>|&gt;)+/i, '').trim();
      while (clean.endsWith('.') || clean.endsWith(',')) clean = clean.slice(0, -1);
      if (clean && !emailSet.has(clean) && clean.includes('@') && clean.includes('.')) {
        const domain = clean.split('@')[1];
        const blocked = ['patreon.com', 'spotify.com', 'linktr.ee', 'beacons.ai', 'sentry.io', 'wixpress.com', 'example.com'];
        if (!blocked.includes(domain)) {
          emailSet.add(clean);
        }
      }
    };

    // 1. Cheerio DOM Parsing
    const $ = cheerio.load(html);

    // 2. Scan all mailto links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0];
      if (email) addEmail(email);
    });

    // 3. Scan __NEXT_DATA__ JSON (Linktree, Beacons, Stan.store)
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript);
        this.extractEmailsFromJson(nextData, addEmail);
      } catch {
        // Non-fatal if JSON is malformed
      }
    }

    // 4. Scan embedded script tags for mailto / email structures (e.g. Beacons, Carrd)
    $('script').each((_, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.includes('mailto:') || scriptContent.includes('@')) {
        const mailtoMatches = scriptContent.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
        for (const m of mailtoMatches) {
          if (m[1]) addEmail(m[1]);
        }
      }
    });

    // 5. Fallback regex over page text content
    const bodyText = $('body').text() || '';
    const extractedTextEmails = emailExtractor.extractEmails(bodyText, 'links');
    for (const item of extractedTextEmails) {
      addEmail(item.email);
    }

    // 6. Extract socials from links on the landing page
    const extractedSocials = socialExtractor.extractSocials(html);
    if (extractedSocials.instagram) socials.instagram = extractedSocials.instagram;
    if (extractedSocials.twitter) socials.twitter = extractedSocials.twitter;
    if (extractedSocials.discord) socials.discord = extractedSocials.discord;
    if (extractedSocials.tiktok) socials.tiktok = extractedSocials.tiktok;
    if (extractedSocials.linkedin) socials.linkedin = extractedSocials.linkedin;

    // Categorize discovered emails
    emails = Array.from(emailSet).map((email) => ({
      email,
      category: categorizeEmail(email),
    }));

    // Sort by priority: CREATOR_DIRECT > BUSINESS_INQUIRIES > MANAGEMENT > GENERIC_SUPPORT
    const priorityOrder: Record<EmailCategory, number> = {
      CREATOR_DIRECT: 0,
      BUSINESS_INQUIRIES: 1,
      MANAGEMENT: 2,
      GENERIC_SUPPORT: 3,
    };
    emails.sort((a, b) => priorityOrder[a.category] - priorityOrder[b.category]);

    return {
      url: normalized,
      emails,
      socials,
      status: emails.length > 0 ? 'SUCCESS' : 'NO_EMAIL',
    };
  }

  private extractEmailsFromJson(obj: any, addEmail: (e: string) => void, depth = 0): void {
    if (!obj || depth > 8) return;

    if (typeof obj === 'string') {
      if (obj.startsWith('mailto:')) {
        addEmail(obj.replace('mailto:', '').split('?')[0]);
      } else if (obj.includes('@') && !obj.includes(' ') && obj.includes('.')) {
        const match = obj.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) addEmail(match[0]);
      }
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.extractEmailsFromJson(item, addEmail, depth + 1);
      }
      return;
    }

    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        // Special check for Linktree/Beacons object keys
        if (key === 'email' && typeof obj[key] === 'string') {
          addEmail(obj[key]);
        } else if (key === 'url' && typeof obj[key] === 'string' && obj[key].startsWith('mailto:')) {
          addEmail(obj[key].replace('mailto:', '').split('?')[0]);
        } else {
          this.extractEmailsFromJson(obj[key], addEmail, depth + 1);
        }
      }
    }
  }
}

export const linkPageScraper = new LinkPageScraper();
