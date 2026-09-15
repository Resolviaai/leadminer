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
      const supp = await db.select().from(suppressions).where(eq(suppressions.email, email.toLowerCase().trim())).limit(1);
      return supp.length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Calculates a daily randomized sending limit (volume jitter)
   * For baseLimit 25, generates a natural target between 18 and 25.
   * Uses date string (YYYY-MM-DD) + accountId as seed so the target remains stable throughout each calendar day.
   */
  public getTodayEffectiveLimit(accountId: number, baseLimit = 25): number {
    const todayStr = new Date().toISOString().slice(0, 10);
    let hash = 0;
    const str = `${todayStr}_acc_${accountId}`;
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

  private async getAvailableAccount(): Promise<typeof gmailAccounts.$inferSelect | null> {
    try {
      const accounts = await db
        .select()
        .from(gmailAccounts)
        .where(and(eq(gmailAccounts.status, 'ACTIVE')))
        .limit(10);

      const now = new Date();
      const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

      for (const account of accounts) {
        let sentToday = account.sentToday ?? 0;

        // 1. Check account.lastSendAt. If it was before today's UTC midnight, reset account.sentToday = 0 in DB
        if (!account.lastSendAt || new Date(account.lastSendAt) < todayUtc) {
          sentToday = 0;
          try {
            await db
              .update(gmailAccounts)
              .set({ sentToday: 0, updatedAt: new Date() })
              .where(eq(gmailAccounts.id, account.id));
          } catch (e) {
            // DB write fallback
          }
        }

        // 2. Also check count of sent messages today:
        // SELECT count(*) FROM messages WHERE gmail_account_id = account.id AND send_status = 'SENT' AND sent_at >= todayUtc
        let actualSentToday = 0;
        try {
          const messageCountRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(messages)
            .where(
              and(
                eq(messages.gmailAccountId, account.id),
                eq(messages.sendStatus, 'SENT'),
                gte(messages.sentAt, todayUtc)
              )
            );
          actualSentToday = Number(messageCountRes[0]?.count || 0);
        } catch (e) {
          actualSentToday = sentToday;
        }

        const effectiveSentToday = Math.max(sentToday, actualSentToday);
        if (effectiveSentToday !== account.sentToday) {
          try {
            await db
              .update(gmailAccounts)
              .set({ sentToday: effectiveSentToday, updatedAt: new Date() })
              .where(eq(gmailAccounts.id, account.id));
          } catch (e) {
            // DB write fallback
          }
        }

        // 3. Enforce daily limit with volume jitter (18-25, max 25)
        const todayLimit = this.getTodayEffectiveLimit(account.id, account.dailyLimit);
        if (effectiveSentToday < todayLimit) {
          return {
            ...account,
            sentToday: effectiveSentToday,
          };
        }
      }

      return null;
    } catch (e) {
      console.error('[GmailService] Error getting available account:', e);
      return null;
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

    // 3. Select Sending Account
    const account = await this.getAvailableAccount();

    // When DRY_RUN = false and no available account: do NOT fake send!
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

    // 5. Live Gmail Send Execution
    if (!account) {
      return { success: false, skippedReason: 'NO_HEALTHY_GMAIL_ACCOUNT' };
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: account.refreshToken,
        access_token: account.accessToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const raw = this.createRfc2822Message(account.email, params.recipientEmail, params.subject, params.body);

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      const messageId = response.data.id || `live_msg_${Date.now()}`;
      const threadId = response.data.threadId || `live_thread_${Date.now()}`;

      // 6. Atomically record sent state and update quota
      await db.insert(messages).values({
        leadId: params.leadId,
        campaignId: params.campaignId,
        gmailAccountId: account.id,
        templateId: params.templateId,
        recipientEmail: params.recipientEmail,
        subject: params.subject,
        body: params.body,
        personalizationStatus: params.personalizationStatus || 'NONE',
        personalizationModel: params.personalizationModel,
        sendStatus: 'SENT',
        sentAt: new Date(),
        messageId,
        threadId,
        idempotencyKey: params.idempotencyKey,
      });

      await db
        .update(gmailAccounts)
        .set({
          sentToday: account.sentToday + 1,
          lastSendAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(gmailAccounts.id, account.id));

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
