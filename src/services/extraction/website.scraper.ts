import { emailExtractor } from './email.extractor';
import { socialExtractor, ExtractedContactItem, ContactItemType } from './social.extractor';

export interface ScrapedContacts {
  url: string;
  contactPageUrl?: string;
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

  private async fetchHtml(url: string, maxBytes = 102400): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
        return null;
      }

      const text = await response.text();
      return text.slice(0, maxBytes);
    } catch (err) {
      // Gracefully return null on timeout, network error, SSL failure
      return null;
    }
  }

  private findContactSubpageUrls(html: string, baseUrl: string): string[] {
    const contactKeywords = /(contact|about|touch|reach|team|connect)/i;
    const subpages: string[] = [];
    const seen = new Set<string>();

    try {
      const baseObj = new URL(baseUrl);
      // Scan hrefs
      const linkMatches = html.matchAll(/href=["']([^"']+)["']/gi);
      for (const match of linkMatches) {
        const href = match[1]?.trim();
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          continue;
        }

        if (contactKeywords.test(href)) {
          try {
            const resolved = new URL(href, baseUrl);
            // Only follow links on the same origin/domain
            if (resolved.origin === baseObj.origin && !seen.has(resolved.href)) {
              seen.add(resolved.href);
              subpages.push(resolved.href);
            }
          } catch {
            // invalid URL ignored
          }
        }
      }
    } catch {
      // Ignore baseUrl parse failures
    }

    return subpages;
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

    // 1. Fetch homepage / main target
    const homepageHtml = await this.fetchHtml(normalized);
    if (!homepageHtml) return result;

    this.extractFromHtml(homepageHtml, normalized, result);

    // 2. If no emails found on homepage, attempt contact subpages (e.g. /contact, /about)
    if (result.emails.length === 0) {
      const subpages = this.findContactSubpageUrls(homepageHtml, normalized);
      if (subpages.length > 0) {
        // Fetch the best subpage (prefer /contact)
        const bestSubpage =
          subpages.find((u) => /contact/i.test(u)) || subpages.find((u) => /about/i.test(u)) || subpages[0];

        if (bestSubpage) {
          result.contactPageUrl = bestSubpage;
          const subpageHtml = await this.fetchHtml(bestSubpage);
          if (subpageHtml) {
            this.extractFromHtml(subpageHtml, bestSubpage, result, 'contact_page');
          }
        }
      }
    }

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
  }
}

export const websiteScraper = new WebsiteScraper();
