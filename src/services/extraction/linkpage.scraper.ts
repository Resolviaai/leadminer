import * as cheerio from 'cheerio';
import { emailExtractor, classifyEmailRole, categorizeEmail, EmailCategory } from './email.extractor';
import { socialExtractor, ExtractedContactItem } from './social.extractor';
import { safeFetchHtmlStream, DomainCrawlCache } from './http-stream';

export interface ScrapedLinkPageResult {
  url: string;
  emails: {
    email: string;
    category: EmailCategory;
    role?: string;
    priorityScore?: number;
    confidence?: number;
    source?: string;
  }[];
  socials: Record<string, string>;
  items?: ExtractedContactItem[];
  phone?: string;
  whatsapp?: string;
  status: 'SUCCESS' | 'NO_EMAIL' | 'FAILED' | 'TIMEOUT';
  error?: string;
}

function safeDecodeUriComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export class LinkPageScraper {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  private domainCache = new DomainCrawlCache<ScrapedLinkPageResult>(15 * 60 * 1000);

  private isIgnoredHost(hostname: string): boolean {
    const host = hostname.toLowerCase().trim();
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
    return ignoredHosts.some((h) => host === h || host.endsWith('.' + h));
  }

  private isIgnoredAsset(pathname: string): boolean {
    return /\.(png|jpg|jpeg|gif|svg|webp|ico|js|css|woff|woff2|ttf|eot)(\?.*)?$/i.test(pathname);
  }

  private normalizeUrl(rawUrl: string): string | null {
    let url = rawUrl.trim();
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    try {
      const parsed = new URL(url);
      if (this.isIgnoredHost(parsed.hostname)) return null;
      if (this.isIgnoredAsset(parsed.pathname)) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private getCacheKey(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private async fetchHtml(url: string, maxBytes = 262144): Promise<{ html: string | null; error?: string }> {
    const res = await safeFetchHtmlStream(url, {
      userAgent: this.userAgent,
      timeoutMs: 4000,
      maxBytes,
      maxHops: 3,
    });
    return { html: res.html, error: res.error };
  }

  /**
   * Scrapes Linktree, Beacons, Stan.store, Carrd, or personal landing pages.
   */
  public async scrapeLinkPage(targetUrl: string): Promise<ScrapedLinkPageResult> {
    const normalized = this.normalizeUrl(targetUrl);
    if (!normalized) {
      return { url: targetUrl, emails: [], socials: {}, status: 'FAILED', error: 'INVALID_URL' };
    }

    // Domain / Hostname cache check
    const cacheKey = this.getCacheKey(normalized);
    const cached = this.domainCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { html, error } = await this.fetchHtml(normalized);
    if (!html) {
      const failResult: ScrapedLinkPageResult = {
        url: normalized,
        emails: [],
        socials: {},
        status: error === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED',
        error: error || 'UNREACHABLE',
      };
      this.domainCache.set(cacheKey, failResult, true);
      return failResult;
    }

    const emailSet = new Set<string>();
    let emails: {
      email: string;
      category: EmailCategory;
      role?: string;
      priorityScore?: number;
      confidence?: number;
      source?: string;
    }[] = [];
    const socials: Record<string, string> = {};

    const addEmail = (rawEmail: string) => {
      let clean = safeDecodeUriComponent(rawEmail).toLowerCase().trim();
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

    // 4. Scan JSON-LD and embedded script tags for mailto / email structures (e.g. Beacons, Carrd, Schema.org)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const rawJson = $(el).html();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          this.extractEmailsFromJson(parsed, addEmail);
        }
      } catch {
        // Non-fatal if JSON-LD is malformed
      }
    });

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

    // 6. Extract socials and contact items from links on the landing page
    const extractedSocials = socialExtractor.extractSocials(html);
    if (extractedSocials.instagram) socials.instagram = extractedSocials.instagram;
    if (extractedSocials.twitter) socials.twitter = extractedSocials.twitter;
    if (extractedSocials.discord) socials.discord = extractedSocials.discord;
    if (extractedSocials.tiktok) socials.tiktok = extractedSocials.tiktok;
    if (extractedSocials.linkedin) socials.linkedin = extractedSocials.linkedin;
    if (extractedSocials.linktree) socials.linktree = extractedSocials.linktree;
    if (extractedSocials.beacons) socials.beacons = extractedSocials.beacons;
    if (extractedSocials.website) socials.website = extractedSocials.website;
    if (extractedSocials.phone) socials.phone = extractedSocials.phone;
    if (extractedSocials.whatsapp) socials.whatsapp = extractedSocials.whatsapp;

    // Categorize and score discovered emails with rich metadata
    emails = Array.from(emailSet).map((email) => {
      const { role, priorityScore } = emailExtractor.classifyEmailRole(email, bodyText);
      const category = categorizeEmail(email);
      return {
        email,
        category,
        role,
        priorityScore,
        confidence: 0.92,
        source: 'link_page',
      };
    });

    // Sort by priorityScore descending
    emails.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

    const successResult: ScrapedLinkPageResult = {
      url: normalized,
      emails,
      socials,
      items: extractedSocials.items,
      phone: extractedSocials.phone,
      whatsapp: extractedSocials.whatsapp,
      status: emails.length > 0 ? 'SUCCESS' : 'NO_EMAIL',
    };
    this.domainCache.set(cacheKey, successResult);
    return successResult;
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
      const targetKeys = new Set([
        'email',
        'contactemail',
        'businessemail',
        'mail',
        'inquiryemail',
        'supportemail',
        'collabemail',
        'emailaddress',
      ]);

      for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        if (targetKeys.has(lowerKey) && typeof obj[key] === 'string') {
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
