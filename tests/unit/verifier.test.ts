import { describe, it, expect } from 'vitest';
import { localVerifier } from '../../src/services/verification/local.verifier';
import { emailVerificationService } from '../../src/services/verification/verifier.service';

describe('Local Email Verifier', () => {
  it('should flag malformed emails as INVALID', async () => {
    const res = await localVerifier.verify('not-an-email');
    expect(res.status).toBe('INVALID');
    expect(res.reason).toContain('Malformed');
  });

  it('should flag disposable domains as DISPOSABLE', async () => {
    const res = await localVerifier.verify('creator@mailinator.com');
    expect(res.status).toBe('DISPOSABLE');
  });

  it('should verify real domains with valid MX records as VALID', async () => {
    const res = await localVerifier.verify('contact@google.com');
    expect(res.status).toBe('VALID');
    expect(res.reason).toContain('MX host');
  });

  it('should flag domains without MX or DNS records as INVALID', async () => {
    const res = await localVerifier.verify('test@completelyfakeinvaliddomain999999.xyz');
    expect(res.status).toBe('INVALID');
  });
});

describe('Email Verification Service Facade', () => {
  it('should handle empty strings gracefully', async () => {
    const res = await emailVerificationService.verifyEmail('');
    expect(res.status).toBe('INVALID');
  });
});
