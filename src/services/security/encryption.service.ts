import crypto from 'crypto';
import { env } from '../../config/env';

export class EncryptionService {
  private key: Buffer;

  constructor(customKey?: string) {
    const rawKey = customKey || env.ENCRYPTION_KEY;
    if (rawKey && rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
      this.key = Buffer.from(rawKey, 'hex');
    } else {
      this.key = crypto.createHash('sha256').update(rawKey || 'default-secret-key-leadminer').digest();
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Output format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
   */
  public encrypt(plaintext?: string | null): string | null {
    if (!plaintext) return plaintext as any;

    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag();

      return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (err: any) {
      console.error('[Encryption Error]:', err.message);
      throw new Error(`[Encryption Error] Failed to encrypt payload: ${err.message}`);
    }
  }

  /**
   * Decrypts ciphertext produced by encrypt().
   * If the input is plaintext (does not start with enc:v1:), returns it as-is for backward compatibility.
   * FAILS LOUD: Throws on corrupted ciphertext, tag mismatch, or key mismatch (P2-11).
   */
  public decrypt(ciphertext?: string | null): string | null {
    if (!ciphertext) return ciphertext as any;
    if (!ciphertext.startsWith('enc:v1:')) {
      return ciphertext; // Plaintext legacy compatibility
    }

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 5) {
        throw new Error('Malformed ciphertext envelope structure (expected 5 colon-delimited parts)');
      }

      const iv = Buffer.from(parts[2], 'hex');
      const tag = Buffer.from(parts[3], 'hex');
      const encryptedText = parts[4];

      if (iv.length !== 12 || tag.length !== 16) {
        throw new Error('Invalid IV or auth tag length for AES-256-GCM');
      }

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      console.error('[Decryption Error] Failed to decrypt token (failing loud):', err.message);
      throw new Error(`[Decryption Error] Cryptographic operation failed: ${err.message}`);
    }
  }

  /**
   * Re-encrypts ciphertext under a new encryption key (for key rotation).
   */
  public reEncrypt(ciphertext: string, newKeyRaw: string): string {
    const plaintext = this.decrypt(ciphertext);
    if (!plaintext) {
      throw new Error('Cannot re-encrypt empty plaintext');
    }
    const newService = new EncryptionService(newKeyRaw);
    const reEncrypted = newService.encrypt(plaintext);
    if (!reEncrypted) {
      throw new Error('Failed to encrypt under new key');
    }
    return reEncrypted;
  }
}

export const encryptionService = new EncryptionService();
