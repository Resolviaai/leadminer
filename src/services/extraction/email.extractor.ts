export interface ExtractedEmail {
  email: string;
  source: 'description' | 'custom_url' | 'links';
}

const BLOCKED_DOMAINS = new Set([
  'example.com',
  'sample.com',
  'domain.com',
  'email.com',
  'test.com',
  'youtube.com',
  'google.com',
  'googlemail.com',
  'gmail.con',
  'gamil.com',
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
]);

const FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.pdf'];

export class EmailExtractor {
  // RFC-compliant email regex pattern with boundary detection
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  public extractEmails(text: string, source: 'description' | 'custom_url' | 'links' = 'description'): ExtractedEmail[] {
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

      if (BLOCKED_PREFIXES.has(localPart)) {
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
