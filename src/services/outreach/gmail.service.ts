import { google, gmail_v1 } from 'googleapis';
import crypto from 'crypto';
import { db } from '../../db/client';
import { gmailAccounts, systemSettings, suppressions, messages, leads } from '../../db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { env } from '../../config/env';
import { encryptionService } from '../security/encryption.service';

export interface SendEmailParams {
  leadId: number;
  campaignId: number;
  templateId?: number;
  contactId?: number;
  recipientEmail: string;
  subject: string;
  body: string;
  idempotencyKey: string;
  stepNumber?: number;
  pinnedAccountId?: number;
  inReplyToRfcId?: string;
  threadId?: string;
  personalizationStatus?: 'NONE' | 'CUSTOMIZED' | 'FALLBACK' | 'FAILED';
  personalizationModel?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  rfc822MessageId?: string;
  accountId?: number;
  senderEmail?: string;
  simulated?: boolean;
  verified?: boolean;
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
    } catch (e: any) {
      // BUG-02: Fail-closed on DB error! Halt sends if safety settings cannot be verified.
      console.error('⛔ [Kill Switch DB Error - Failing Closed]:', e?.message || e);
      return true;
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
    } catch (e: any) {
      // BUG-02: Fail-closed on DB error! Treat as suppressed if suppression table cannot be verified.
      console.error(`⛔ [Suppression DB Error for ${email} - Failing Closed]:`, e?.message || e);
      return true;
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
   * Concurrency-safe atomic quota reservation pinned to a specific Gmail account.
   * Used for follow-up sequence steps to guarantee strict account affinity.
   * If the pinned account has reached its daily limit, returns null rather than rerouting.
   */
  public async reserveSpecificSendingAccount(accountId: number): Promise<typeof gmailAccounts.$inferSelect | null> {
    try {
      const accounts = await db
        .select()
        .from(gmailAccounts)
        .where(and(eq(gmailAccounts.id, accountId), eq(gmailAccounts.status, 'ACTIVE')))
        .limit(1);

      if (accounts.length === 0) return null;
      const account = accounts[0];

      const currentPtDate = this.getPacificDateStr();
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

      const todayLimit = this.getTodayEffectiveLimit(account.id, account.dailyLimit);

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

      return null;
    } catch (e) {
      console.error(`[GmailService] Error reserving specific account ${accountId}:`, e);
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

  private createRfc2822Message(
    from: string,
    to: string,
    subject: string,
    bodyText: string,
    rfcMessageId: string,
    inReplyToRfcId?: string,
    unsubscribeUrl?: string
  ): string {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Message-ID: <${rfcMessageId}>`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
    ];

    if (inReplyToRfcId) {
      const cleanRef = inReplyToRfcId.replace(/^<|>$/g, '');
      messageParts.push(`In-Reply-To: <${cleanRef}>`);
      messageParts.push(`References: <${cleanRef}>`);
    }

    if (unsubscribeUrl) {
      messageParts.push(`List-Unsubscribe: <${unsubscribeUrl}>`);
      messageParts.push('List-Unsubscribe-Post: List-Unsubscribe=One-Click');
    }

    messageParts.push('');
    messageParts.push(bodyText);

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

    // 3. DRY RUN Mode Handler (Runs BEFORE reserving quota to ensure 0 quota consumption)
    if (env.DRY_RUN) {
      const mockMessageId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockThreadId = `mock_thread_${Date.now()}`;

      console.log(`[DRY RUN SIMULATION] To: ${params.recipientEmail} | Subject: "${params.subject}"`);
      console.log(`[DRY RUN BODY PREVIEW]\n${params.body.slice(0, 150)}...\n---`);

      // Persist dry run message to DB as SIMULATED (never SENT, never marks lead CONTACTED)
      try {
        await db
          .insert(messages)
          .values({
            leadId: params.leadId,
            campaignId: params.campaignId,
            gmailAccountId: null,
            templateId: params.templateId,
            contactId: params.contactId,
            recipientEmail: params.recipientEmail,
            subject: params.subject,
            body: params.body,
            stepNumber: params.stepNumber || 1,
            rfc822MessageId: `mock_${crypto.randomUUID()}@simulated.com`,
            personalizationStatus: params.personalizationStatus || 'NONE',
            personalizationModel: params.personalizationModel,
            sendStatus: 'SIMULATED',
            messageId: mockMessageId,
            threadId: mockThreadId,
            idempotencyKey: params.idempotencyKey,
          })
          .onConflictDoNothing();
      } catch (e) {
        // Non-blocking fallback
      }

      return {
        success: true,
        messageId: mockMessageId,
        threadId: mockThreadId,
        rfc822MessageId: `mock_${crypto.randomUUID()}@simulated.com`,
        simulated: true,
      };
    }

    // 4. Atomically Reserve Sending Account Slot (Concurrency-safe, LIVE MODE ONLY)
    // If pinnedAccountId is provided (Step 2..N), strictly reserve on pinned account; otherwise pick available account.
    const account = params.pinnedAccountId
      ? await this.reserveSpecificSendingAccount(params.pinnedAccountId)
      : await this.reserveSendingAccount();

    if (!account) {
      console.warn('⛔ [Outreach] No healthy Gmail account available with remaining quota. Aborting send.');
      return { success: false, skippedReason: 'NO_HEALTHY_GMAIL_ACCOUNT' };
    }

    // Generate cryptographic RFC822 Message-ID
    const senderDomain = account.email.split('@')[1] || 'leadminer.io';
    const rfcMessageId = `${crypto.randomUUID()}@${senderDomain}`;

    // 5. Live Gmail Send Execution (Two-Phase Commit Pattern)
    let messageRecordId: number | null = null;
    let liveSendSucceeded = false;
    let liveMessageId: string | null = null;
    let liveThreadId: string | null = null;

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
          contactId: params.contactId,
          recipientEmail: params.recipientEmail,
          subject: params.subject,
          body: params.body,
          stepNumber: params.stepNumber || 1,
          rfc822MessageId: rfcMessageId,
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

          if (row.sendStatus === 'UNCONFIRMED') {
            // BUG-01: Already dispatched to Gmail in an unconfirmed state.
            // Release reservation and confirm lead is CONTACTED. Never resend to prevent duplicates!
            await this.releaseAccountReservation(account.id);
            await db
              .update(leads)
              .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
              .where(eq(leads.id, params.leadId));
            return {
              success: false,
              messageId: row.messageId || undefined,
              threadId: row.threadId || undefined,
              accountId: row.gmailAccountId || account.id,
              skippedReason: 'POST_SEND_VERIFICATION_FAILED',
              error: 'Message was previously dispatched to Gmail in UNCONFIRMED state. Resend blocked to prevent duplicate emails.',
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

      // Transparent token decryption with AES-256-GCM / plaintext fallback
      const decryptedRefreshToken = encryptionService.decrypt(account.refreshToken);
      const decryptedAccessToken = account.accessToken ? encryptionService.decrypt(account.accessToken) : undefined;

      oauth2Client.setCredentials({
        refresh_token: decryptedRefreshToken,
        access_token: decryptedAccessToken,
      });

      // Persist refreshed OAuth tokens back to gmail_accounts table with AES-256-GCM encryption
      oauth2Client.on('tokens', async (tokens) => {
        try {
          const updateData: { accessToken?: string; tokenExpiresAt?: Date; updatedAt: Date } = {
            updatedAt: new Date(),
          };
          if (tokens.access_token) {
            const enc = encryptionService.encrypt(tokens.access_token);
            if (enc) updateData.accessToken = enc;
          }
          if (tokens.expiry_date) {
            updateData.tokenExpiresAt = new Date(tokens.expiry_date);
          }
          await db
            .update(gmailAccounts)
            .set(updateData)
            .where(eq(gmailAccounts.id, account.id));
          console.log(`[OAuth] Refreshed and encrypted access token for ${account.email}`);
        } catch (tokErr: any) {
          console.warn(`[OAuth] Token persistence error for ${account.email}:`, tokErr.message);
        }
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Pre-send Sender Identity Verification:
      // Verify that the OAuth token actually belongs to account.email
      try {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const actualEmail = profile.data.emailAddress?.toLowerCase().trim();
        const expectedEmail = account.email.toLowerCase().trim();

        if (actualEmail && actualEmail !== expectedEmail) {
          console.error(
            `⛔ [Sender Identity Mismatch] Connected Gmail inbox is ${actualEmail}, but account is configured as ${expectedEmail}. Aborting send.`
          );
          await this.releaseAccountReservation(account.id);
          await db
            .update(gmailAccounts)
            .set({
              status: 'AUTH_ERROR',
              lastError: `Sender mismatch: token belongs to ${actualEmail}, expected ${expectedEmail}`,
              updatedAt: new Date(),
            })
            .where(eq(gmailAccounts.id, account.id));

          return {
            success: false,
            accountId: account.id,
            skippedReason: 'SENDER_IDENTITY_MISMATCH',
            error: `Sender mismatch: OAuth token belongs to ${actualEmail}, expected ${expectedEmail}`,
          };
        }
      } catch (profileErr: any) {
        if (profileErr?.status === 401 || profileErr?.message?.includes('invalid_grant')) {
          await this.releaseAccountReservation(account.id);
          await db
            .update(gmailAccounts)
            .set({ status: 'AUTH_ERROR', lastError: profileErr.message, updatedAt: new Date() })
            .where(eq(gmailAccounts.id, account.id));
          return {
            success: false,
            accountId: account.id,
            error: `Gmail OAuth authorization invalid: ${profileErr.message}`,
          };
        }
        console.warn(`⚠️ [Sender Profile Check Non-Fatal]: ${profileErr.message}`);
      }

      // Pre-send In-Flight Gmail Reconciliation Check:
      // Verify if a message with matching subject was already sent to recipient in the last 2 hours
      try {
        const listQuery = `to:${params.recipientEmail}`;
        const existingList = await gmail.users.messages.list({
          userId: 'me',
          q: listQuery,
          maxResults: 5,
        });

        if (existingList.data.messages && existingList.data.messages.length > 0) {
          for (const msgItem of existingList.data.messages) {
            if (!msgItem.id) continue;
            const fullMsg = await gmail.users.messages.get({
              userId: 'me',
              id: msgItem.id,
              format: 'metadata',
              metadataHeaders: ['Subject', 'Date'],
            });

            const headers = fullMsg.data.payload?.headers || [];
            const foundSubject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value;

            if (foundSubject && foundSubject.trim() === params.subject.trim()) {
              const internalDate = fullMsg.data.internalDate
                ? new Date(parseInt(fullMsg.data.internalDate, 10))
                : new Date();
              const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

              if (internalDate >= twoHoursAgo) {
                console.log(
                  `[Gmail In-Flight Reconciliation] Found matching sent message in Gmail (ID: ${msgItem.id}). Reconciling without resending.`
                );

                if (messageRecordId) {
                  await db
                    .update(messages)
                    .set({
                      sendStatus: 'SENT',
                      sentAt: internalDate,
                      messageId: msgItem.id,
                      threadId: fullMsg.data.threadId || undefined,
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
                  messageId: msgItem.id,
                  threadId: fullMsg.data.threadId || undefined,
                  accountId: account.id,
                  senderEmail: account.email,
                };
              }
            }
          }
        }
      } catch (listErr: any) {
        console.warn(`[Gmail Pre-Send Check] List reconciliation check non-fatal: ${listErr.message}`);
      }

      // Construct Unsubscribe URL (RFC 2369 / RFC 8058 compliant)
      const unsubUrl = `${env.APP_URL}/api/unsubscribe?email=${encodeURIComponent(params.recipientEmail)}&leadId=${params.leadId}`;
      const raw = this.createRfc2822Message(
        account.email,
        params.recipientEmail,
        params.subject,
        params.body,
        rfcMessageId,
        params.inReplyToRfcId,
        unsubUrl
      );

      // Execute live send via Google API
      const requestBody: any = { raw };
      if (params.threadId) {
        requestBody.threadId = params.threadId;
      }

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody,
      });

      // Mark live send as successfully dispatched
      liveSendSucceeded = true;
      liveMessageId = response.data.id || `live_msg_${Date.now()}`;
      liveThreadId = response.data.threadId || `live_thread_${Date.now()}`;

      // Post-Send Live Verification: Confirm message exists in Gmail Sent history (multi-attempt)
      let verifiedInGmail = false;
      let verificationFailureReason: string | null = null;
      let verifiedFrom: string | null | undefined;
      let verifiedTo: string | null | undefined;

      for (let vAttempt = 1; vAttempt <= 3; vAttempt++) {
        try {
          const verifiedMsg = await gmail.users.messages.get({
            userId: 'me',
            id: liveMessageId,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject'],
          });

          if (!verifiedMsg?.data?.id) {
            verificationFailureReason = `Message ID ${liveMessageId} not found in Gmail metadata response`;
            throw new Error(verificationFailureReason);
          }

          const labels = verifiedMsg.data.labelIds || [];
          const hasSentLabel = labels.includes('SENT');
          if (!hasSentLabel) {
            verificationFailureReason = `Message ${liveMessageId} missing SENT label (labels: ${labels.join(', ')})`;
            throw new Error(verificationFailureReason);
          }

          const headers = verifiedMsg.data.payload?.headers || [];
          verifiedFrom = headers.find((h) => h.name?.toLowerCase() === 'from')?.value;
          verifiedTo = headers.find((h) => h.name?.toLowerCase() === 'to')?.value;

          const cleanFrom = (verifiedFrom || '').toLowerCase();
          const cleanExpectedFrom = account.email.toLowerCase();
          if (!cleanFrom.includes(cleanExpectedFrom)) {
            verificationFailureReason = `From header mismatch: expected ${cleanExpectedFrom}, got ${verifiedFrom}`;
            throw new Error(verificationFailureReason);
          }

          const cleanTo = (verifiedTo || '').toLowerCase();
          const cleanExpectedTo = params.recipientEmail.toLowerCase();
          if (!cleanTo.includes(cleanExpectedTo)) {
            verificationFailureReason = `To header mismatch: expected ${cleanExpectedTo}, got ${verifiedTo}`;
            throw new Error(verificationFailureReason);
          }

          console.log(
            `🔍 [Gmail Verification Confirmed] Attempt ${vAttempt}: ID=${liveMessageId} | SENT_label=true | From: ${verifiedFrom} | To: ${verifiedTo}`
          );
          verifiedInGmail = true;
          verificationFailureReason = null;
          break;
        } catch (verifyErr: any) {
          verificationFailureReason = verifyErr.message;
          console.warn(`⚠️ [Gmail Verification Attempt ${vAttempt}/3]: ${verifyErr.message}`);
          if (vAttempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 200 * vAttempt));
          }
        }
      }

      // Strict enforcement: If Gmail verification failed, lock in UNCONFIRMED non-retryable state
      if (!verifiedInGmail) {
        console.error(
          `⛔ [Gmail Post-Send Verification Failed] Message ${liveMessageId} could not be verified in Gmail SENT mailbox: ${verificationFailureReason}. Locking in UNCONFIRMED non-retryable state to prevent duplicates!`
        );

        if (messageRecordId) {
          try {
            await db
              .update(messages)
              .set({
                sendStatus: 'UNCONFIRMED',
                messageId: liveMessageId,
                threadId: liveThreadId,
                error: `Gmail post-send verification failed: ${verificationFailureReason}`,
                updatedAt: new Date(),
              })
              .where(eq(messages.id, messageRecordId));
          } catch (e: any) {
            console.error('[Failed to update unconfirmed message status]:', e.message);
          }
        }

        // Lock lead in CONTACTED status so LeadMiner can NEVER accidentally send a duplicate
        try {
          await db
            .update(leads)
            .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
            .where(eq(leads.id, params.leadId));
        } catch (e: any) {
          console.error('[Failed to lock lead outreach status]:', e.message);
        }

        // Quota is NOT refunded because the API send call was already dispatched
        return {
          success: false,
          messageId: liveMessageId,
          threadId: liveThreadId,
          accountId: account.id,
          senderEmail: account.email,
          verified: false,
          skippedReason: 'POST_SEND_VERIFICATION_FAILED',
          error: `Gmail post-send verification failed: ${verificationFailureReason}`,
        };
      }

      // Phase 2: ONLY executed when Gmail confirms message exists, has SENT label, From matches, and To matches!
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (messageRecordId) {
            await db
              .update(messages)
              .set({
                sendStatus: 'SENT',
                sentAt: new Date(),
                messageId: liveMessageId,
                threadId: liveThreadId,
                updatedAt: new Date(),
              })
              .where(eq(messages.id, messageRecordId));
          }

          await db
            .update(leads)
            .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
            .where(eq(leads.id, params.leadId));

          break; // Successfully updated
        } catch (dbErr: any) {
          console.warn(`⚠️ [Gmail Send DB Update] Attempt ${attempt}/3 failed: ${dbErr.message}`);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          }
        }
      }

      return {
        success: true,
        messageId: liveMessageId,
        threadId: liveThreadId,
        rfc822MessageId: rfcMessageId,
        accountId: account.id,
        senderEmail: account.email,
        verified: true,
      };
    } catch (error: any) {
      console.error(`[Gmail Send Error] Account ${account.email}:`, error);

      // CRITICAL CRASH SAFETY: If the live Gmail API call succeeded, NEVER mark as FAILED
      // and NEVER release the account quota reservation!
      if (liveSendSucceeded) {
        console.error(
          `⚠️ [CRITICAL] Live Gmail send succeeded (${liveMessageId}) but post-send DB update threw an error. Preserving SENT state to prevent duplicate outreach!`
        );
        // Best-effort background reconcile
        if (messageRecordId && liveMessageId) {
          db.update(messages)
            .set({
              sendStatus: 'SENT',
              messageId: liveMessageId,
              threadId: liveThreadId || undefined,
              sentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(messages.id, messageRecordId))
            .catch((e) => console.error('[Background Reconcile Failed]:', e.message));
        }

        return {
          success: true,
          messageId: liveMessageId || undefined,
          threadId: liveThreadId || undefined,
          accountId: account.id,
          senderEmail: account.email,
        };
      }

      // Update message row to 'FAILED' only if live send NEVER happened
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

      // Release the reserved quota slot since sending never occurred
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
