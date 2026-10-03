import dns from 'dns';
import { IEmailVerifier, VerificationResult } from './verifier.interface';

// Configure reliable DNS servers to avoid slow local router DNS lookups
// Allows override via process.env.DNS_SERVERS (or 'system' to preserve OS resolver)
try {
  const envDns = process.env.DNS_SERVERS;
  if (envDns) {
    const customServers = envDns
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (customServers.length > 0 && customServers[0].toLowerCase() !== 'system') {
      dns.setServers(customServers);
    }
  } else {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  }
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

const COMMERCIAL_ROLE_PREFIXES = new Set([
  'business',
  'partnerships',
  'sponsorships',
  'sponsor',
  'inquiries',
  'contact',
  'management',
  'collab',
  'collaborations',
  'pr',
  'booking',
  'media',
  'creator',
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
        confidenceScore: 0.0,
        reason: 'Malformed email syntax: invalid length',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        isCommercialRole: false,
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
        confidenceScore: 0.0,
        reason: 'Malformed email syntax: invalid @ placement',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        isCommercialRole: false,
        provider: this.providerName,
        timestamp,
      };
    }

    const [localPart, domain] = cleanEmail.split('@');

    if (localPart.length > 64 || domain.length > 255) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        confidenceScore: 0.0,
        reason: 'Malformed email syntax: length exceeds RFC limits',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        isCommercialRole: false,
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
        confidenceScore: 0.0,
        reason: 'Malformed email syntax',
        reasonCode: 'SYNTAX_INVALID',
        isRoleBased: false,
        isCommercialRole: false,
        provider: this.providerName,
        timestamp,
      };
    }

    // Role-based address detection (flagged, NOT rejected)
    const isCommercialRole = COMMERCIAL_ROLE_PREFIXES.has(localPart);
    const isRoleBased = isCommercialRole || ROLE_BASED_PREFIXES.has(localPart);

    // 2. Disposable domain check
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return {
        email: cleanEmail,
        status: 'DISPOSABLE',
        confidenceScore: 0.0,
        reason: 'Known disposable/temporary email service',
        reasonCode: 'DISPOSABLE_DOMAIN',
        isRoleBased,
        isCommercialRole,
        provider: this.providerName,
        timestamp,
      };
    }

    // 3. Fast-path: Trusted major provider (classified as DOMAIN_VALID, NEVER MAILBOX_VERIFIED)
    if (MAJOR_PROVIDERS.has(domain)) {
      let confidence = 0.70;
      if (isCommercialRole) confidence = 0.75;
      else if (isRoleBased) confidence = 0.50;

      return {
        email: cleanEmail,
        status: 'DOMAIN_VALID',
        confidenceScore: confidence,
        domain,
        mxProvider: domain === 'gmail.com' || domain === 'googlemail.com' ? 'CONSUMER_GMAIL' : 'CONSUMER_OUTLOOK',
        reason: isRoleBased
          ? 'Trusted major mail provider domain (role-based address flagged)'
          : 'Trusted major mail provider domain',
        reasonCode: 'MAJOR_PROVIDER_DOMAIN_VALID',
        isRoleBased,
        isCommercialRole,
        provider: this.providerName,
        timestamp,
      };
    }

    // 4. DNS MX Record Lookup with RFC 5321 Implicit MX Fallback (A & AAAA)
    try {
      const mxRecords = await this.resolveMxWithTimeout(domain, DNS_TIMEOUT);

      // Explicit Null MX check (RFC 7505: single MX with exchange "." means domain refuses all email)
      if (mxRecords.length === 1 && mxRecords[0].exchange === '.') {
        return {
          email: cleanEmail,
          status: 'INVALID',
          confidenceScore: 0.0,
          reason: 'Domain explicitly publishes Null MX record (RFC 7505 - refuses all mail)',
          reasonCode: 'NULL_MX_REFUSES_MAIL',
          isRoleBased,
          isCommercialRole,
          provider: this.providerName,
          timestamp,
        };
      }

      if (mxRecords.length > 0) {
        const primaryMx = mxRecords[0].exchange.toLowerCase();
        let mxProvider = 'CUSTOM';
        let baseConfidence = 0.70;

        if (primaryMx.includes('google.com') || primaryMx.includes('aspmx.l.google.com')) {
          mxProvider = 'GOOGLE_WORKSPACE';
          baseConfidence = 0.80;
        } else if (primaryMx.includes('outlook.com') || primaryMx.includes('protection.outlook.com')) {
          mxProvider = 'MICROSOFT_365';
          baseConfidence = 0.80;
        }

        let confidence = baseConfidence;
        if (isCommercialRole) {
          confidence = Math.min(1.0, baseConfidence + 0.05);
        } else if (isRoleBased) {
          confidence = Math.max(0.40, baseConfidence - 0.20);
        }

        return {
          email: cleanEmail,
          status: 'DOMAIN_VALID',
          confidenceScore: parseFloat(confidence.toFixed(2)),
          domain,
          mxProvider,
          reason: isRoleBased
            ? `Valid MX host: ${mxRecords[0].exchange} (priority ${mxRecords[0].priority}) (role-based address flagged)`
            : `Valid MX host: ${mxRecords[0].exchange} (priority ${mxRecords[0].priority})`,
          reasonCode: isRoleBased ? 'ROLE_BASED_FLAGGED' : 'CUSTOM_DOMAIN_MX_VALID',
          isRoleBased,
          isCommercialRole,
          provider: this.providerName,
          timestamp,
        };
      }

      // No MX records found -> Check RFC 5321 implicit MX fallback (A and AAAA records)
      const addrs = await this.resolveAddressWithTimeout(domain, 1500);
      if (addrs.ipv4.length > 0 || addrs.ipv6.length > 0) {
        return {
          email: cleanEmail,
          status: 'DOMAIN_VALID',
          confidenceScore: isCommercialRole ? 0.55 : 0.50,
          domain,
          mxProvider: 'IMPLICIT_MX_HOST',
          reason: `No MX records, but valid host address found (RFC 5321 implicit MX fallback: ${addrs.ipv4[0] || addrs.ipv6[0]})`,
          reasonCode: 'IMPLICIT_MX_FALLBACK',
          isRoleBased,
          isCommercialRole,
          provider: this.providerName,
          timestamp,
        };
      }

      return {
        email: cleanEmail,
        status: 'INVALID',
        confidenceScore: 0.0,
        reason: 'Domain has no DNS MX, A, or AAAA mail delivery records',
        reasonCode: 'NO_MAIL_RECORDS',
        isRoleBased,
        isCommercialRole,
        provider: this.providerName,
        timestamp,
      };
    } catch (error: any) {
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timed out')) {
        return {
          email: cleanEmail,
          status: 'FAILED',
          confidenceScore: 0.0,
          reason: 'DNS MX lookup timed out',
          reasonCode: 'DNS_TIMEOUT',
          isRoleBased,
          isCommercialRole,
          provider: this.providerName,
          timestamp,
        };
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return {
          email: cleanEmail,
          status: 'INVALID',
          confidenceScore: 0.0,
          reason: `Domain does not exist or has no mail records (${error.code})`,
          reasonCode: 'DOMAIN_NOT_FOUND',
          isRoleBased,
          isCommercialRole,
          provider: this.providerName,
          timestamp,
        };
      }

      // DNS lookup timeout or network failure -> mark FAILED so we don't reject good emails permanently
      return {
        email: cleanEmail,
        status: 'FAILED',
        confidenceScore: 0.0,
        reason: `DNS MX check error: ${error.message || error.code}`,
        reasonCode: 'DNS_ERROR',
        isRoleBased,
        isCommercialRole,
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

  private async resolveAddressWithTimeout(domain: string, timeoutMs: number): Promise<{ ipv4: string[]; ipv6: string[] }> {
    const resolve4Promise = new Promise<string[]>((resolve) => {
      dns.resolve4(domain, (err, addrs) => resolve(err ? [] : addrs || []));
    });
    const resolve6Promise = new Promise<string[]>((resolve) => {
      dns.resolve6(domain, (err, addrs) => resolve(err ? [] : addrs || []));
    });
    const timerPromise = new Promise<{ ipv4: string[]; ipv6: string[] }>((resolve) => {
      setTimeout(() => resolve({ ipv4: [], ipv6: [] }), timeoutMs);
    });

    const workPromise = Promise.all([resolve4Promise, resolve6Promise]).then(([ipv4, ipv6]) => ({ ipv4, ipv6 }));
    return Promise.race([workPromise, timerPromise]);
  }
}

export const localVerifier = new LocalVerifier();
