import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db/client';
import { gmailAccounts, messages, logs, scheduledEmails, leadSequenceProgress } from '../../../../db/schema';
import { eq, sql, and, not } from 'drizzle-orm';
import { encryptionService } from '../../../../services/security/encryption.service';
import { gmailSendingService } from '../../../../services/outreach/gmail.service';
import { verifyDashboardAuth } from '../../../../lib/api-auth';
import { telegramService } from '../../../../services/notifications/telegram.service';

export async function POST(req: NextRequest) {
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    const accountId = Number(body.accountId);
    // N-P2-7: Strict boolean validation — reject strings like "false" that coerce truthy
    if (body.permanent !== undefined && typeof body.permanent !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid payload: "permanent" must be a JSON boolean (true or false), not a string or other type' },
        { status: 400 }
      );
    }
    const permanent = body.permanent === true;

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

    // 3. Re-pin or cancel pending scheduled emails and active sequences (TASK-12 / P1-6)
    const otherActiveAccounts = await db
      .select({ id: gmailAccounts.id, email: gmailAccounts.email })
      .from(gmailAccounts)
      .where(and(eq(gmailAccounts.status, 'ACTIVE'), not(eq(gmailAccounts.id, accountId))));

    if (otherActiveAccounts.length > 0) {
      const targetAccount = otherActiveAccounts[0];
      await db
        .update(scheduledEmails)
        .set({
          gmailAccountId: targetAccount.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(scheduledEmails.gmailAccountId, accountId),
            eq(scheduledEmails.status, 'PENDING')
          )
        );

      await db
        .update(leadSequenceProgress)
        .set({
          pinnedGmailAccountId: targetAccount.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leadSequenceProgress.pinnedGmailAccountId, accountId),
            eq(leadSequenceProgress.status, 'ACTIVE')
          )
        );

      console.log(`[Disconnect Re-Pin] Re-pinned sequences and pending sends from #${accountId} to #${targetAccount.id} (${targetAccount.email})`);
    } else {
      await db
        .update(scheduledEmails)
        .set({
          status: 'CANCELLED',
          error: `Pinned inbox ${account.email} was disconnected and no other active inboxes are available.`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(scheduledEmails.gmailAccountId, accountId),
            eq(scheduledEmails.status, 'PENDING')
          )
        );

      await db
        .update(leadSequenceProgress)
        .set({
          status: 'PAUSED',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leadSequenceProgress.pinnedGmailAccountId, accountId),
            eq(leadSequenceProgress.status, 'ACTIVE')
          )
        );

      console.warn(`[Disconnect Cancel] No active inboxes available. Cancelled pending scheduled emails for #${accountId}.`);
    }

    try {
      await telegramService.notifyCriticalError(
        'Gmail Inbox Disconnected',
        `Inbox ${account.email} (ID #${accountId}) was disconnected. ${
          otherActiveAccounts.length > 0
            ? `Pending sends re-pinned to ${otherActiveAccounts[0].email}.`
            : 'No alternate active inboxes found; pending sends cancelled.'
        }`
      );
    } catch (tgErr: any) {
      console.warn('[Disconnect Telegram Alert Non-Fatal]:', tgErr.message);
    }

    // 4. Execution: Permanent Delete vs Soft Disconnect
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
