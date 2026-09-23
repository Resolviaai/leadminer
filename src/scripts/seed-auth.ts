import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/client';
import { systemSettings } from '../db/schema';
import crypto from 'crypto';

export function hashPasswordWithSalt(password: string, existingSalt?: string) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
    return (
      computedHash.length === storedHash.length &&
      crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash))
    );
  } catch {
    return false;
  }
}

export async function seedAdminAuth() {
  const email = (process.env.DASHBOARD_EMAIL || 'resolviaai@gmail.com').trim().toLowerCase();
  const password = (process.env.DASHBOARD_PASSWORD || '').trim();
  if (!password) {
    throw new Error('DASHBOARD_PASSWORD must be set in environment variables');
  }

  const { hash, salt } = hashPasswordWithSalt(password);

  const authData = {
    email,
    password_hash: hash,
    salt,
    updated_at: new Date().toISOString(),
  };

  await db
    .insert(systemSettings)
    .values({
      key: 'admin_auth',
      value: authData,
      description: 'Operator login credentials with salted scrypt hash',
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: authData,
        updatedAt: new Date(),
      },
    });

  console.log(`[Seed Auth] Successfully persisted credentials in PostgreSQL for: ${email}`);
}

if (require.main === module) {
  seedAdminAuth()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Auth] Error:', err.message);
      process.exit(1);
    });
}
