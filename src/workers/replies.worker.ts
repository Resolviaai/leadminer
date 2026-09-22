import { google } from 'googleapis';
import { db } from '../db/client';
import { gmailAccounts, messages, replies, leads, suppressions, scheduledEmails, contacts } from '../db/schema';
import { eq, and, isNotNull, inArray, desc, gte, sql } from 'drizzle-orm';
import { env } from '../config/env';
import { replyDetectorService } from '../services/replies/reply.detector';
import { jobRunner } from '../services/jobs/job.runner';
import { encryptionService } from '../services/security/encryption.service';
import { sequenceService } from '../services/outreach/sequence.service';

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

export function isAutomatedBounceOrDaemon(headers: { name?: string; value?: string }[], fromHeader: string): boolean {
  const fromEmailLower = (fromHeader || '').toLowerCase();
  const autoSubmitted = headers.find((h: any) => h.name?.toLowerCase() === 'auto-submitted')?.value?.toLowerCase();
  const precedence = headers.find((h: any) => h.name?.toLowerCase() === 'precedence')?.value?.toLowerCase();
  const xAutoreply = headers.find((h: any) => h.name?.toLowerCase() === 'x-autoreply')?.value?.toLowerCase();
  const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value?.toLowerCase() || '';

  const isAutoSubmitted = autoSubmitted && autoSubmitted !== 'no';
  const isBulkOrBounce = precedence === 'bulk' || precedence === 'junk' || precedence === 'bounce';
  const isDaemonOrBounceAddress =
    fromEmailLower.includes('mailer-daemon') ||
    fromEmailLower.includes('postmaster') ||
    fromEmailLower.includes('noreply') ||
    fromEmailLower.includes('no-reply') ||
    fromEmailLower.includes('delivery-status') ||
    fromEmailLower.includes('mail delivery subsystem');
  const isDeliveryFailureSubject =
    subject.includes('delivery status notification') ||
    subject.includes('failure notice') ||
    subject.includes('undeliverable') ||
    subject.includes('returned mail');

  return Boolean(isAutoSubmitted || isBulkOrBounce || xAutoreply || isDaemonOrBounceAddress || isDeliveryFailureSubject);
}

export async function runReplySync(): Promise<{ repliesDetected: number }> {
  console.log(`\n======================================================`);
  console.log(`📥 Starting Reply Detection & Sync Worker`);
  console.log(`======================================================\n`);

  // BUG-09 fix: 72h sliding window, max 200 threads
  const REPLY_SCAN_WINDOW_MS = 72 * 60 * 60 * 1000;
  const REPLY_SCAN_BATCH_SIZE = 200;
  const windowStart = new Date(Date.now() - REPLY_SCAN_WINDOW_MS);

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
        inArray(leads.outreachStatus, ['CONTACTED', 'REPLIED']),
        gte(messages.sentAt, windowStart)
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

    // 5. Inspect threads for replies
    for (const msg of recentSent) {
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

          // Anti-Bounce & Auto-Reply Protection:
          if (isAutomatedBounceOrDaemon(headers, fromHeader)) {
            // BUG-08 fix: active bounce handling — don't just skip, mark lead BOUNCED.
            // Permanent delivery failures must suppress the address and cancel the sequence
            // to prevent continued sends to a known-bad address (Gmail rep damage).
            try {
              const bounceEmail = (msg.recipientEmail || '').toLowerCase().trim();
              if (bounceEmail) {
                // 1. Suppress the email address
                await db
                  .insert(suppressions)
                  .values({
                    email: bounceEmail,
                    channelId: null,
                    reason: 'BOUNCED',
                    source: 'REPLY_DETECTOR',
                  })
                  .onConflictDoNothing();

                // 2. Mark the lead as BOUNCED + suppressed
                await db
                  .update(leads)
                  .set({ outreachStatus: 'BOUNCED', suppressionStatus: true, updatedAt: new Date() })
                  .where(eq(leads.id, msg.leadId));

                await db
                  .update(contacts)
                  .set({ emailStatus: 'INVALID', verificationReason: 'Hard bounce detected', updatedAt: new Date() })
                  .where(and(eq(contacts.leadId, msg.leadId), sql`lower(${contacts.email}) = ${bounceEmail}`));

                // 3. Cancel all pending scheduled emails for this lead
                await db
                  .update(scheduledEmails)
                  .set({ status: 'CANCELLED', error: 'Bounce detected', updatedAt: new Date() })
                  .where(and(eq(scheduledEmails.leadId, msg.leadId), eq(scheduledEmails.status, 'PENDING')));

                await sequenceService.cancelSequenceForLead(msg.leadId, 'CANCELLED_BOUNCED');

                console.log(`[Bounce Handler] Lead #${msg.leadId} (${bounceEmail}) marked BOUNCED and suppressed.`);
                await jobRunner.logEvent(jobId, 'BOUNCE_DETECTED', 'WARN', `Bounce for ${bounceEmail} (lead #${msg.leadId}) — suppressed and sequence cancelled.`, { leadId: msg.leadId, email: bounceEmail });
              }
            } catch (bounceErr: any) {
              console.warn(`[Reply Worker] Non-fatal: bounce handling failed for lead #${msg.leadId}:`, bounceErr.message);
            }
            continue;
          }

          // Inspect messages in thread: find genuine creator reply where from != account.email and timestamp after outbound send
          const isOutbound = fromEmailLower.includes(accountEmailLower);
          const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value;
          const msgTime = Number(tm.internalDate) || (dateHeader ? new Date(dateHeader).getTime() : Date.now());

          // 5-second clock skew buffer to ensure near-instant creator responses or slight server time variations are reliably captured
          if (!isOutbound && msgTime > (outboundTime - 5000)) {
            // Extract clean sender email
            const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader.trim()];
            const senderEmail = emailMatch[1] || msg.recipientEmail;

            // Call replyDetectorService.processInboundReply
            const replyRes = await replyDetectorService.processInboundReply({
              threadId: msg.threadId,
              messageId: tm.id,
              senderEmail,
              snippet: tm.snippet || 'Reply received from creator',
              bodyText: decodeGmailBody(tm.payload),
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
