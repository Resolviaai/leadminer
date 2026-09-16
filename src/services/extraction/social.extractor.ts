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
    while (url.endsWith('.') || url.endsWith(',') || url.endsWith(';') || url.endsWith(')') || url.endsWith(']') || url.endsWith('>')) {
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

    // 1. Linktree (Global extraction)
    const linktreeMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?linktr\.ee\/([a-zA-Z0-9._-]+)/gi);
    for (const match of linktreeMatches) {
      const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
      if (!socials.linktree) socials.linktree = url;
      addItem('LINKTREE', url, url);
    }

    // 2. Beacons (Global extraction)
    const beaconsMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?beacons\.ai\/([a-zA-Z0-9._-]+)/gi);
    for (const match of beaconsMatches) {
      const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
      if (!socials.beacons) socials.beacons = url;
      addItem('BEACONS', url, url);
    }

    // 3. Instagram (Global extraction: URL and shorthand)
    const igUrlMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/gi);
    const igShortMatches = text.matchAll(/(?:insta|ig|instagram):\s*@?([a-zA-Z0-9._]+)/gi);
    const igExcluded = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'tv', 'direct', 'http', 'https', 'www']);

    for (const match of [...igUrlMatches, ...igShortMatches]) {
      if (match && match[1]) {
        const handle = match[1].replace('@', '').trim();
        if (handle && !igExcluded.has(handle.toLowerCase())) {
          if (!socials.instagram) socials.instagram = handle;
          addItem('INSTAGRAM', `https://instagram.com/${handle}`, handle);
        }
      }
    }

    // 4. Twitter / X (Global extraction: URL and shorthand)
    const twitterUrlMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi);
    const twitterShortMatches = text.matchAll(/(?:twitter|x):\s*@?([a-zA-Z0-9_]+)/gi);
    const twitterExcluded = new Set(['home', 'explore', 'notifications', 'messages', 'i', 'intent', 'share', 'http', 'https', 'www']);

    for (const match of [...twitterUrlMatches, ...twitterShortMatches]) {
      if (match && match[1]) {
        const handle = match[1].replace('@', '').trim();
        if (handle && !twitterExcluded.has(handle.toLowerCase())) {
          if (!socials.twitter) socials.twitter = handle;
          addItem('TWITTER_X', `https://x.com/${handle}`, handle);
        }
      }
    }

    // 5. TikTok (Global extraction: URL and shorthand)
    const tiktokUrlMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)/gi);
    const tiktokShortMatches = text.matchAll(/(?:tiktok):\s*@?([a-zA-Z0-9._]+)/gi);
    const tiktokExcluded = new Set(['tag', 'discover', 'explore', 'share', 'http', 'https', 'www']);

    for (const match of [...tiktokUrlMatches, ...tiktokShortMatches]) {
      if (match && match[1]) {
        const handle = match[1].replace('@', '').trim();
        if (handle && !tiktokExcluded.has(handle.toLowerCase())) {
          if (!socials.tiktok) socials.tiktok = handle;
          addItem('TIKTOK', `https://tiktok.com/@${handle}`, handle);
        }
      }
    }

    // 6. Discord (Global extraction)
    const discordMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/([a-zA-Z0-9-]+)/gi);
    for (const match of discordMatches) {
      if (match && match[0]) {
        const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
        if (!socials.discord) socials.discord = url;
        addItem('DISCORD', url, url);
      }
    }

    // 7. LinkedIn (Global extraction)
    const linkedinMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-_]+)/gi);
    for (const match of linkedinMatches) {
      if (match && match[0]) {
        const url = this.cleanUrl(match[0].startsWith('http') ? match[0] : `https://${match[0]}`);
        if (!socials.linkedin) socials.linkedin = url;
        addItem('LINKEDIN', url, url);
      }
    }

    // 8. Website (Global extraction without premature break)
    const urlMatches = text.match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
    const excludedDomains = [
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
    ];

    for (const rawUrl of urlMatches) {
      const url = this.cleanUrl(rawUrl);
      const lower = url.toLowerCase();
      const isExcluded = excludedDomains.some((domain) => lower.includes(domain));
      if (!isExcluded) {
        if (!socials.website) {
          socials.website = url;
        }
        // Capture ALL valid websites into items without early break
        addItem('WEBSITE', url, url);
      }
    }

    // 9. WhatsApp (URL and text patterns)
    const whatsappUrlMatches = text.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/([0-9+]+)/gi);
    const whatsappTextMatches = text.matchAll(/(?:whatsapp|wa):\s*([+0-9\s().-]{7,25})/gi);
    for (const match of [...whatsappUrlMatches, ...whatsappTextMatches]) {
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

    // 10. Phone numbers
    // A. Labeled phone numbers: "phone: ...", "call us: ...", "tel: ..."
    const phoneLabeledMatches = text.matchAll(/(?:phone|tel|call(?:\s+us)?|cell|mobile|contact)(?:\s*(?:is|at))?:\s*([+0-9\s().-]{7,25})/gi);
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

    // B. Standard phone formats in text
    const phoneStandardMatches = text.matchAll(/\b(?:\+?1[-.\s]?)?\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g);
    for (const match of phoneStandardMatches) {
      const raw = match[0].trim();
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 15) {
        if (!socials.phone) socials.phone = raw;
        addItem('PHONE', raw, digits);
      }
    }

    socials.items = items;
    return socials;
  }
}

export const socialExtractor = new SocialExtractor();
