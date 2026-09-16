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
      return plaintext;
    }
  }

  /**
   * Decrypts ciphertext produced by encrypt().
   * If the input is plaintext (does not start with enc:v1:), returns it as-is for backward compatibility.
   */
  public decrypt(ciphertext?: string | null): string | null {
    if (!ciphertext) return ciphertext as any;
    if (!ciphertext.startsWith('enc:v1:')) {
      return ciphertext; // Plaintext fallback
    }

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 5) {
        return ciphertext;
      }

      const iv = Buffer.from(parts[2], 'hex');
      const tag = Buffer.from(parts[3], 'hex');
      const encryptedText = parts[4];

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      console.warn('[Decryption Warning] Failed to decrypt token, using fallback:', err.message);
      return ciphertext;
    }
  }
}

export const encryptionService = new EncryptionService();
