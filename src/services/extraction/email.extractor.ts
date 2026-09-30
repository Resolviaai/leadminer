export type ExtractedEmailSource =
  | 'description'
  | 'custom_url'
  | 'links'
  | 'video_description'
  | 'link_page'
  | 'mailto'
  | 'html'
  | 'json_ld'
  | 'contact_page'
  | 'footer'
  | 'bio';

export type EmailRole =
  | 'BUSINESS'
  | 'MANAGEMENT'
  | 'DIRECT'
  | 'SALES'
  | 'PRESS'
  | 'SUPPORT'
  | 'LEGAL'
  | 'CAREERS'
  | 'GENERIC';

export type EmailCategory = 'CREATOR_DIRECT' | 'BUSINESS_INQUIRIES' | 'MANAGEMENT' | 'GENERIC_SUPPORT';

export interface ExtractedEmail {
  email: string;
  source: ExtractedEmailSource;
  role: EmailRole;
  priorityScore: number;
  category?: EmailCategory; // Backward compatibility
  confidence: number;
  contextSnippet?: string;
  possibleDomainTypo?: boolean;
}

// Backward-compatible categorizer
export function categorizeEmail(email: string): EmailCategory {
  const localPart = email.split('@')[0]?.toLowerCase() || '';
  if (/^(business|booking|bookings|inquiries|inquiry|sponsor|sponsors|partnerships|collab|collabs|contact)/i.test(localPart)) {
    return 'BUSINESS_INQUIRIES';
  }
  if (/^(management|mgmt|manager|agent|agency|talent|press|media)/i.test(localPart)) {
    return 'MANAGEMENT';
  }
  if (/^(support|help|info|admin|billing|team|office|hello|hi)/i.test(localPart)) {
    return 'GENERIC_SUPPORT';
  }
  return 'CREATOR_DIRECT';
}

/**
 * Score-based Email Role Classifier
 * Assigns an outreach priority score (0-100) based on mailbox intent.
 */
export function classifyEmailRole(email: string, contextSnippet?: string): { role: EmailRole; priorityScore: number } {
  const localPart = email.split('@')[0]?.toLowerCase() || '';
  const context = (contextSnippet || '').toLowerCase();

  // If surrounding context explicitly mentions commercial terms, boost to BUSINESS
  if (
    context.includes('business inquiry') ||
    context.includes('business inquiries') ||
    context.includes('business collab') ||
    context.includes('business') ||
    context.includes('sponsorship') ||
    context.includes('partnerships') ||
    context.includes('brand deals') ||
    context.includes('collab') ||
    context.includes('booking')
  ) {
    if (/^(support|billing|help)/i.test(localPart)) {
      return { role: 'SUPPORT', priorityScore: 10 };
    }
    if (/^(management|mgmt|manager|agent|agency)/i.test(localPart)) {
      return { role: 'MANAGEMENT', priorityScore: 95 };
    }
    return { role: 'BUSINESS', priorityScore: 100 };
  }

  if (/^(business|booking|bookings|inquiries|inquiry|sponsor|sponsors|partnerships|partnership|collab|collabs|colab|colabs|brand|commercial)/i.test(localPart)) {
    return { role: 'BUSINESS', priorityScore: 100 };
  }
  if (/^(management|mgmt|manager|agent|agency|talent|rep|representative)/i.test(localPart)) {
    return { role: 'MANAGEMENT', priorityScore: 95 };
  }
  if (/^(sales|deals)/i.test(localPart)) {
    return { role: 'SALES', priorityScore: 70 };
  }
  if (/^(info|hello|hi|contact|team|office|admin|mail)/i.test(localPart)) {
    return { role: 'GENERIC', priorityScore: 50 };
  }
  if (/^(press|media|pr)/i.test(localPart)) {
    return { role: 'PRESS', priorityScore: 30 };
  }
  if (/^(support|help|billing)/i.test(localPart)) {
    return { role: 'SUPPORT', priorityScore: 10 };
  }
  if (/^(legal|privacy|security|compliance)/i.test(localPart)) {
    return { role: 'LEGAL', priorityScore: 0 };
  }
  if (/^(jobs|careers|hr|recruiting|intern|internship)/i.test(localPart)) {
    return { role: 'CAREERS', priorityScore: 0 };
  }

  // Default: Direct creator personal inbox
  return { role: 'DIRECT', priorityScore: 75 };
}

// Disallow obvious mock/sample and platform corporate domains
const BLOCKED_DOMAINS = new Set([
  'example.com',
  'sample.com',
  'domain.com',
  'email.com',
  'test.com',
  'emailaddress.com',
  'whatever.com',
  'yourdomain.com',
  'yoursite.com',
  'company.com',
  'mycompany.com',
  'example.org',
  'example.net',
  'test.org',
  'test.net',
  'invalid',
  'localhost',
  'youtube.com',
  'google.com',
  'googlemail.com',
  'patreon.com',
  'spotify.com',
  'linktr.ee',
  'beacons.ai',
  'sentry.io',
  'wixpress.com',
]);

// Strictly non-human automated system addresses (never outreach-eligible)
const SYSTEM_DISCARD_PREFIXES = new Set([
  'noreply',
  'no-reply',
  'donotreply',
  'do-not-reply',
  'postmaster',
  'mailer-daemon',
  'daemon',
  'bounce',
  'abuse',
]);

const FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.pdf'];

const KNOWN_TYPO_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'outlok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
};

export class EmailExtractor {
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  public classifyEmailRole(email: string, contextSnippet?: string): { role: EmailRole; priorityScore: number } {
    return classifyEmailRole(email, contextSnippet);
  }

  public categorizeEmail(email: string): EmailCategory {
    return categorizeEmail(email);
  }

  /**
   * Pre-Normalizer:
   * Strips zero-width characters, decodes HTML entities, Unicode symbols, and bracketed obfuscations.
   */
  public normalizeRawText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    // 1. Strip zero-width and invisible characters
    let t = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

    // 2. Decode common HTML entities
    t = t
      .replace(/&#64;|&#x40;|&commat;/gi, '@')
      .replace(/&#46;|&#x2e;/gi, '.')
      .replace(/&amp;/gi, '&');

    // 3. Normalize Unicode fullwidth @ and dot
    t = t.replace(/＠/g, '@').replace(/．/g, '.');

    // 4. Bracketed and spaced de-obfuscation: [dot], (dot), {dot}
    t = t.replace(/(?:\[|\(|\{)\s*(?:dot|\.)\s*(?:\]|\)|\})/gi, '.');
    // Bracketed [at], (at), {at}, [@]
    t = t.replace(/(?:\[|\(|\{)\s*(?:at|@)\s*(?:\]|\)|\})/gi, '@');

    // 5. Spaced English AT and DOT: "john AT company DOT com"
    t = t.replace(
      /\b([a-zA-Z0-9._%+-]+)\s+(?:AT|at)\s+([a-zA-Z0-9.-]+)\s+(?:DOT|dot)\s+([a-zA-Z]{2,})\b/gi,
      (_match, user, domain, tld) => `${user}@${domain}.${tld}`
    );

    // 6. Collapse spaced email representations (e.g. "alex @ domain . com" or "alex@ domain.com")
    t = t.replace(
      /\b([a-zA-Z0-9._%+-]+)\s+@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,10})\b/gi,
      (_match, user, domain, tld) => `${user}@${domain.replace(/\s+/g, '')}.${tld}`
    );
    t = t.replace(
      /\b([a-zA-Z0-9._%+-]+)@\s+([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,10})\b/gi,
      (_match, user, domain, tld) => `${user}@${domain.replace(/\s+/g, '')}.${tld}`
    );

    // 7. Slashes or dashes as separators (e.g. "alex / at / domain.com" or "alex - at - domain.com")
    t = t.replace(
      /\b([a-zA-Z0-9._%+-]+)\s*[\/\-]\s*(?:at|@)\s*[\/\-]\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi,
      (_match, user, domain) => `${user}@${domain}`
    );

    // 8. Missing TLD on known email provider keywords (e.g. "collabs [at] gmail" or "collabs (at) yahoo")
    t = t.replace(
      /\b([a-zA-Z0-9._%+-]+)\s*(?:@|\[at\]|\(at\)|\s+at\s+)\s*(gmail|yahoo|hotmail|outlook|icloud|protonmail)\b(?!\.[a-zA-Z]{2,})/gi,
      (_match, user, provider) => `${user}@${provider}.com`
    );

    return t;
  }

  /**
   * Structural Email Validator
   * Validates local part and domain against DNS and RFC rules without discarding aliases.
   */
  private isValidEmailStructure(email: string): boolean {
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;

    // Local part constraints: 1-64 chars, no consecutive dots, no leading/trailing dot
    if (localPart.length === 0 || localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;

    // Reject automated system prefixes
    if (
      SYSTEM_DISCARD_PREFIXES.has(localPart) ||
      localPart.startsWith('api-') ||
      localPart.startsWith('noreply')
    ) {
      return false;
    }

    // Domain constraints: 1-255 chars, no consecutive dots, no leading/trailing dot
    if (domain.length === 0 || domain.length > 255) return false;
    if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;

    const labels = domain.split('.');
    if (labels.length < 2) return false;

    for (const label of labels) {
      if (label.length === 0 || label.length > 63) return false;
      if (label.startsWith('-') || label.endsWith('-')) return false;
      if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
    }

    const tld = labels[labels.length - 1];
    if (!/^[a-zA-Z]{2,10}$/.test(tld)) return false;

    return true;
  }

  /**
   * Extract all email opportunities with confidence scoring and role classification.
   */
  public extractEmails(text: string, source: ExtractedEmailSource = 'description'): ExtractedEmail[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const results: ExtractedEmail[] = [];
    const seenEmails = new Set<string>();

    // 1. Explicit mailto: extraction from HTML
    const mailtoMatches = text.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
    for (const match of mailtoMatches) {
      const email = match[1].toLowerCase().trim();
      if (!seenEmails.has(email) && this.isValidEmailStructure(email)) {
        seenEmails.add(email);
        const { role, priorityScore } = classifyEmailRole(email);
        results.push({
          email,
          source: 'mailto',
          role,
          priorityScore,
          category: categorizeEmail(email),
          confidence: 0.98,
        });
      }
    }

    // 2. Pre-process text to remove zero-width, decode entities, and de-obfuscate
    const normalized = this.normalizeRawText(text);
    const matches = normalized.match(this.emailRegex) || [];

    for (const raw of matches) {
      let cleaned = raw.toLowerCase().trim();

      // Clean trailing punctuation
      while (
        cleaned.endsWith('.') ||
        cleaned.endsWith(',') ||
        cleaned.endsWith(';') ||
        cleaned.endsWith(':') ||
        cleaned.endsWith(')') ||
        cleaned.endsWith(']') ||
        cleaned.endsWith('>')
      ) {
        cleaned = cleaned.slice(0, -1);
      }

      if (seenEmails.has(cleaned)) continue;

      // Reject file extensions (e.g. image@2x.png)
      if (FILE_EXTENSIONS.some((ext) => cleaned.endsWith(ext))) {
        continue;
      }

      // Structural validation
      if (!this.isValidEmailStructure(cleaned)) {
        continue;
      }

      const domain = cleaned.split('@')[1];

      // Check blocked mock domains
      if (BLOCKED_DOMAINS.has(domain)) {
        continue;
      }

      // Check domain typo flag (e.g. gmial.com)
      const possibleDomainTypo = Boolean(KNOWN_TYPO_DOMAINS[domain]);

      // Extract 150-char surrounding context window for provenance and scoring
      let contextSnippet: string | undefined;
      const idx = normalized.indexOf(cleaned);
      if (idx !== -1) {
        const start = Math.max(0, idx - 75);
        const end = Math.min(normalized.length, idx + cleaned.length + 75);
        contextSnippet = normalized.slice(start, end).trim();
      }

      const { role, priorityScore } = classifyEmailRole(cleaned, contextSnippet);
      const category = categorizeEmail(cleaned);

      // Base confidence score
      let confidence = 0.85;
      if (source === 'mailto') confidence = 0.98;
      else if (source === 'contact_page') confidence = 0.95;
      else if (source === 'video_description') confidence = 0.88;
      else if (source === 'link_page') confidence = 0.90;
      if (possibleDomainTypo) confidence -= 0.3;

      seenEmails.add(cleaned);
      results.push({
        email: cleaned,
        source,
        role,
        priorityScore,
        category,
        confidence: Number(confidence.toFixed(2)),
        contextSnippet,
        possibleDomainTypo,
      });
    }

    return results;
  }
}

export const emailExtractor = new EmailExtractor();
