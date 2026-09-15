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

    // 1. Linktree
    const linktreeMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linktr\.ee\/([a-zA-Z0-9._-]+)/i);
    if (linktreeMatch) {
      const url = this.cleanUrl(linktreeMatch[0].startsWith('http') ? linktreeMatch[0] : `https://${linktreeMatch[0]}`);
      socials.linktree = url;
      addItem('LINKTREE', url, url);
    }

    // 2. Beacons
    const beaconsMatch = text.match(/(?:https?:\/\/)?(?:www\.)?beacons\.ai\/([a-zA-Z0-9._-]+)/i);
    if (beaconsMatch) {
      const url = this.cleanUrl(beaconsMatch[0].startsWith('http') ? beaconsMatch[0] : `https://${beaconsMatch[0]}`);
      socials.beacons = url;
      addItem('BEACONS', url, url);
    }

    // 3. Instagram
    const igMatch = text.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i) ||
                    text.match(/(?:insta|ig|instagram):\s*@?([a-zA-Z0-9._]+)/i);
    if (igMatch && igMatch[1] && !['p', 'reel', 'explore', 'stories'].includes(igMatch[1].toLowerCase())) {
      const handle = igMatch[1].replace('@', '');
      socials.instagram = handle;
      addItem('INSTAGRAM', `https://instagram.com/${handle}`, handle);
    }

    // 4. Twitter / X
    const twitterMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i) ||
                         text.match(/(?:twitter|x):\s*@?([a-zA-Z0-9_]+)/i);
    if (twitterMatch && twitterMatch[1] && !['home', 'explore', 'notifications', 'messages'].includes(twitterMatch[1].toLowerCase())) {
      const handle = twitterMatch[1].replace('@', '');
      socials.twitter = handle;
      addItem('TWITTER_X', `https://x.com/${handle}`, handle);
    }

    // 5. TikTok
    const tiktokMatch = text.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)/i) ||
                        text.match(/(?:tiktok):\s*@?([a-zA-Z0-9._]+)/i);
    if (tiktokMatch && tiktokMatch[1]) {
      const handle = tiktokMatch[1].replace('@', '');
      socials.tiktok = handle;
      addItem('TIKTOK', `https://tiktok.com/@${handle}`, handle);
    }

    // 6. Discord
    const discordMatch = text.match(/(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/([a-zA-Z0-9-]+)/i);
    if (discordMatch && discordMatch[0]) {
      const url = this.cleanUrl(discordMatch[0].startsWith('http') ? discordMatch[0] : `https://${discordMatch[0]}`);
      socials.discord = url;
      addItem('DISCORD', url, url);
    }

    // 7. LinkedIn
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-_]+)/i);
    if (linkedinMatch && linkedinMatch[0]) {
      const url = this.cleanUrl(linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`);
      socials.linkedin = url;
      addItem('LINKEDIN', url, url);
    }

    // 8. Website (standalone link that is not YouTube, Google, or major social networks)
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

    for (let rawUrl of urlMatches) {
      const url = this.cleanUrl(rawUrl);
      const lower = url.toLowerCase();
      const isExcluded = excludedDomains.some((domain) => lower.includes(domain));
      if (!isExcluded) {
        if (!socials.website) {
          socials.website = url;
        }
        addItem('WEBSITE', url, url);
        break;
      }
    }

    socials.items = items;
    return socials;
  }
}

export const socialExtractor = new SocialExtractor();
