import { describe, it, expect } from 'vitest';
import { localVerifier } from '../../src/services/verification/local.verifier';
import { emailVerificationService } from '../../src/services/verification/verifier.service';

describe('Local Email Verifier', () => {
  describe('Syntax Validation', () => {
    it('should flag malformed emails as INVALID with SYNTAX_INVALID code', async () => {
      const invalidEmails = ['not-an-email', 'user@', '@domain.com', 'user@domain'];
      for (const email of invalidEmails) {
        const res = await localVerifier.verify(email);
        expect(res.status).toBe('INVALID');
        expect(res.reasonCode).toBe('SYNTAX_INVALID');
        expect(res.reason).toContain('Malformed');
      }
    });
  });

  describe('Disposable Domain Detection', () => {
    it('should flag disposable domains as DISPOSABLE with DISPOSABLE_DOMAIN code', async () => {
      const disposableEmails = [
        'creator@mailinator.com',
        'temp@guerrillamail.com',
        'trash@10minutemail.com',
        'tester@tempmail.com',
        'burner@sharklasers.com',
      ];
      for (const email of disposableEmails) {
        const res = await localVerifier.verify(email);
        expect(res.status).toBe('DISPOSABLE');
        expect(res.reasonCode).toBe('DISPOSABLE_DOMAIN');
      }
    });
  });

  describe('Major Provider Optimization', () => {
    it('should classify major providers as DOMAIN_VALID and never MAILBOX_VERIFIED', async () => {
      const majorEmails = ['user@gmail.com', 'client@yahoo.com', 'someone@outlook.com', 'pro@proton.me'];
      for (const email of majorEmails) {
        const res = await localVerifier.verify(email);
        expect(res.status).toBe('DOMAIN_VALID');
        expect(res.status).not.toBe('MAILBOX_VERIFIED');
        expect(res.reasonCode).toBe('MAJOR_PROVIDER_DOMAIN_VALID');
      }
    });
  });

  describe('MX DNS Lookup', () => {
    it('should verify real domains with valid MX records as DOMAIN_VALID', async () => {
      // Non-role user on custom domain google.com (google.com uses MX lookup)
      const res = await localVerifier.verify('alex@google.com');
      expect(res.status).toBe('DOMAIN_VALID');
      expect(res.reasonCode).toBe('CUSTOM_DOMAIN_MX_VALID');
      expect(res.reason).toContain('MX host');
      expect(res.isRoleBased).toBe(false);
    });

    it('should flag domains without MX or DNS records as INVALID or FAILED on timeout', async () => {
      const res = await localVerifier.verify('test@completelyfakeinvaliddomain999999.xyz');
      expect(['INVALID', 'FAILED']).toContain(res.status);
      expect(['DOMAIN_NOT_FOUND', 'NO_MX_RECORDS', 'DNS_TIMEOUT']).toContain(res.reasonCode);
    });
  });

  describe('Role-based Email Flagging', () => {
    it('should flag role-based addresses without rejecting them on major providers', async () => {
      const res = await localVerifier.verify('support@gmail.com');
      expect(res.status).toBe('DOMAIN_VALID');
      expect(res.isRoleBased).toBe(true);
      expect(res.reasonCode).toBe('MAJOR_PROVIDER_DOMAIN_VALID');
    });

    it('should flag role-based addresses without rejecting them on custom MX domains', async () => {
      const res = await localVerifier.verify('contact@google.com');
      expect(res.status).toBe('DOMAIN_VALID');
      expect(res.isRoleBased).toBe(true);
      expect(res.reasonCode).toBe('ROLE_BASED_FLAGGED');
      expect(res.reason).toContain('MX host');
    });

    it('should correctly identify various role-based prefixes', async () => {
      const prefixes = ['admin@gmail.com', 'info@yahoo.com', 'billing@outlook.com', 'sales@google.com'];
      for (const email of prefixes) {
        const res = await localVerifier.verify(email);
        expect(res.isRoleBased).toBe(true);
        expect(res.status).toBe('DOMAIN_VALID');
      }
    });
  });

  describe('Batch Verification', () => {
    it('should verify a batch of emails concurrently and preserve order', async () => {
      const batch = [
        'first@gmail.com',
        'invalid-email-syntax',
        'disposable@mailinator.com',
        'support@gmail.com',
        'alex@google.com',
      ];

      const results = await localVerifier.verifyBatch(batch, 5);
      expect(results).toHaveLength(5);
      expect(results[0].email).toBe('first@gmail.com');
      expect(results[0].status).toBe('DOMAIN_VALID');

      expect(results[1].email).toBe('invalid-email-syntax');
      expect(results[1].status).toBe('INVALID');

      expect(results[2].email).toBe('disposable@mailinator.com');
      expect(results[2].status).toBe('DISPOSABLE');

      expect(results[3].email).toBe('support@gmail.com');
      expect(results[3].isRoleBased).toBe(true);
      expect(results[3].status).toBe('DOMAIN_VALID');

      expect(results[4].email).toBe('alex@google.com');
      expect(results[4].status).toBe('DOMAIN_VALID');
    });
  });
});

describe('Email Verification Service Facade', () => {
  it('should handle empty strings gracefully', async () => {
    const res = await emailVerificationService.verifyEmail('');
    expect(res.status).toBe('INVALID');
    expect(res.reasonCode).toBe('SYNTAX_INVALID');
  });

  it('should delegate verifyBatch to the underlying verifier', async () => {
    const batch = ['user1@gmail.com', 'user2@yahoo.com'];
    const results = await emailVerificationService.verifyBatch(batch, 2);
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('DOMAIN_VALID');
    expect(results[1].status).toBe('DOMAIN_VALID');
  });
});

