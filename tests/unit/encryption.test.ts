import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../../src/services/security/encryption.service';

describe('EncryptionService (AES-256-GCM)', () => {
  const enc = new EncryptionService('6a1c0241bf451936b9846d46ade51803d748cc190ac229687d69707b3dc75fa7');

  it('should encrypt and decrypt a string accurately', () => {
    const original = '1//04_AbCdEfGhIjKlMnOpQrStUvWxYz-refresh-token-secret-12345';
    const encrypted = enc.encrypt(original);

    expect(encrypted).not.toBeNull();
    expect(encrypted).not.toEqual(original);
    expect(encrypted?.startsWith('enc:v1:')).toBe(true);

    const decrypted = enc.decrypt(encrypted);
    expect(decrypted).toEqual(original);
  });

  it('should gracefully return plaintext if input is not encrypted (backward compatibility)', () => {
    const plaintext = 'unencrypted-legacy-token-already-in-db';
    const decrypted = enc.decrypt(plaintext);
    expect(decrypted).toEqual(plaintext);
  });

  it('should handle null and empty values', () => {
    expect(enc.encrypt(null)).toBeNull();
    expect(enc.decrypt(null)).toBeNull();
  });
});
