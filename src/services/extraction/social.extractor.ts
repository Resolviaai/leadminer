export interface ExtractedSocials {
  website?: string;
  instagram?: string;
  twitter?: string;
  discord?: string;
  tiktok?: string;
  linkedin?: string;
  otherSocial?: Record<string, string>;
}

export class SocialExtractor {
  public extractSocials(text: string): ExtractedSocials {
    if (!text || typeof text !== 'string') {
      return {};
    }

    const socials: ExtractedSocials = {};

    // 1. Instagram: instagram.com/handle or @handle after "insta" or "ig"
    const igMatch = text.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i) ||
                    text.match(/(?:insta|ig|instagram):\s*@?([a-zA-Z0-9._]+)/i);
    if (igMatch && igMatch[1] && !['p', 'reel', 'explore', 'stories'].includes(igMatch[1].toLowerCase())) {
      socials.instagram = igMatch[1].replace('@', '');
    }

    // 2. Twitter / X: twitter.com/handle or x.com/handle
    const twitterMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i) ||
                         text.match(/(?:twitter|x):\s*@?([a-zA-Z0-9_]+)/i);
    if (twitterMatch && twitterMatch[1] && !['home', 'explore', 'notifications', 'messages'].includes(twitterMatch[1].toLowerCase())) {
      socials.twitter = twitterMatch[1].replace('@', '');
    }

    // 3. TikTok: tiktok.com/@handle
    const tiktokMatch = text.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)/i) ||
                        text.match(/(?:tiktok):\s*@?([a-zA-Z0-9._]+)/i);
    if (tiktokMatch && tiktokMatch[1]) {
      socials.tiktok = tiktokMatch[1].replace('@', '');
    }

    // 4. Discord: discord.gg/code or discord.com/invite/code
    const discordMatch = text.match(/(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/([a-zA-Z0-9-]+)/i);
    if (discordMatch && discordMatch[0]) {
      socials.discord = discordMatch[0];
    }

    // 5. LinkedIn: linkedin.com/in/handle or linkedin.com/company/name
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-_]+)/i);
    if (linkedinMatch && linkedinMatch[0]) {
      socials.linkedin = linkedinMatch[0];
    }

    // 6. Website (standalone link that is not YouTube, Google, or major social networks)
    const urlMatches = text.match(/https?:\/\/[^\s<>"')]+/gi) || [];
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
    ];

    for (let url of urlMatches) {
      const lower = url.toLowerCase();
      const isExcluded = excludedDomains.some((domain) => lower.includes(domain));
      if (!isExcluded) {
        socials.website = url;
        break;
      }
    }

    return socials;
  }
}

export const socialExtractor = new SocialExtractor();
