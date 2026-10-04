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
  headers: { name?: string | null; value?: string | null }[],
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

export function isAutomatedBounceOrDaemon(headers: { name?: string | null; value?: string | null }[], fromHeader: string): boolean {
  const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
  const result = classifyAutomatedResponse(headers, fromHeader, subject);
  return result !== 'NONE';
}

export async function runReplySync(): Promise<{ repliesDetected: number }> {
  console.log(`\n======================================================`);
  console.log(`📥 Starting Reply Detection & Sync Worker (Incremental History)`);
  console.log(`======================================================\n`);

  // Query active sent outreach threads to build a lookup for match detection
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
    );

  if (recentSent.length === 0) {
    console.log('ℹ️ No active sent threads to inspect for replies. Skipping job creation.');
    return { repliesDetected: 0 };
  }

  // Build thread lookup map
  const threadMap = new Map<string, typeof recentSent[0]>();
  for (const m of recentSent) {
    if (m.threadId && !threadMap.has(m.threadId)) {
      threadMap.set(m.threadId, m);
    }
  }

  const isDryRunOrTest = env.DRY_RUN || process.env.NODE_ENV === 'test';

  // Query active Gmail accounts
  const accounts = await db
    .select()
    .from(gmailAccounts)
    .where(eq(gmailAccounts.status, 'ACTIVE'));

  if (accounts.length === 0) {
    console.log('ℹ️ No active Gmail accounts for reply sync.');
    return { repliesDetected: 0 };
  }

  if (isDryRunOrTest && !env.GOOGLE_CLIENT_ID) {
    console.log(`[DRY RUN / TEST] Gracefully monitoring ${recentSent.length} threads in simulation mode.`);
    return { repliesDetected: 0 };
  }

  const jobId = await jobRunner.createJob('REPLY_SYNC');
  let detected = 0;

  try {
    for (const account of accounts) {
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

        // Persist refreshed tokens
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
          } catch (tokErr: any) {
            console.warn(`[OAuth] Token persistence error for ${account.email}:`, tokErr.message);
          }
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        let latestHistoryId: string | null = account.lastHistoryId || null;
        let candidateMessages: { id: string; threadId?: string }[] = [];
        let historySuccess = false;

        // Fast incremental history sync if startHistoryId exists (Bugs #12 & #13)
        if (account.lastHistoryId) {
          try {
            const histRes = await gmail.users.history.list({
              userId: 'me',
              startHistoryId: account.lastHistoryId,
              historyTypes: ['messageAdded'],
            });

            latestHistoryId = histRes.data.historyId || latestHistoryId;
            const historyItems = histRes.data.history || [];
            for (const h of historyItems) {
              for (const mAdded of h.messagesAdded || []) {
                if (mAdded.message?.id) {
                  candidateMessages.push({
                    id: mAdded.message.id,
                    threadId: mAdded.message.threadId || undefined,
                  });
                }
              }
            }
            historySuccess = true;
          } catch (histErr: any) {
            const isStale =
              histErr?.code === 404 ||
              histErr?.status === 404 ||
              (histErr?.message && histErr.message.includes('History id'));
            if (!isStale) {
              console.warn(`[Reply Worker] History sync error for ${account.email}:`, histErr.message);
            }
          }
        }

        // Fallback: If no lastHistoryId or history expired (404), fetch current historyId and recent inbox messages
        if (!historySuccess) {
          try {
            const profile = await gmail.users.getProfile({ userId: 'me' });
            latestHistoryId = profile.data.historyId || null;

            const listRes = await gmail.users.messages.list({
              userId: 'me',
              q: 'is:inbox',
              maxResults: 50,
            });
            candidateMessages = (listRes.data.messages || []).map((m) => ({
              id: m.id!,
              threadId: m.threadId || undefined,
            }));
          } catch (fbErr: any) {
            console.warn(`[Reply Worker] Fallback message fetch error for ${account.email}:`, fbErr.message);
          }
        }

        // Process candidate messages
        const seenMsgIds = new Set<string>();
        for (const cand of candidateMessages) {
          if (!cand.id || seenMsgIds.has(cand.id)) continue;
          seenMsgIds.add(cand.id);

          // If threadId is known beforehand and is not in our outreach threads, skip without network call
          if (cand.threadId && !threadMap.has(cand.threadId)) {
            continue;
          }

          try {
            const msgRes = await gmail.users.messages.get({
              userId: 'me',
              id: cand.id,
              format: 'full',
              metadataHeaders: ['From', 'Date', 'Subject', 'Auto-Submitted', 'Precedence', 'X-Autoreply'],
            });

            const threadId = msgRes.data.threadId;
            if (!threadId || !threadMap.has(threadId)) {
              continue; // Not one of our active outreach threads
            }

            const matchedSent = threadMap.get(threadId)!;
            const headers = msgRes.data.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
            const fromEmailLower = fromHeader.toLowerCase();
            const accountEmailLower = account.email.toLowerCase();

            // Direction Check: If sent from our own sending account, ignore
            const isOutbound = fromEmailLower.includes(accountEmailLower);
            if (isOutbound) {
              continue;
            }

            const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
            const bodyText = decodeGmailBody(msgRes.data.payload);
            const responseType = classifyAutomatedResponse(headers, fromHeader, subjectHeader, bodyText);

            // Handle OUT_OF_OFFICE (pause 5 days)
            if (responseType === 'OUT_OF_OFFICE') {
              console.log(`[OOO Handler] Out-of-office detected from ${fromHeader} on lead #${matchedSent.leadId}. Pausing sequence +5 days.`);
              const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
              await db
                .update(scheduledEmails)
                .set({
                  scheduledAt: fiveDaysLater,
                  scheduledDate: gmailSendingService.getPacificDateStr(fiveDaysLater),
                  updatedAt: new Date(),
                })
                .where(and(eq(scheduledEmails.leadId, matchedSent.leadId), eq(scheduledEmails.status, 'PENDING')));
              continue;
            }

            // Handle SOFT_BOUNCE (retry 48h)
            if (responseType === 'SOFT_BOUNCE') {
              console.log(`[Soft Bounce] Temporary delivery issue for lead #${matchedSent.leadId}. Rescheduling next step +48h.`);
              const fortyEightHoursLater = new Date(Date.now() + 48 * 60 * 60 * 1000);
              await db
                .update(scheduledEmails)
                .set({
                  scheduledAt: fortyEightHoursLater,
                  scheduledDate: gmailSendingService.getPacificDateStr(fortyEightHoursLater),
                  updatedAt: new Date(),
                })
                .where(and(eq(scheduledEmails.leadId, matchedSent.leadId), eq(scheduledEmails.status, 'PENDING')));
              continue;
            }

            // Handle HARD_BOUNCE (permanent delivery failure)
            if (responseType === 'HARD_BOUNCE') {
              try {
                const bounceEmail = (matchedSent.recipientEmail || '').toLowerCase().trim();
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
                    .where(eq(leads.id, matchedSent.leadId));

                  await db
                    .update(contacts)
                    .set({ emailStatus: 'INVALID', verificationReason: 'Hard bounce detected', updatedAt: new Date() })
                    .where(and(eq(contacts.leadId, matchedSent.leadId), sql`lower(${contacts.email}) = ${bounceEmail}`));

                  await db
                    .update(scheduledEmails)
                    .set({ status: 'CANCELLED', error: 'Bounce detected', updatedAt: new Date() })
                    .where(and(eq(scheduledEmails.leadId, matchedSent.leadId), eq(scheduledEmails.status, 'PENDING')));

                  await sequenceService.cancelSequenceForLead(matchedSent.leadId, 'CANCELLED_BOUNCED');

                  console.log(`[Bounce Handler] Lead #${matchedSent.leadId} (${bounceEmail}) marked BOUNCED and suppressed.`);
                  await jobRunner.logEvent(jobId, 'BOUNCE_DETECTED', 'WARN', `Hard bounce for ${bounceEmail} (lead #${matchedSent.leadId})`, { leadId: matchedSent.leadId, email: bounceEmail });
                }
              } catch (bounceErr: any) {
                console.warn(`[Reply Worker] Bounce handling error for lead #${matchedSent.leadId}:`, bounceErr.message);
              }
              continue;
            }

            // Genuine creator human reply (Bug #14: Direction + thread match, no fragile timestamp filter)
            const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value;
            const msgTime = Number(msgRes.data.internalDate) || (dateHeader ? new Date(dateHeader).getTime() : Date.now());
            const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader.trim()];
            const senderEmail = emailMatch[1] || matchedSent.recipientEmail;

            const replyRes = await replyDetectorService.processInboundReply({
              threadId: threadId,
              messageId: cand.id,
              senderEmail,
              snippet: msgRes.data.snippet || 'Reply received from creator',
              bodyText,
              receivedAt: new Date(msgTime),
              gmailAccountId: account.id,
            });

            if (replyRes.recorded) {
              detected++;
              console.log(`  🎉 [Reply Detected] Inbound from ${senderEmail} on thread ${threadId}`);
              await jobRunner.logEvent(jobId, 'REPLY_DETECTED', 'INFO', `Detected inbound reply from ${senderEmail}`, {
                threadId: threadId,
                messageId: cand.id,
                senderEmail,
              });
            }
          } catch (msgErr: any) {
            console.warn(`[Reply Worker] Failed processing message ${cand.id}:`, msgErr.message);
          }
        }

        // Persist updated historyId for fast incremental sync on next invocation
        if (latestHistoryId && latestHistoryId !== account.lastHistoryId) {
          await db
            .update(gmailAccounts)
            .set({ lastHistoryId: latestHistoryId, updatedAt: new Date() })
            .where(eq(gmailAccounts.id, account.id));
        }
      } catch (accErr: any) {
        console.warn(`⚠️ [Reply Worker] Failed syncing replies for account ${account.email}:`, accErr.message);
      }
    }

    await jobRunner.completeJob(jobId, detected);
    console.log(`\n✅ Reply sync completed: ${detected} new replies detected.`);
    return { repliesDetected: detected };
  } catch (error: any) {
    console.error('[Reply Sync Worker] Fatal error:', error);
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
