import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db/client';
import { gmailAccounts, messages, logs } from '../../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { encryptionService } from '../../../../services/security/encryption.service';
import { gmailSendingService } from '../../../../services/outreach/gmail.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const accountId = Number(body.accountId);
    const permanent = Boolean(body.permanent);

    if (!accountId || isNaN(accountId)) {
      return NextResponse.json({ error: 'Valid accountId is required' }, { status: 400 });
    }

    const [account] = await db
      .select()
      .from(gmailAccounts)
      .where(eq(gmailAccounts.id, accountId))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: 'Gmail account not found' }, { status: 404 });
    }

    // 1. Google OAuth Token Revocation
    let tokenRevoked = false;
    if (account.refreshToken) {
      try {
        const rawToken = encryptionService.decrypt(account.refreshToken);
        if (rawToken) {
          const revokeRes = await fetch(
            `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(rawToken)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
          );
          tokenRevoked = revokeRes.ok;
          console.log(`[OAuth Revoke] ${account.email}: HTTP ${revokeRes.status}`);
        }
      } catch (e: any) {
        console.warn(`[OAuth Revoke Non-Fatal]: ${e.message}`);
      }
    }

    // Release any active in-memory quota reservations
    await gmailSendingService.releaseAccountReservation(accountId);

    // 2. Count existing sent messages
    const [msgCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.gmailAccountId, accountId));

    const sentMessagesCount = msgCountRes?.count || 0;

    // 3. Execution: Permanent Delete vs Soft Disconnect
    if (permanent && sentMessagesCount === 0) {
      await db.delete(gmailAccounts).where(eq(gmailAccounts.id, accountId));

      await db.insert(logs).values({
        eventType: 'GMAIL_ACCOUNT_DELETED',
        level: 'WARN',
        message: `Permanently removed connected inbox: ${account.email} (tokenRevoked=${tokenRevoked})`,
        metadata: { accountId, email: account.email, tokenRevoked },
      });

      return NextResponse.json({
        success: true,
        action: 'DELETED',
        message: `Inbox ${account.email} permanently removed.`,
        tokenRevoked,
      });
    }

    // Soft Disconnect: preserves foreign key associations & historical audit logs
    await db
      .update(gmailAccounts)
      .set({
        status: 'DISCONNECTED',
        refreshToken: null,
        accessToken: null,
        tokenExpiresAt: null,
        lastError: 'Account disconnected by user',
        updatedAt: new Date(),
      })
      .where(eq(gmailAccounts.id, accountId));

    await db.insert(logs).values({
      eventType: 'GMAIL_ACCOUNT_DISCONNECTED',
      level: 'INFO',
      message: `Disconnected inbox: ${account.email} (historical messages preserved: ${sentMessagesCount})`,
      metadata: { accountId, email: account.email, sentMessagesCount, tokenRevoked },
    });

    return NextResponse.json({
      success: true,
      action: 'DISCONNECTED',
      message: `Inbox ${account.email} disconnected. Historical records preserved.`,
      tokenRevoked,
      sentMessagesCount,
    });
  } catch (error: any) {
    console.error('[Disconnect Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
