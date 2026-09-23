export type ExtractedEmailSource = 'description' | 'custom_url' | 'links' | 'video_description' | 'link_page';

export interface ExtractedEmail {
  email: string;
  source: ExtractedEmailSource;
  category?: EmailCategory;
}

export type EmailCategory = 'CREATOR_DIRECT' | 'BUSINESS_INQUIRIES' | 'MANAGEMENT' | 'GENERIC_SUPPORT';

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
  'gmail.con',
  'gamil.com',
  'patreon.com',
  'spotify.com',
  'linktr.ee',
  'beacons.ai',
  'sentry.io',
  'wixpress.com',
]);

const BLOCKED_PREFIXES = new Set([
  'noreply',
  'no-reply',
  'donotreply',
  'support',
  'help',
  'security',
  'admin',
  'billing',
  'postmaster',
  'mailer-daemon',
  'daemon',
  'bounce',
  'abuse',
  'your',
  'email',
  'contact-us',
  'info',
  'feedback',
  'press',
  'jobs',
  'careers',
  'privacy',
  'legal',
]);

const FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.pdf'];

export class EmailExtractor {
  // RFC-compliant email regex pattern with boundary detection
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  public extractEmails(text: string, source: ExtractedEmailSource = 'description'): ExtractedEmail[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const matches = text.match(this.emailRegex) || [];
    const uniqueEmails = new Set<string>();
    const results: ExtractedEmail[] = [];

    for (let raw of matches) {
      // 1. Clean trailing punctuation
      let cleaned = raw.toLowerCase().trim();
      while (cleaned.endsWith('.') || cleaned.endsWith(',') || cleaned.endsWith(';') || cleaned.endsWith(':') || cleaned.endsWith(')')) {
        cleaned = cleaned.slice(0, -1);
      }

      // 2. Reject if invalid format after cleaning
      const parts = cleaned.split('@');
      if (parts.length !== 2) continue;

      const [localPart, domain] = parts;

      // 3. Reject file extension false positives (e.g. icon@2x.png)
      if (FILE_EXTENSIONS.some((ext) => cleaned.endsWith(ext))) {
        continue;
      }

      // 4. Reject blocked domains and prefixes
      if (BLOCKED_DOMAINS.has(domain)) {
        continue;
      }

      if (
        BLOCKED_PREFIXES.has(localPart) ||
        localPart.startsWith('api-') ||
        localPart.startsWith('support-') ||
        localPart.startsWith('noreply')
      ) {
        continue;
      }

      // 5. Check TLD validity
      const tld = domain.split('.').pop();
      if (!tld || tld.length < 2 || tld.length > 10) {
        continue;
      }

      if (!uniqueEmails.has(cleaned)) {
        uniqueEmails.add(cleaned);
        results.push({ email: cleaned, source });
      }
    }

    return results;
  }
}

export const emailExtractor = new EmailExtractor();
