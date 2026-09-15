import { google } from 'googleapis';
import { db } from '../db/client';
import { gmailAccounts, messages, replies } from '../db/schema';
import { eq, and, isNotNull, inArray, desc } from 'drizzle-orm';
import { env } from '../config/env';
import { replyDetectorService } from '../services/replies/reply.detector';
import { jobRunner } from '../services/jobs/job.runner';

export async function runReplySync(): Promise<{ repliesDetected: number }> {
  console.log(`\n======================================================`);
  console.log(`📥 Starting Reply Detection & Sync Worker`);
  console.log(`======================================================\n`);

  const jobId = await jobRunner.createJob('REPLY_SYNC');

  try {
    // 1. Fetch recent sent messages from messages where send_status = 'SENT' and thread_id is present
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
      .where(and(eq(messages.sendStatus, 'SENT'), isNotNull(messages.threadId)))
      .orderBy(desc(messages.sentAt))
      .limit(50);

    if (recentSent.length === 0) {
      console.log('ℹ️ No active sent threads to inspect for replies.');
      await jobRunner.completeJob(jobId, 0);
      return { repliesDetected: 0 };
    }

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
        oauth2Client.setCredentials({
          refresh_token: account.refreshToken,
          access_token: account.accessToken || undefined,
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
          format: 'metadata',
          metadataHeaders: ['From', 'Date', 'Subject'],
        });

        const threadMessages = threadRes.data.messages || [];
        const outboundTime = msg.sentAt ? new Date(msg.sentAt).getTime() : 0;
        const accountEmailLower = account.email.toLowerCase();

        for (const tm of threadMessages) {
          if (!tm.id) continue;

          const headers = tm.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
          const fromEmailLower = fromHeader.toLowerCase();

          // Inspect messages in thread: find any message with from != account.email and timestamp after outbound sent timestamp
          const isOutbound = fromEmailLower.includes(accountEmailLower);
          const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value;
          const msgTime = Number(tm.internalDate) || (dateHeader ? new Date(dateHeader).getTime() : Date.now());

          if (!isOutbound && msgTime > outboundTime) {
            // Extract clean sender email
            const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader.trim()];
            const senderEmail = emailMatch[1] || msg.recipientEmail;

            // Call replyDetectorService.processInboundReply
            const replyRes = await replyDetectorService.processInboundReply({
              threadId: msg.threadId,
              messageId: tm.id,
              senderEmail,
              snippet: tm.snippet || 'Reply received from creator',
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
