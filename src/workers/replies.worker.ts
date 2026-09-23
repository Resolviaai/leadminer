import { google } from 'googleapis';
import { db } from '../db/client';
import { gmailAccounts, messages, replies, leads, suppressions, scheduledEmails, contacts } from '../db/schema';
import { eq, and, isNotNull, inArray, desc, gte, sql } from 'drizzle-orm';
import { env } from '../config/env';
import { replyDetectorService } from '../services/replies/reply.detector';
import { jobRunner } from '../services/jobs/job.runner';
import { encryptionService } from '../services/security/encryption.service';
import { sequenceService } from '../services/outreach/sequence.service';
import { gmailSendingService } from '../services/outreach/gmail.service';

export function decodeGmailBody(payload: any): string {
  const parts: string[] = [];
  const visit = (part: any) => {
    if (part?.body?.data) {
      try {
        parts.push(Buffer.from(part.body.data, 'base64url').toString('utf8'));
      } catch {
        // Ignore malformed MIME parts; the snippet remains available.
      }
    }
    for (const child of part?.parts || []) visit(child);
  };
  visit(payload);
  return parts.join('\n');
}

export type AutomatedResponseType = 'NONE' | 'HARD_BOUNCE' | 'SOFT_BOUNCE' | 'OUT_OF_OFFICE';

export function classifyAutomatedResponse(
  headers: { name?: string; value?: string }[],
  fromHeader: string,
  subjectHeader: string = '',
  bodyText: string = ''
): AutomatedResponseType {
  const fromEmailLower = (fromHeader || '').toLowerCase();
  const subjectLower = (subjectHeader || '').toLowerCase();
  const autoSubmitted = headers.find((h: any) => h.name?.toLowerCase() === 'auto-submitted')?.value?.toLowerCase();
  const precedence = headers.find((h: any) => h.name?.toLowerCase() === 'precedence')?.value?.toLowerCase();
  const xAutoreply = headers.find((h: any) => h.name?.toLowerCase() === 'x-autoreply')?.value?.toLowerCase();

  // 1. OUT OF OFFICE / VACATION / AUTO-REPLY
  const isOooSubject =
    subjectLower.includes('out of office') ||
    subjectLower.includes('away from office') ||
    subjectLower.includes('away from my desk') ||
    subjectLower.includes('automatic reply') ||
    subjectLower.includes('auto-reply') ||
    subjectLower.includes('autoreply') ||
    subjectLower.includes('on leave') ||
    subjectLower.includes('on vacation') ||
    subjectLower.includes('vacation notice');

  const isOooHeader =
    autoSubmitted === 'auto-replied' ||
    xAutoreply === 'yes';

  if (isOooSubject || isOooHeader) {
    return 'OUT_OF_OFFICE';
  }

  // 2. SOFT BOUNCE (temporary mailbox issues, greylisting, quota)
  const isSoftBounce =
    subjectLower.includes('mailbox is full') ||
    subjectLower.includes('mailbox full') ||
    subjectLower.includes('quota exceeded') ||
    subjectLower.includes('temporarily unavailable') ||
    subjectLower.includes('service unavailable') ||
    subjectLower.includes('too busy') ||
    subjectLower.includes('temporary problem') ||
    subjectLower.includes('greylisted') ||
    bodyText.toLowerCase().includes('mailbox is full') ||
    bodyText.toLowerCase().includes('quota exceeded') ||
    bodyText.toLowerCase().includes('temporarily deferred');

  if (isSoftBounce) {
    return 'SOFT_BOUNCE';
  }

  // 3. HARD BOUNCE / AUTOMATED DAEMON / DELIVERY FAILURE
  const isDaemonOrBounceAddress =
    fromEmailLower.includes('mailer-daemon') ||
    fromEmailLower.includes('postmaster') ||
    fromEmailLower.includes('noreply') ||
    fromEmailLower.includes('no-reply') ||
    fromEmailLower.includes('delivery-status') ||
    fromEmailLower.includes('mail delivery subsystem');

  const isDeliveryFailureSubject =
    subjectLower.includes('delivery status notification') ||
    subjectLower.includes('failure notice') ||
    subjectLower.includes('undeliverable') ||
    subjectLower.includes('returned mail') ||
    subjectLower.includes('address not found') ||
    subjectLower.includes('user unknown');

  const isHardBounceHeader =
    precedence === 'bounce' ||
    precedence === 'bulk' ||
    precedence === 'junk' ||
    (autoSubmitted && autoSubmitted !== 'no');

  const isHardBounceBody =
    bodyText.toLowerCase().includes('550 5.1.1') ||
    bodyText.toLowerCase().includes('recipient address rejected') ||
    bodyText.toLowerCase().includes('user unknown') ||
    bodyText.toLowerCase().includes('no such user') ||
    bodyText.toLowerCase().includes('does not exist');

  if (isDaemonOrBounceAddress || isDeliveryFailureSubject || isHardBounceHeader || isHardBounceBody) {
    return 'HARD_BOUNCE';
  }

  return 'NONE';
}

export function isAutomatedBounceOrDaemon(headers: { name?: string; value?: string }[], fromHeader: string): boolean {
  const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
  const result = classifyAutomatedResponse(headers, fromHeader, subject);
  return result !== 'NONE';
}

export async function runReplySync(): Promise<{ repliesDetected: number }> {
  console.log(`\n======================================================`);
  console.log(`📥 Starting Reply Detection & Sync Worker`);
  console.log(`======================================================\n`);

  // Decision 7: Scan active contacted/replied threads without 72h restriction
  const REPLY_SCAN_BATCH_SIZE = 200;

  const recentSent = await db
    .select({
      id: messages.id,
      leadId: messages.leadId,
      campaignId: messages.campaignId,
      gmailAccountId: messages.gmailAccountId,
      recipientEmail: messages.recipientEmail,
      sentAt: messages.sentAt,
      messageId: messages.messageId,
      threadId: messages.threadId,
    })
    .from(messages)
    .innerJoin(leads, eq(messages.leadId, leads.id))
    .where(
      and(
        eq(messages.sendStatus, 'SENT'),
        isNotNull(messages.threadId),
        inArray(leads.outreachStatus, ['CONTACTED', 'REPLIED'])
      )
    )
    .orderBy(desc(messages.sentAt))
    .limit(REPLY_SCAN_BATCH_SIZE);

  // BUG-26: only create a job row when there's real work to do — prevents
  // thousands of COMPLETED/0-item rows polluting the jobs table on idle runs.
  if (recentSent.length === 0) {
    console.log('ℹ️ No active sent threads to inspect for replies. Skipping job creation.');
    return { repliesDetected: 0 };
  }

  // Real work exists — create the job row now
  const jobId = await jobRunner.createJob('REPLY_SYNC');

  try {

    console.log(`🔍 Monitoring ${recentSent.length} sent outreach threads for creator responses...`);

    let detected = 0;

    // 2. Check if in dry-run or test mode without live Google credentials
    const isDryRunOrTest = env.DRY_RUN || process.env.NODE_ENV === 'test';

    // 3. For each unique active gmailAccountId, initialize OAuth client
    const accountIds = Array.from(
      new Set(
        recentSent
          .map((m) => m.gmailAccountId)
          .filter((id): id is number => id !== null && id !== undefined)
      )
    );

    const accountsMap = new Map<number, typeof gmailAccounts.$inferSelect>();
    if (accountIds.length > 0) {
      try {
        const accounts = await db
          .select()
          .from(gmailAccounts)
          .where(and(inArray(gmailAccounts.id, accountIds), eq(gmailAccounts.status, 'ACTIVE')));

        for (const acc of accounts) {
          accountsMap.set(acc.id, acc);
        }
      } catch (e: any) {
        console.warn('⚠️ [Reply Worker] Could not load Gmail accounts from DB:', e.message);
      }
    }

    if (isDryRunOrTest && (!env.GOOGLE_CLIENT_ID || accountsMap.size === 0)) {
      console.log(`[DRY RUN / TEST] Gracefully monitoring ${recentSent.length} threads in simulation mode.`);
      await jobRunner.completeJob(jobId, 0);
      return { repliesDetected: 0 };
    }

    // 4. Cache OAuth clients per account
    const gmailClientsMap = new Map<number, any>();

    for (const [accId, account] of accountsMap.entries()) {
      if (!account.refreshToken) continue;
      try {
        const oauth2Client = new google.auth.OAuth2(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
          env.GOOGLE_REDIRECT_URI
        );
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
            console.log(`[OAuth] Refreshed and encrypted access token for ${account.email} (reply sync)`);
          } catch (tokErr: any) {
            console.warn(`[OAuth] Token persistence error for ${account.email}:`, tokErr.message);
          }
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        gmailClientsMap.set(accId, { gmail, account });
      } catch (e: any) {
        console.warn(`⚠️ [Reply Worker] Failed to initialize OAuth client for account ${account.email}:`, e.message);
      }
    }

    // 5. Deduplicate thread IDs across recentSent (P3-3)
    const seenThreads = new Set<string>();
    const deduplicatedSent = recentSent.filter((msg) => {
      if (!msg.threadId) return false;
      if (seenThreads.has(msg.threadId)) return false;
      seenThreads.add(msg.threadId);
      return true;
    });

    // 6. Inspect threads for replies
    for (const msg of deduplicatedSent) {
      if (!msg.threadId || !msg.gmailAccountId) continue;

      const clientEntry = gmailClientsMap.get(msg.gmailAccountId);
      if (!clientEntry) continue;

      const { gmail, account } = clientEntry;

      try {
        const threadRes = await gmail.users.threads.get({
          userId: 'me',
          id: msg.threadId,
          format: 'full',
          metadataHeaders: ['From', 'Date', 'Subject', 'Auto-Submitted', 'Precedence', 'X-Autoreply'],
        });

        const threadMessages = threadRes.data.messages || [];
        const outboundTime = msg.sentAt ? new Date(msg.sentAt).getTime() : 0;
        const accountEmailLower = account.email.toLowerCase();

        for (const tm of threadMessages) {
          if (!tm.id) continue;

          const headers = tm.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
          const fromEmailLower = fromHeader.toLowerCase();
          const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';

          // P1-11: Direction Check FIRST! If outbound, ignore completely.
          const isOutbound = fromEmailLower.includes(accountEmailLower);
          if (isOutbound) {
            continue;
          }

          const bodyText = decodeGmailBody(tm.payload);
          const responseType = classifyAutomatedResponse(headers, fromHeader, subjectHeader, bodyText);

          // P1-12: Handle OUT_OF_OFFICE (pause 5 days, no bounce/suppression)
          if (responseType === 'OUT_OF_OFFICE') {
            console.log(`[OOO Handler] Out-of-office detected from ${fromHeader} on lead #${msg.leadId}. Pausing sequence +5 days.`);
            const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            await db
              .update(scheduledEmails)
              .set({
                scheduledAt: fiveDaysLater,
                scheduledDate: gmailSendingService.getPacificDateStr(fiveDaysLater),
                updatedAt: new Date(),
              })
              .where(and(eq(scheduledEmails.leadId, msg.leadId), eq(scheduledEmails.status, 'PENDING')));
            continue;
          }

          // P1-12: Handle SOFT_BOUNCE (retry 48h, no bounce/suppression)
          if (responseType === 'SOFT_BOUNCE') {
            console.log(`[Soft Bounce] Temporary delivery issue for lead #${msg.leadId}. Rescheduling next step +48h.`);
            const fortyEightHoursLater = new Date(Date.now() + 48 * 60 * 60 * 1000);
            await db
              .update(scheduledEmails)
              .set({
                scheduledAt: fortyEightHoursLater,
                scheduledDate: gmailSendingService.getPacificDateStr(fortyEightHoursLater),
                updatedAt: new Date(),
              })
              .where(and(eq(scheduledEmails.leadId, msg.leadId), eq(scheduledEmails.status, 'PENDING')));
            continue;
          }

          // P1-12: Handle HARD_BOUNCE (permanent delivery failure)
          if (responseType === 'HARD_BOUNCE') {
            try {
              const bounceEmail = (msg.recipientEmail || '').toLowerCase().trim();
              if (bounceEmail) {
                await db
                  .insert(suppressions)
                  .values({
                    email: bounceEmail,
                    channelId: null,
                    reason: 'BOUNCED',
                    source: 'REPLY_DETECTOR',
                  })
                  .onConflictDoNothing();

                await db
                  .update(leads)
                  .set({ outreachStatus: 'BOUNCED', suppressionStatus: true, updatedAt: new Date() })
                  .where(eq(leads.id, msg.leadId));

                await db
                  .update(contacts)
                  .set({ emailStatus: 'INVALID', verificationReason: 'Hard bounce detected', updatedAt: new Date() })
                  .where(and(eq(contacts.leadId, msg.leadId), sql`lower(${contacts.email}) = ${bounceEmail}`));

                await db
                  .update(scheduledEmails)
                  .set({ status: 'CANCELLED', error: 'Bounce detected', updatedAt: new Date() })
                  .where(and(eq(scheduledEmails.leadId, msg.leadId), eq(scheduledEmails.status, 'PENDING')));

                await sequenceService.cancelSequenceForLead(msg.leadId, 'CANCELLED_BOUNCED');

                console.log(`[Bounce Handler] Lead #${msg.leadId} (${bounceEmail}) marked BOUNCED and suppressed.`);
                await jobRunner.logEvent(jobId, 'BOUNCE_DETECTED', 'WARN', `Hard bounce for ${bounceEmail} (lead #${msg.leadId}) — suppressed and sequence cancelled.`, { leadId: msg.leadId, email: bounceEmail });
              }
            } catch (bounceErr: any) {
              console.warn(`[Reply Worker] Non-fatal: bounce handling failed for lead #${msg.leadId}:`, bounceErr.message);
            }
            continue;
          }

          // Genuine creator human reply
          const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value;
          const msgTime = Number(tm.internalDate) || (dateHeader ? new Date(dateHeader).getTime() : Date.now());

          if (msgTime > (outboundTime - 5000)) {
            const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader.trim()];
            const senderEmail = emailMatch[1] || msg.recipientEmail;

            const replyRes = await replyDetectorService.processInboundReply({
              threadId: msg.threadId,
              messageId: tm.id,
              senderEmail,
              snippet: tm.snippet || 'Reply received from creator',
              bodyText,
              receivedAt: new Date(msgTime),
              gmailAccountId: account.id,
            });

            if (replyRes.recorded) {
              detected++;
              console.log(`  🎉 [Reply Detected] Inbound from ${senderEmail} on thread ${msg.threadId}`);
              await jobRunner.logEvent(jobId, 'REPLY_DETECTED', 'INFO', `Detected inbound reply from ${senderEmail}`, {
                threadId: msg.threadId,
                messageId: tm.id,
                senderEmail,
              });
            }
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ [Reply Worker] Failed to inspect thread ${msg.threadId}:`, err.message);
      }
    }

    await jobRunner.completeJob(jobId, detected);
    console.log(`\n✅ Reply sync completed: ${detected} new replies detected.`);
    return { repliesDetected: detected };
  } catch (error: any) {
    console.error('[Reply Sync Worker] Error:', error);
    await jobRunner.failJob(jobId, error.message);
    return { repliesDetected: 0 };
  }
}

if (require.main === module) {
  runReplySync()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal reply worker crash:', err);
      process.exit(1);
    });
}
