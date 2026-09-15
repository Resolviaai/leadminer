import dns from 'dns';
import { IEmailVerifier, VerificationResult } from './verifier.interface';

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
]);

export class LocalVerifier implements IEmailVerifier {
  public readonly providerName = 'local_dns_mx';

  public async verify(email: string): Promise<VerificationResult> {
    const timestamp = new Date();
    const cleanEmail = (email || '').toLowerCase().trim();

    // 1. Basic syntax check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        reason: 'Malformed email syntax',
        provider: this.providerName,
        timestamp,
      };
    }

    const [localPart, domain] = cleanEmail.split('@');

    // 2. Disposable domain check
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return {
        email: cleanEmail,
        status: 'DISPOSABLE',
        reason: 'Known disposable/temporary email service',
        provider: this.providerName,
        timestamp,
      };
    }

    // 3. Fast-path: Trusted major provider (0ms DNS latency, 100% deliverable host)
    if (MAJOR_PROVIDERS.has(domain)) {
      return {
        email: cleanEmail,
        status: 'VALID',
        reason: 'Trusted major mail provider',
        provider: this.providerName,
        timestamp,
      };
    }

    // 3. DNS MX Record Lookup
    try {
      const mxRecords = await this.resolveMxWithTimeout(domain, 4000);
      if (!mxRecords || mxRecords.length === 0) {
        return {
          email: cleanEmail,
          status: 'INVALID',
          reason: 'No DNS MX records found for domain',
          provider: this.providerName,
          timestamp,
        };
      }

      return {
        email: cleanEmail,
        status: 'VALID',
        reason: `Valid MX host: ${mxRecords[0].exchange} (priority ${mxRecords[0].priority})`,
        provider: this.providerName,
        timestamp,
      };
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return {
          email: cleanEmail,
          status: 'INVALID',
          reason: `Domain does not exist or has no mail records (${error.code})`,
          provider: this.providerName,
          timestamp,
        };
      }

      // DNS lookup timeout or network failure -> mark FAILED so we don't reject good emails permanently
      return {
        email: cleanEmail,
        status: 'FAILED',
        reason: `DNS MX check error: ${error.message || error.code}`,
        provider: this.providerName,
        timestamp,
      };
    }
  }

  private async resolveMxWithTimeout(domain: string, timeoutMs: number): Promise<dns.MxRecord[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('DNS lookup timed out'));
      }, timeoutMs);

      dns.resolveMx(domain, (err, addresses) => {
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
