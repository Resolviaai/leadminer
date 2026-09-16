import { google, gmail_v1 } from 'googleapis';
import { db } from '../../db/client';
import { gmailAccounts, systemSettings, suppressions, messages, leads } from '../../db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { env } from '../../config/env';

export interface SendEmailParams {
  leadId: number;
  campaignId: number;
  templateId?: number;
  recipientEmail: string;
  subject: string;
  body: string;
  idempotencyKey: string;
  personalizationStatus?: 'NONE' | 'CUSTOMIZED' | 'FALLBACK' | 'FAILED';
  personalizationModel?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  accountId?: number;
  error?: string;
  skippedReason?: string;
}

export class GmailSendingService {
  private async isKillSwitchActive(): Promise<boolean> {
    try {
      const record = await db.select().from(systemSettings).where(eq(systemSettings.key, 'kill_switch')).limit(1);
      if (record.length > 0 && record[0].value) {
        return Boolean((record[0].value as any).enabled);
      }
    } catch (e) {
      // In-memory fallback: false
    }
    return false;
  }

  private async isSuppressed(email: string): Promise<boolean> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const supp = await db
        .select()
        .from(suppressions)
        .where(sql`lower(${suppressions.email}) = ${cleanEmail}`)
        .limit(1);
      return supp.length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns current Pacific Time (America/Los_Angeles) date string YYYY-MM-DD.
   * Google Workspace and Gmail API reset daily sending quotas on Pacific Time.
   */
  public getPacificDateStr(date = new Date()): string {
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  }

  /**
   * Calculates a daily randomized sending limit (volume jitter)
   * For baseLimit 25, generates a natural target between 18 and 25.
   * Uses Pacific Time date string (YYYY-MM-DD) + accountId as seed so the target remains stable throughout each calendar day.
   */
  public getTodayEffectiveLimit(accountId: number, baseLimit = 25): number {
    const ptDateStr = this.getPacificDateStr();
    let hash = 0;
    const str = `${ptDateStr}_acc_${accountId}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const max = Math.min(baseLimit || 25, 25);
    const min = Math.min(18, max); // 18 minimum (or bounded by max if baseLimit < 18)
    const range = max - min + 1;
    const jitter = Math.abs(hash) % range;
    return min + jitter;
  }

  /**
   * Concurrency-safe atomic quota reservation:
   * Atomically claims 1 sending slot on an ACTIVE account using a conditional UPDATE ... WHERE sent_today < limit RETURNING *.
   * PostgreSQL row-level locks ensure that even if multiple workers or asynchronous tasks run concurrently,
   * no two workers can select or exceed the same remaining daily quota limit.
   */
  public async reserveSendingAccount(): Promise<typeof gmailAccounts.$inferSelect | null> {
    try {
      const accounts = await db
        .select()
        .from(gmailAccounts)
        .where(eq(gmailAccounts.status, 'ACTIVE'))
        .limit(10);

      const currentPtDate = this.getPacificDateStr();

      for (const account of accounts) {
        // 1. Pacific Time Midnight rollover check: reset sentToday if lastSendAt was before today in PT
        const lastSendPtDate = account.lastSendAt ? this.getPacificDateStr(new Date(account.lastSendAt)) : null;
        if (!lastSendPtDate || lastSendPtDate !== currentPtDate) {
          try {
            await db
              .update(gmailAccounts)
              .set({ sentToday: 0, updatedAt: new Date() })
              .where(eq(gmailAccounts.id, account.id));
            account.sentToday = 0;
          } catch {
            // Non-blocking fallback
          }
        }

        // 2. Enforce daily limit with volume jitter (18-25, max 25)
        const todayLimit = this.getTodayEffectiveLimit(account.id, account.dailyLimit);

        // 3. Atomically claim 1 quota slot with PostgreSQL row lock
        const reserved = await db
          .update(gmailAccounts)
          .set({
            sentToday: sql`COALESCE(${gmailAccounts.sentToday}, 0) + 1`,
            lastSendAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(gmailAccounts.id, account.id),
              eq(gmailAccounts.status, 'ACTIVE'),
              sql`COALESCE(${gmailAccounts.sentToday}, 0) < ${todayLimit}`
            )
          )
          .returning();

        if (reserved && reserved.length > 0) {
          return reserved[0];
        }
      }

      return null;
    } catch (e) {
      console.error('[GmailService] Error reserving sending account:', e);
      return null;
    }
  }

  /**
   * Releases an atomic quota reservation if sending fails or is aborted.
   */
  public async releaseAccountReservation(accountId: number): Promise<void> {
    try {
      await db
        .update(gmailAccounts)
        .set({
          sentToday: sql`GREATEST(0, COALESCE(${gmailAccounts.sentToday}, 0) - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(gmailAccounts.id, accountId));
    } catch (e) {
      console.error(`[GmailService] Failed to release quota reservation for account ${accountId}:`, e);
    }
  }

  private createRfc2822Message(from: string, to: string, subject: string, bodyText: string): string {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      bodyText,
    ];
    const message = messageParts.join('\r\n');
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  public async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // 1. Mandatory Pre-Send Check: Global Kill Switch
    if (await this.isKillSwitchActive()) {
      console.warn('⛔ [Kill Switch Active] Outreach is globally paused. Aborting send.');
      return { success: false, skippedReason: 'KILL_SWITCH_ACTIVE' };
    }

    // 2. Mandatory Pre-Send Check: Suppression
    if (await this.isSuppressed(params.recipientEmail)) {
      console.warn(`⛔ [Suppression] ${params.recipientEmail} is unsubscribed. Aborting send.`);
      return { success: false, skippedReason: 'RECIPIENT_SUPPRESSED' };
    }

    // 3. Atomically Reserve Sending Account Slot (Concurrency-safe)
    const account = await this.reserveSendingAccount();

    // When DRY_RUN = false and no available account with remaining quota:
    if (!env.DRY_RUN && !account) {
      console.warn('⛔ [Outreach] No healthy Gmail account available with remaining quota. Aborting send.');
      return { success: false, skippedReason: 'NO_HEALTHY_GMAIL_ACCOUNT' };
    }

    // 4. DRY RUN Mode Handler
    if (env.DRY_RUN) {
      const mockMessageId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockThreadId = `mock_thread_${Date.now()}`;

      console.log(`[DRY RUN OUTREACH] To: ${params.recipientEmail} | Subject: "${params.subject}"`);
      console.log(`[DRY RUN BODY PREVIEW]\n${params.body.slice(0, 150)}...\n---`);

      // Persist dry run message to DB if connection available
      try {
        await db
          .insert(messages)
          .values({
            leadId: params.leadId,
            campaignId: params.campaignId,
            gmailAccountId: account ? account.id : null,
            templateId: params.templateId,
            recipientEmail: params.recipientEmail,
            subject: params.subject,
            body: params.body,
            personalizationStatus: params.personalizationStatus || 'NONE',
            personalizationModel: params.personalizationModel,
            sendStatus: 'SENT',
            sentAt: new Date(),
            messageId: mockMessageId,
            threadId: mockThreadId,
            idempotencyKey: params.idempotencyKey,
          })
          .onConflictDoNothing();

        await db
          .update(leads)
          .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
          .where(eq(leads.id, params.leadId));
      } catch (e) {
        // Table might not be migrated yet in tests
      }

      return {
        success: true,
        messageId: mockMessageId,
        threadId: mockThreadId,
        accountId: account?.id,
      };
    }

    // 5. Live Gmail Send Execution (Two-Phase Commit Pattern)
    if (!account) {
      return { success: false, skippedReason: 'NO_HEALTHY_GMAIL_ACCOUNT' };
    }

    let messageRecordId: number | null = null;

    try {
      // Phase 1: Pre-insert message in 'SENDING' status with deterministic idempotency key.
      // This guarantees that even if a serverless timeout or DB connection drop occurs post-send,
      // the existence of this row prevents duplicate outreach from ever being dispatched to the creator.
      const preInsert = await db
        .insert(messages)
        .values({
          leadId: params.leadId,
          campaignId: params.campaignId,
          gmailAccountId: account.id,
          templateId: params.templateId,
          recipientEmail: params.recipientEmail,
          subject: params.subject,
          body: params.body,
          personalizationStatus: params.personalizationStatus || 'NONE',
          personalizationModel: params.personalizationModel,
          sendStatus: 'SENDING',
          idempotencyKey: params.idempotencyKey,
        })
        .onConflictDoNothing()
        .returning({ id: messages.id });

      if (preInsert.length > 0) {
        messageRecordId = preInsert[0].id;
      } else {
        // Record already exists for this idempotency key
        const existing = await db
          .select({
            id: messages.id,
            sendStatus: messages.sendStatus,
            messageId: messages.messageId,
            threadId: messages.threadId,
            gmailAccountId: messages.gmailAccountId,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(eq(messages.idempotencyKey, params.idempotencyKey))
          .limit(1);

        if (existing.length > 0) {
          const row = existing[0];
          if (row.sendStatus === 'SENT') {
            // Already delivered! Release reservation and confirm lead is CONTACTED
            await this.releaseAccountReservation(account.id);
            await db
              .update(leads)
              .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
              .where(eq(leads.id, params.leadId));
            return {
              success: true,
              messageId: row.messageId || undefined,
              threadId: row.threadId || undefined,
              accountId: row.gmailAccountId || account.id,
            };
          }

          // If currently SENDING within the last 5 minutes, an active worker is already handling it
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (row.sendStatus === 'SENDING' && row.createdAt && row.createdAt > fiveMinutesAgo) {
            await this.releaseAccountReservation(account.id);
            return { success: false, skippedReason: 'IN_FLIGHT_SENDING' };
          }

          // Otherwise, reuse this existing record for sending
          messageRecordId = row.id;
          await db
            .update(messages)
            .set({
              sendStatus: 'SENDING',
              gmailAccountId: account.id,
              updatedAt: new Date(),
            })
            .where(eq(messages.id, messageRecordId));
        }
      }

      // Initialize OAuth2 client with auto-refresh persistence
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: account.refreshToken,
        access_token: account.accessToken || undefined,
      });

      // Persist refreshed OAuth tokens back to gmail_accounts table
      oauth2Client.on('tokens', async (tokens) => {
        try {
          const updateData: { accessToken?: string; tokenExpiresAt?: Date; updatedAt: Date } = {
            updatedAt: new Date(),
          };
          if (tokens.access_token) {
            updateData.accessToken = tokens.access_token;
          }
          if (tokens.expiry_date) {
            updateData.tokenExpiresAt = new Date(tokens.expiry_date);
          }
          await db
            .update(gmailAccounts)
            .set(updateData)
            .where(eq(gmailAccounts.id, account.id));
          console.log(`[OAuth] Refreshed and persisted access token for ${account.email}`);
        } catch (tokErr: any) {
          console.warn(`[OAuth] Token persistence error for ${account.email}:`, tokErr.message);
        }
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const raw = this.createRfc2822Message(account.email, params.recipientEmail, params.subject, params.body);

      // Execute live send via Google API
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      const messageId = response.data.id || `live_msg_${Date.now()}`;
      const threadId = response.data.threadId || `live_thread_${Date.now()}`;

      // Phase 2: Update message record to 'SENT' and lead to 'CONTACTED'
      if (messageRecordId) {
        await db
          .update(messages)
          .set({
            sendStatus: 'SENT',
            sentAt: new Date(),
            messageId,
            threadId,
            updatedAt: new Date(),
          })
          .where(eq(messages.id, messageRecordId));
      }

      await db
        .update(leads)
        .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
        .where(eq(leads.id, params.leadId));

      return {
        success: true,
        messageId,
        threadId,
        accountId: account.id,
      };
    } catch (error: any) {
      console.error(`[Gmail Send Error] Account ${account.email}:`, error);

      // Update message row to 'FAILED' so audit trail is preserved and no ghost sends occur
      if (messageRecordId) {
        try {
          await db
            .update(messages)
            .set({
              sendStatus: 'FAILED',
              error: error.message,
              updatedAt: new Date(),
            })
            .where(eq(messages.id, messageRecordId));
        } catch {
          // Non-blocking fallback
        }
      }

      // Release the reserved quota slot since sending failed
      await this.releaseAccountReservation(account.id);

      if (error?.status === 401 || error?.message?.includes('invalid_grant')) {
        await db
          .update(gmailAccounts)
          .set({ status: 'AUTH_ERROR', lastError: error.message, updatedAt: new Date() })
          .where(eq(gmailAccounts.id, account.id));
      }

      return {
        success: false,
        accountId: account.id,
        error: error.message,
      };
    }
  }
}

export const gmailSendingService = new GmailSendingService();
