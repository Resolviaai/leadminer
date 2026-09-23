import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../../src/services/security/encryption.service';

describe('EncryptionService Fail-Loud Suite (P2-11)', () => {
  const enc = new EncryptionService('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');

  it('1. Encrypts and decrypts plaintext cleanly', () => {
    const original = '1//04_secret_google_refresh_token_xyz';
    const ciphertext = enc.encrypt(original);
    expect(ciphertext).toBeDefined();
    expect(ciphertext).toMatch(/^enc:v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);

    const decrypted = enc.decrypt(ciphertext);
    expect(decrypted).toBe(original);
  });

  it('2. Supports legacy unencrypted plaintext for backward compatibility', () => {
    const legacyToken = '1//04_plain_text_token';
    const result = enc.decrypt(legacyToken);
    expect(result).toBe(legacyToken);
  });

  it('3. Fails loud by throwing on corrupted ciphertext (P2-11)', () => {
    const original = 'my-secret-token';
    const ciphertext = enc.encrypt(original)!;

    // Tamper with the ciphertext payload
    const parts = ciphertext.split(':');
    parts[4] = 'deadbeef' + parts[4].slice(8);
    const tampered = parts.join(':');

    expect(() => enc.decrypt(tampered)).toThrowError(/Cryptographic operation failed/);
  });

  it('4. Fails loud by throwing on corrupted auth tag (P2-11)', () => {
    const original = 'my-secret-token';
    const ciphertext = enc.encrypt(original)!;

    const parts = ciphertext.split(':');
    parts[3] = '00000000000000000000000000000000'; // Fake tag
    const tampered = parts.join(':');

    expect(() => enc.decrypt(tampered)).toThrowError(/Cryptographic operation failed/);
  });

  it('5. Successfully re-encrypts under a new key for rotation', () => {
    const original = 'secret_rotate_token';
    const ciphertext = enc.encrypt(original)!;

    const newKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
    const rotated = enc.reEncrypt(ciphertext, newKey);

    const newEnc = new EncryptionService(newKey);
    expect(newEnc.decrypt(rotated)).toBe(original);
  });
});
