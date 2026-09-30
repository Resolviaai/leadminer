import { emailExtractor, classifyEmailRole, categorizeEmail } from './email.extractor';
import { socialExtractor, ExtractedContactItem, ContactItemType } from './social.extractor';
import { safeFetchHtmlStream, DomainCrawlCache } from './http-stream';

export interface ScrapedContacts {
  url: string;
  contactPageUrl?: string;
  contactFormAvailable?: boolean;
  emails: string[];
  phones: string[];
  whatsapp?: string;
  socials: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    discord?: string;
    tiktok?: string;
    linktree?: string;
    beacons?: string;
  };
  rawItems: ExtractedContactItem[];
}

export class WebsiteScraper {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  private domainCache = new DomainCrawlCache<ScrapedContacts>(15 * 60 * 1000);

  private normalizeUrl(rawUrl: string): string | null {
    let url = rawUrl.trim();
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    try {
      const parsed = new URL(url);
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private async fetchHtml(url: string, maxBytes = 262144): Promise<string | null> {
    const res = await safeFetchHtmlStream(url, {
      userAgent: this.userAgent,
      timeoutMs: 4000,
      maxBytes,
      maxHops: 3,
    });
    return res.html;
  }

  /**
   * Scored Contact Subpage Discovery
   * Prioritizes high-value business, sponsorship, and booking pages over generic pages.
   * Discards negative routes (cart, checkout, terms, privacy, feeds).
   */
  private findContactSubpageUrls(html: string, baseUrl: string): string[] {
    const negativeKeywords = /(privacy|terms|tos|cookie|cart|checkout|login|signup|register|feed|wp-json|tag\/|category\/|search\/|shop|product\/)/i;
    const fileExtensions = /\.(pdf|png|jpg|jpeg|gif|svg|mp4|zip|docx?)(\?.*)?$/i;

    const scoredCandidates: { url: string; score: number }[] = [];
    const seen = new Set<string>();

    try {
      const baseObj = new URL(baseUrl);
      // Scan hrefs and anchor text: <a href="..." ...>text</a>
      const linkMatches = html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);

      for (const match of linkMatches) {
        const href = match[1]?.trim();
        const anchorText = (match[2] || '').replace(/<[^>]*>/g, '').trim().toLowerCase();

        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          continue;
        }

        if (negativeKeywords.test(href) || fileExtensions.test(href)) {
          continue;
        }

        try {
          const resolved = new URL(href, baseUrl);
          // Only follow links on the exact same origin/domain
          if (resolved.origin !== baseObj.origin || seen.has(resolved.href)) {
            continue;
          }

          const path = resolved.pathname.toLowerCase();
          let score = 0;

          // 1. Path-based commercial scoring
          if (/(contact|contact-us|business|business-inquiries|work-with-me|hire-me)/i.test(path)) {
            score += 100;
          } else if (/(sponsors|sponsorship|partnerships|partner|booking|bookings|management|mgmt)/i.test(path)) {
            score += 95;
          } else if (/(press|media|pr)/i.test(path)) {
            score += 80;
          } else if (/(about|about-us|team|connect)/i.test(path)) {
            score += 65;
          }

          // 2. Anchor text bonus
          if (/(business inquiry|sponsor|booking|partnership|work with me|contact us|contact|collab)/i.test(anchorText)) {
            score += 25;
          } else if (/(about|team)/i.test(anchorText)) {
            score += 10;
          }

          if (score >= 65) {
            seen.add(resolved.href);
            scoredCandidates.push({ url: resolved.href, score });
          }
        } catch {
          // Invalid URL ignored
        }
      }
    } catch {
      // Ignore baseUrl parse failures
    }

    // Sort by score descending and return top 2 candidates
    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates.slice(0, 2).map((c) => c.url);
  }

  private getDomainCacheKey(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  public async scrapeUrl(targetUrl: string): Promise<ScrapedContacts> {
    const normalized = this.normalizeUrl(targetUrl);
    const result: ScrapedContacts = {
      url: targetUrl,
      emails: [],
      phones: [],
      socials: {},
      rawItems: [],
    };

    if (!normalized) return result;

    result.url = normalized;

    // Check domain cache by canonical hostname
    const cacheKey = this.getDomainCacheKey(normalized);
    const cached = this.domainCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Fetch homepage / main target
    const homepageHtml = await this.fetchHtml(normalized);
    if (!homepageHtml) {
      this.domainCache.set(cacheKey, result, true);
      return result;
    }

    this.extractFromHtml(homepageHtml, normalized, result);

    // Detect contact form presence on homepage
    if (/<form[^>]*>[\s\S]*?(?:contact|inquiry|message|email|send)[\s\S]*?<\/form>/i.test(homepageHtml)) {
      result.contactFormAvailable = true;
    }

    // 2. If no commercial/inquiry emails found on homepage, attempt top scored contact subpages (budget: max 2 pages)
    // Do not abort prematurely if homepage only yielded generic/support inbox (e.g. support@ or info@)
    const hasCommercialEmail = result.emails.some((em) => {
      const { role } = emailExtractor.classifyEmailRole(em);
      return role === 'BUSINESS' || role === 'MANAGEMENT' || role === 'DIRECT';
    });

    if (!hasCommercialEmail) {
      const subpages = this.findContactSubpageUrls(homepageHtml, normalized);
      for (const subpageUrl of subpages) {
        result.contactPageUrl = subpageUrl;
        const subpageHtml = await this.fetchHtml(subpageUrl);
        if (subpageHtml) {
          this.extractFromHtml(subpageHtml, subpageUrl, result, 'contact_page');

          if (/<form[^>]*>[\s\S]*?(?:contact|inquiry|message|email|send)[\s\S]*?<\/form>/i.test(subpageHtml)) {
            result.contactFormAvailable = true;
          }

          // If a high-confidence commercial or management email was found on subpage, early-stop
          const nowHasCommercial = result.emails.some((em) => {
            const { role } = emailExtractor.classifyEmailRole(em);
            return role === 'BUSINESS' || role === 'MANAGEMENT' || role === 'DIRECT';
          });
          if (nowHasCommercial) {
            break;
          }
        }
      }
    }

    this.domainCache.set(cacheKey, result);
    return result;
  }

  private extractFromHtml(
    html: string,
    sourceUrl: string,
    result: ScrapedContacts,
    sourceLabel = 'website'
  ): void {
    const emailSet = new Set(result.emails);
    const phoneSet = new Set(result.phones);
    const seenItems = new Set(result.rawItems.map((i) => `${i.type}:${i.normalizedValue}`));

    const addItem = (type: ContactItemType, value: string, normalized: string) => {
      const key = `${type}:${normalized.toLowerCase()}`;
      if (!seenItems.has(key)) {
        seenItems.add(key);
        result.rawItems.push({
          type,
          value,
          normalizedValue: normalized.toLowerCase(),
          source: sourceLabel,
        });
      }
    };

    // 1. Mailto links
    const mailtoMatches = html.matchAll(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["'?]/gi);
    for (const match of mailtoMatches) {
      const email = match[1].toLowerCase().trim();
      if (!emailSet.has(email)) {
        emailSet.add(email);
        result.emails.push(email);
        addItem('EMAIL', email, email);
      }
    }

    // 2. Regular email extractor from text
    const extractedEmails = emailExtractor.extractEmails(html, 'links');
    for (const item of extractedEmails) {
      if (!emailSet.has(item.email)) {
        emailSet.add(item.email);
        result.emails.push(item.email);
        addItem('EMAIL', item.email, item.email);
      }
    }

    // 3. Tel links
    const telMatches = html.matchAll(/href=["']tel:([+0-9\s().-]{7,25})["']/gi);
    for (const match of telMatches) {
      const rawTel = match[1].trim();
      const digits = rawTel.replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        if (!phoneSet.has(rawTel)) {
          phoneSet.add(rawTel);
          result.phones.push(rawTel);
          addItem('PHONE', rawTel, digits);
        }
      }
    }

    // 4. Social & messaging links via socialExtractor
    const socials = socialExtractor.extractSocials(html);
    if (socials.instagram && !result.socials.instagram) result.socials.instagram = socials.instagram;
    if (socials.twitter && !result.socials.twitter) result.socials.twitter = socials.twitter;
    if (socials.linkedin && !result.socials.linkedin) result.socials.linkedin = socials.linkedin;
    if (socials.discord && !result.socials.discord) result.socials.discord = socials.discord;
    if (socials.tiktok && !result.socials.tiktok) result.socials.tiktok = socials.tiktok;
    if (socials.linktree && !result.socials.linktree) result.socials.linktree = socials.linktree;
    if (socials.beacons && !result.socials.beacons) result.socials.beacons = socials.beacons;
    if (socials.whatsapp && !result.whatsapp) result.whatsapp = socials.whatsapp;
    if (socials.phone && !result.phones.includes(socials.phone)) {
      result.phones.push(socials.phone);
    }

    for (const item of socials.items) {
      addItem(item.type, item.value, item.normalizedValue);
    }

    // 5. JSON-LD / Schema.org extraction
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const raw = match[1]?.trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          this.parseJsonLd(parsed, emailSet, phoneSet, result, addItem);
        }
      } catch {
        // Non-fatal if JSON-LD is malformed
      }
    }

    // 6. Microdata / Semantic HTML attributes (itemprop="email", itemprop="telephone")
    const microdataEmails = html.matchAll(/itemprop=["']email["'][^>]*>(?:mailto:)?([^<]+)/gi);
    for (const match of microdataEmails) {
      const email = match[1]?.replace(/^mailto:/i, '').trim().toLowerCase();
      if (email && email.includes('@') && !emailSet.has(email)) {
        emailSet.add(email);
        result.emails.push(email);
        addItem('EMAIL', email, email);
      }
    }

    const microdataTels = html.matchAll(/itemprop=["']telephone["'][^>]*>(?:tel:)?([^<]+)/gi);
    for (const match of microdataTels) {
      const raw = match[1]?.trim();
      if (raw) {
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15 && !phoneSet.has(raw)) {
          phoneSet.add(raw);
          result.phones.push(raw);
          addItem('PHONE', raw, digits);
        }
      }
    }
  }

  private parseJsonLd(
    obj: any,
    emailSet: Set<string>,
    phoneSet: Set<string>,
    result: ScrapedContacts,
    addItem: (type: ContactItemType, value: string, normalized: string) => void,
    depth = 0
  ): void {
    if (!obj || depth > 6) return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.parseJsonLd(item, emailSet, phoneSet, result, addItem, depth + 1);
      }
      return;
    }

    if (typeof obj === 'object') {
      // ContactPoint support (e.g. sales, customer service, business inquiries)
      if (obj['@type'] === 'ContactPoint' || obj.contactPoint) {
        const cp = obj.contactPoint || obj;
        const points = Array.isArray(cp) ? cp : [cp];
        for (const p of points) {
          if (p && typeof p === 'object') {
            if (typeof p.email === 'string' && p.email.includes('@')) {
              const clean = p.email.replace(/^mailto:/i, '').trim().toLowerCase();
              if (!emailSet.has(clean)) {
                emailSet.add(clean);
                result.emails.push(clean);
                addItem('EMAIL', clean, clean);
              }
            }
            if (typeof p.telephone === 'string') {
              const raw = p.telephone.trim();
              const digits = raw.replace(/\D/g, '');
              if (digits.length >= 7 && digits.length <= 15 && !phoneSet.has(raw)) {
                phoneSet.add(raw);
                result.phones.push(raw);
                addItem('PHONE', raw, digits);
              }
            }
          }
        }
      }

      if (typeof obj.email === 'string' && obj.email.includes('@')) {
        const clean = obj.email.replace(/^mailto:/i, '').trim().toLowerCase();
        if (!emailSet.has(clean)) {
          emailSet.add(clean);
          result.emails.push(clean);
          addItem('EMAIL', clean, clean);
        }
      }

      if (typeof obj.telephone === 'string') {
        const raw = obj.telephone.trim();
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15 && !phoneSet.has(raw)) {
          phoneSet.add(raw);
          result.phones.push(raw);
          addItem('PHONE', raw, digits);
        }
      }

      if (typeof obj.sameAs === 'string' || Array.isArray(obj.sameAs)) {
        const urls = Array.isArray(obj.sameAs) ? obj.sameAs : [obj.sameAs];
        for (const u of urls) {
          if (typeof u === 'string' && u.startsWith('http')) {
            const extracted = socialExtractor.extractSocials(u);
            for (const item of extracted.items) {
              addItem(item.type, item.value, item.normalizedValue);
            }
          }
        }
      }

      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.parseJsonLd(obj[key], emailSet, phoneSet, result, addItem, depth + 1);
        }
      }
    }
  }
}

export const websiteScraper = new WebsiteScraper();
