import dns from 'dns';
import { IEmailVerifier, VerificationResult } from './verifier.interface';

// Configure reliable DNS servers to avoid slow local router DNS lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Graceful fallback to OS DNS
}

const DNS_TIMEOUT = 3000; // 3 seconds timeout for DNS MX lookups

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'getairmail.com',
  'temp-mail.org',
  'dispostable.com',
  'fakeinbox.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mohmal.com',
  'crazymailing.com',
  'nada.ltd',
]);

const MAJOR_PROVIDERS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
]);

const ROLE_BASED_PREFIXES = new Set([
  'info',
  'support',
  'admin',
  'sales',
  'billing',
  'help',
  'contact',
  'jobs',
  'careers',
  'team',
  'office',
  'press',
  'marketing',
  'hello',
  'hi',
  'enquiries',
]);

export class LocalVerifier implements IEmailVerifier {
  public readonly providerName = 'local_dns_mx';

  public async verify(email: string): Promise<VerificationResult> {
    const timestamp = new Date();
    const cleanEmail = (email || '').toLowerCase().trim();

    // 1. Basic syntax and length validation
    if (!cleanEmail || cleanEmail.length > 254) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        reason: 'Malformed email syntax: invalid length',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        provider: this.providerName,
        timestamp,
      };
    }

    const atIndex = cleanEmail.indexOf('@');
    const lastAtIndex = cleanEmail.lastIndexOf('@');
    if (atIndex <= 0 || atIndex !== lastAtIndex || atIndex === cleanEmail.length - 1) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        reason: 'Malformed email syntax: invalid @ placement',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        provider: this.providerName,
        timestamp,
      };
    }

    const [localPart, domain] = cleanEmail.split('@');

    if (localPart.length > 64 || domain.length > 255) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        reason: 'Malformed email syntax: length exceeds RFC limits',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        provider: this.providerName,
        timestamp,
      };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (
      !emailRegex.test(cleanEmail) ||
      domain.startsWith('.') ||
      domain.endsWith('.') ||
      domain.startsWith('-') ||
      domain.endsWith('-')
    ) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        reason: 'Malformed email syntax',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        provider: this.providerName,
        timestamp,
      };
    }

    // Role-based address detection (flagged, NOT rejected)
    const isRoleBased = ROLE_BASED_PREFIXES.has(localPart);

    // 2. Disposable domain check
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return {
        email: cleanEmail,
        status: 'DISPOSABLE',
        reason: 'Known disposable/temporary email service',
        reasonCode: 'DISPOSABLE_DOMAIN',
        isRoleBased,
        provider: this.providerName,
        timestamp,
      };
    }

    // 3. Fast-path: Trusted major provider (classified as DOMAIN_VALID, NEVER MAILBOX_VERIFIED)
    if (MAJOR_PROVIDERS.has(domain)) {
      return {
        email: cleanEmail,
        status: 'DOMAIN_VALID',
        reason: isRoleBased
          ? 'Trusted major mail provider domain (role-based address flagged)'
          : 'Trusted major mail provider domain',
        reasonCode: 'MAJOR_PROVIDER_DOMAIN_VALID',
        isRoleBased,
        provider: this.providerName,
        timestamp,
      };
    }

    // 4. DNS MX Record Lookup
    try {
      const mxRecords = await this.resolveMxWithTimeout(domain, DNS_TIMEOUT);
      if (!mxRecords || mxRecords.length === 0) {
        return {
          email: cleanEmail,
          status: 'INVALID',
          reason: 'No DNS MX records found for domain',
          reasonCode: 'NO_MX_RECORDS',
          isRoleBased,
          provider: this.providerName,
          timestamp,
        };
      }

      return {
        email: cleanEmail,
        status: 'DOMAIN_VALID',
        reason: isRoleBased
          ? `Valid MX host: ${mxRecords[0].exchange} (priority ${mxRecords[0].priority}) (role-based address flagged)`
          : `Valid MX host: ${mxRecords[0].exchange} (priority ${mxRecords[0].priority})`,
        reasonCode: isRoleBased ? 'ROLE_BASED_FLAGGED' : 'CUSTOM_DOMAIN_MX_VALID',
        isRoleBased,
        provider: this.providerName,
        timestamp,
      };
    } catch (error: any) {
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timed out')) {
        return {
          email: cleanEmail,
          status: 'FAILED',
          reason: 'DNS MX lookup timed out',
          reasonCode: 'DNS_TIMEOUT',
          isRoleBased,
          provider: this.providerName,
          timestamp,
        };
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return {
          email: cleanEmail,
          status: 'INVALID',
          reason: `Domain does not exist or has no mail records (${error.code})`,
          reasonCode: 'DOMAIN_NOT_FOUND',
          isRoleBased,
          provider: this.providerName,
          timestamp,
        };
      }

      // DNS lookup timeout or network failure -> mark FAILED so we don't reject good emails permanently
      return {
        email: cleanEmail,
        status: 'FAILED',
        reason: `DNS MX check error: ${error.message || error.code}`,
        reasonCode: 'DNS_ERROR',
        isRoleBased,
        provider: this.providerName,
        timestamp,
      };
    }
  }

  public async verifyBatch(emails: string[], concurrency = 20): Promise<VerificationResult[]> {
    if (!emails || emails.length === 0) return [];
    const results: VerificationResult[] = new Array(emails.length);
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < emails.length) {
        const i = currentIndex++;
        results[i] = await this.verify(emails[i]);
      }
    };

    const workerCount = Math.min(Math.max(concurrency, 1), emails.length);
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    return results;
  }

  private async resolveMxWithTimeout(domain: string, timeoutMs: number): Promise<dns.MxRecord[]> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const err: any = new Error('DNS lookup timed out');
        err.code = 'ETIMEDOUT';
        reject(err);
      }, timeoutMs);

      dns.resolveMx(domain, (err, addresses) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) {
          reject(err);
        } else {
          resolve((addresses || []).sort((a, b) => a.priority - b.priority));
        }
      });
    });
  }
}

export const localVerifier = new LocalVerifier();
