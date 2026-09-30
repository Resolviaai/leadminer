export type ContactItemType =
  | 'EMAIL'
  | 'WEBSITE'
  | 'INSTAGRAM'
  | 'TWITTER_X'
  | 'TIKTOK'
  | 'DISCORD'
  | 'LINKEDIN'
  | 'LINKTREE'
  | 'BEACONS'
  | 'PHONE'
  | 'WHATSAPP'
  | 'OTHER';

export interface ExtractedContactItem {
  type: ContactItemType;
  value: string;
  normalizedValue: string;
  source: string;
}

export interface ExtractedSocials {
  website?: string;
  instagram?: string;
  twitter?: string;
  discord?: string;
  tiktok?: string;
  linkedin?: string;
  linktree?: string;
  beacons?: string;
  phone?: string;
  whatsapp?: string;
  otherSocial?: Record<string, string>;
  items: ExtractedContactItem[];
}

export class SocialExtractor {
  private cleanUrl(raw: string): string {
    let url = raw.trim();
    while (
      url.endsWith('.') ||
      url.endsWith(',') ||
      url.endsWith(';') ||
      url.endsWith(':') ||
      url.endsWith(')') ||
      url.endsWith(']') ||
      url.endsWith('>') ||
      url.endsWith('"') ||
      url.endsWith("'")
    ) {
      url = url.slice(0, -1);
    }
    return url;
  }

  public extractSocials(text: string): ExtractedSocials {
    if (!text || typeof text !== 'string') {
      return { items: [] };
    }

    const socials: ExtractedSocials = { items: [] };
    const items: ExtractedContactItem[] = [];
    const seenValues = new Set<string>();

    const addItem = (type: ContactItemType, value: string, normalized: string, source = 'description') => {
      const key = `${type}:${normalized.toLowerCase()}`;
      if (!seenValues.has(key)) {
        seenValues.add(key);
        items.push({ type, value, normalizedValue: normalized.toLowerCase(), source });
      }
    };

    // 1. Explicit mailto: extraction into items
    const mailtoMatches = text.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
    for (const match of mailtoMatches) {
      if (match && match[1]) {
        const email = match[1].toLowerCase().trim();
        addItem('EMAIL', email, email, 'mailto');
      }
    }

    // 2. Explicit tel: links
    const telMatches = text.matchAll(/tel:([+0-9\s().-]{7,25})/gi);
    for (const match of telMatches) {
      if (match && match[1]) {
        const raw = match[1].trim();
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          const formatted = raw.startsWith('+') ? `+${digits}` : digits;
          if (!socials.phone) socials.phone = formatted;
          addItem('PHONE', raw, formatted, 'tel');
        }
      }
    }

    // 3. Linktree (Global extraction)
    const linktreeMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?linktr\.ee\/([a-zA-Z0-9._-]+)/gi);
    for (const match of linktreeMatches) {
      const handle = match[1]?.trim();
      if (handle) {
        const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
        if (!socials.linktree) socials.linktree = url;
        addItem('LINKTREE', url, url);
      }
    }

    // 4. Beacons (Global extraction)
    const beaconsMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?beacons\.ai\/([a-zA-Z0-9._-]+)/gi);
    for (const match of beaconsMatches) {
      const handle = match[1]?.trim();
      if (handle) {
        const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
        if (!socials.beacons) socials.beacons = url;
        addItem('BEACONS', url, url);
      }
    }

    // 5. Instagram (Global extraction: URL and shorthand)
    const igUrlMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/gi);
    const igShortMatches = text.matchAll(/(?:insta|ig|instagram):\s*@?([a-zA-Z0-9._]+)/gi);
    const igExcluded = new Set([
      'p',
      'reel',
      'reels',
      'explore',
      'stories',
      'tv',
      'direct',
      'http',
      'https',
      'www',
      'about',
      'developer',
      'legal',
      'privacy',
    ]);

    for (const match of [...igUrlMatches, ...igShortMatches]) {
      if (match && match[1]) {
        const handle = match[1].replace('@', '').trim();
        if (handle && !igExcluded.has(handle.toLowerCase())) {
          if (!socials.instagram) socials.instagram = handle;
          addItem('INSTAGRAM', `https://instagram.com/${handle}`, handle);
        }
      }
    }

    // 6. Twitter / X (Global extraction: URL and shorthand)
    const twitterUrlMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi);
    const twitterShortMatches = text.matchAll(/(?:twitter|x):\s*@?([a-zA-Z0-9_]+)/gi);
    const twitterExcluded = new Set([
      'home',
      'explore',
      'notifications',
      'messages',
      'i',
      'intent',
      'share',
      'http',
      'https',
      'www',
      'tos',
      'privacy',
      'about',
    ]);

    for (const match of [...twitterUrlMatches, ...twitterShortMatches]) {
      if (match && match[1]) {
        const handle = match[1].replace('@', '').trim();
        if (handle && !twitterExcluded.has(handle.toLowerCase())) {
          if (!socials.twitter) socials.twitter = handle;
          addItem('TWITTER_X', `https://x.com/${handle}`, handle);
        }
      }
    }

    // 7. TikTok (Global extraction: URL and shorthand)
    const tiktokUrlMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)/gi);
    const tiktokShortMatches = text.matchAll(/(?:tiktok):\s*@?([a-zA-Z0-9._]+)/gi);
    const tiktokExcluded = new Set([
      'tag',
      'discover',
      'explore',
      'share',
      'http',
      'https',
      'www',
      'legal',
      'privacy',
      'foryou',
    ]);

    for (const match of [...tiktokUrlMatches, ...tiktokShortMatches]) {
      if (match && match[1]) {
        const handle = match[1].replace('@', '').trim();
        if (handle && !tiktokExcluded.has(handle.toLowerCase())) {
          if (!socials.tiktok) socials.tiktok = handle;
          addItem('TIKTOK', `https://tiktok.com/@${handle}`, handle);
        }
      }
    }

    // 8. Discord (Global extraction)
    const discordMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/([a-zA-Z0-9-]+)/gi);
    for (const match of discordMatches) {
      if (match && match[0]) {
        const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
        if (!socials.discord) socials.discord = url;
        addItem('DISCORD', url, url);
      }
    }

    // 9. LinkedIn (Global extraction)
    const linkedinMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-_]+)/gi);
    for (const match of linkedinMatches) {
      if (match && match[0]) {
        const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
        if (!socials.linkedin) socials.linkedin = url;
        addItem('LINKEDIN', url, url);
      }
    }

    // 10. WhatsApp: URLs and text patterns
    // A. wa.me URLs: https://wa.me/1234567890 or wa.me/+1234567890
    const waMeMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?wa\.me\/(?:\+?([0-9]{7,15}))/gi);
    for (const match of waMeMatches) {
      if (match && match[1]) {
        const digits = match[1].replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          const formatted = `+${digits}`;
          if (!socials.whatsapp) socials.whatsapp = formatted;
          addItem('WHATSAPP', `https://wa.me/${digits}`, formatted);
        }
      }
    }

    // B. api.whatsapp.com and web.whatsapp.com with ?phone= parameter
    const waApiMatches = text.matchAll(/(?:https?:\/\/)?(?:api|web)\.whatsapp\.com\/send\/?\?[^\s<>"')\]]+/gi);
    for (const match of waApiMatches) {
      try {
        const fullUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        const parsed = new URL(fullUrl);
        const phoneParam = parsed.searchParams.get('phone');
        if (phoneParam) {
          const digits = phoneParam.replace(/\D/g, '');
          if (digits.length >= 7 && digits.length <= 15) {
            const formatted = `+${digits}`;
            if (!socials.whatsapp) socials.whatsapp = formatted;
            addItem('WHATSAPP', `https://wa.me/${digits}`, formatted);
          }
        }
      } catch {
        // Ignore invalid URL
      }
    }

    // C. WhatsApp shorthand text: "whatsapp: +1234567890" or "wa: +1 234 567 8900"
    const whatsappTextMatches = text.matchAll(/(?:whatsapp|wa):\s*([+0-9\s().-]{7,25})/gi);
    for (const match of whatsappTextMatches) {
      if (match && match[1]) {
        const raw = match[1].trim();
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          const formatted = `+${digits}`;
          if (!socials.whatsapp) socials.whatsapp = formatted;
          addItem('WHATSAPP', `https://wa.me/${digits}`, formatted);
        }
      }
    }

    // 11. Phone numbers
    // A. Labeled phone numbers: "phone: ...", "call us: ...", "tel: ..."
    const phoneLabeledMatches = text.matchAll(
      /(?:phone|tel|call(?:\s+us)?|cell|mobile|contact)(?:\s*(?:is|at))?:\s*([+0-9\s().-]{7,25})/gi
    );
    for (const match of phoneLabeledMatches) {
      if (match && match[1]) {
        const raw = match[1].trim();
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          if (!socials.phone) socials.phone = raw;
          addItem('PHONE', raw, digits);
        }
      }
    }

    // B. Standard phone formats in text (North American / E.164 patterns)
    const phoneStandardMatches = text.matchAll(
      /\b(?:\+?1[-.\s]?)?\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g
    );
    for (const match of phoneStandardMatches) {
      const raw = match[0].trim();
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 15) {
        if (!socials.phone) socials.phone = raw;
        addItem('PHONE', raw, digits);
      }
    }

    // 12. Websites: Global extraction with hostname-based exclusion (prevents substring false matches)
    const urlMatches = text.match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
    const excludedHosts = [
      'youtube.com',
      'youtu.be',
      'google.com',
      'instagram.com',
      'twitter.com',
      'x.com',
      'tiktok.com',
      'discord.gg',
      'discord.com',
      'linkedin.com',
      'facebook.com',
      'bit.ly',
      'linktr.ee',
      'beacons.ai',
      'wa.me',
      'whatsapp.com',
      't.me',
      'telegram.me',
    ];

    for (const rawUrl of urlMatches) {
      const url = this.cleanUrl(rawUrl);
      let hostname = '';
      try {
        const parsed = new URL(url);
        hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
      } catch {
        continue;
      }

      // Check if hostname strictly matches or is a subdomain of an excluded service
      const isExcluded = excludedHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
      if (!isExcluded) {
        if (!socials.website) {
          socials.website = url;
        }
        addItem('WEBSITE', url, url);
      }
    }

    socials.items = items;
    return socials;
  }
}

export const socialExtractor = new SocialExtractor();
