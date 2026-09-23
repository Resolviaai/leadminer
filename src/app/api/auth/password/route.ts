import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  verifyDashboardAuth,
  verifyPassword,
  hashPasswordWithSalt,
  validateLoginCredentials,
  createSessionCookie,
} from '../../../../lib/api-auth';
import { db } from '../../../../db/client';
import { systemSettings } from '../../../../db/schema';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = verifyDashboardAuth(req);
    if (!auth.authorized || !auth.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = (body.currentPassword ?? '').toString().trim();
    const newPassword = (body.newPassword ?? '').toString().trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // 1. Verify current password
    let currentValid = false;
    try {
      const records = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'admin_auth'))
        .limit(1);

      if (records.length > 0 && records[0].value) {
        const data = records[0].value as {
          email?: string;
          password_hash?: string;
          salt?: string;
        };
        if (data.password_hash && data.salt) {
          currentValid = verifyPassword(currentPassword, data.password_hash, data.salt);
        }
      }
    } catch (err: any) {
      console.warn('[Change Password] DB check error:', err.message);
    }

    // Fallback to env password check if not found or DB had no hash
    if (!currentValid) {
      currentValid = validateLoginCredentials(auth.email, currentPassword);
    }

    if (!currentValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // 2. Hash and save new password in PostgreSQL
    const { hash, salt } = hashPasswordWithSalt(newPassword);
    const authData = {
      email: auth.email.trim().toLowerCase(),
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

    const res = NextResponse.json({
      success: true,
      message: 'Password successfully updated in database',
    });
    res.headers.set('Set-Cookie', createSessionCookie(auth.email));
    return res;
  } catch (err: any) {
    console.error('[Change Password] Error:', err.message);
    return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
  }
}
