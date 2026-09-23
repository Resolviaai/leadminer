import { db } from '../../db/client';
import { messages, replies, leads, campaigns, gmailAccounts, suppressions, scheduledEmails } from '../../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { telegramService } from '../notifications/telegram.service';
import { env } from '../../config/env';
import { sequenceService } from '../outreach/sequence.service';

export const OPT_OUT_REGEX =
  /\b(stop|unsubscribe|opt[- ]?out|remove\s+me|take\s+me\s+off|please\s+remove|don'?t\s+contact|leave\s+me\s+alone)\b/i;

export interface InboundReplyPayload {
  threadId: string;
  messageId: string;
  senderEmail: string;
  snippet: string;
  bodyText?: string;
  receivedAt: Date;
  gmailAccountId?: number;
}

export function stripQuotedText(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const cleanLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      /^On\s.+wrote:$/i.test(trimmed) ||
      /^>+/i.test(trimmed) ||
      /^-+\s*Original Message\s*-+/i.test(trimmed) ||
      /^-+\s*Forwarded message\s*-+/i.test(trimmed) ||
      /^From:\s/i.test(trimmed) ||
      /^_{10,}/.test(trimmed)
    ) {
      break;
    }
    cleanLines.push(line);
  }
  return cleanLines.join('\n').trim();
}

export class ReplyDetectorService {
  public async processInboundReply(payload: InboundReplyPayload): Promise<{ recorded: boolean; reason?: string }> {
    try {
      // 1. Locate original message by threadId
      const originalMessages = await db
        .select({
          messageId: messages.id,
          leadId: messages.leadId,
          campaignId: messages.campaignId,
          gmailAccountId: messages.gmailAccountId,
          leadTitle: leads.channelTitle,
          leadSubs: leads.subscriberCount,
          leadChannelId: leads.channelId,
          campaignName: campaigns.name,
        })
        .from(messages)
        .leftJoin(leads, eq(messages.leadId, leads.id))
        .leftJoin(campaigns, eq(messages.campaignId, campaigns.id))
        .where(eq(messages.threadId, payload.threadId))
        .limit(1);

      if (originalMessages.length === 0) {
        return { recorded: false, reason: 'No matching outbound message found for thread' };
      }

      const match = originalMessages[0];
      const accountId = payload.gmailAccountId || match.gmailAccountId || 1;

      // 2. Insert into replies table (idempotent via uq_replies_message_id)
      const inserted = await db
        .insert(replies)
        .values({
          leadId: match.leadId,
          gmailAccountId: accountId,
          threadId: payload.threadId,
          messageId: payload.messageId,
          senderEmail: payload.senderEmail,
          snippet: payload.snippet,
          receivedAt: payload.receivedAt,
          processed: true,
          telegramNotified: false,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted.length === 0) {
        return { recorded: false, reason: 'Reply was already processed previously' };
      }

      // 3. Detect unsubscribe / opt-out intent (scan unquoted text only)
      const cleanBody = stripQuotedText(payload.bodyText || '');
      const searchableReplyText = `${payload.snippet}\n${cleanBody}`;
      const isOptOut = OPT_OUT_REGEX.test(searchableReplyText);

      if (isOptOut) {
        // Automatically insert into suppressions table
        const cleanEmail = payload.senderEmail.toLowerCase().trim();
        await db
          .insert(suppressions)
          .values({
            email: cleanEmail,
            channelId: match.leadChannelId || null,
            reason: 'OPT_OUT_REPLY',
            source: 'REPLY_DETECTOR',
          })
          .onConflictDoNothing();

        // Update lead to UNSUBSCRIBED and flag suppressionStatus
        await db
          .update(leads)
          .set({
            outreachStatus: 'UNSUBSCRIBED',
            suppressionStatus: true,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, match.leadId));

        console.log(`🛑 [Opt-Out Detected] Suppressed creator ${cleanEmail} (Lead #${match.leadId})`);
      } else {
        // Regular interested / conversational reply: update lead to REPLIED
        await db
          .update(leads)
          .set({
            outreachStatus: 'REPLIED',
            updatedAt: new Date(),
          })
          .where(eq(leads.id, match.leadId));
      }

      // Automatically cancel any remaining pending scheduled emails for this lead (e.g. secondary contacts)
      await sequenceService.cancelSequenceForLead(match.leadId, isOptOut ? 'CANCELLED_OPT_OUT' : 'CANCELLED_REPLY');

      // 4. Send high-signal Telegram notification with isolated failure protection
      try {
        if (isOptOut) {
          await telegramService.notifyUnsubscribe(
            match.leadTitle || 'Unknown Channel',
            payload.senderEmail,
            `Opt-out snippet: "${payload.snippet.slice(0, 120)}"`
          );
        } else {
          await telegramService.notifyReply({
            channelTitle: match.leadTitle || 'Unknown Channel',
            subscriberCount: match.leadSubs || undefined,
            campaignName: match.campaignName || 'General Campaign',
            senderEmail: payload.senderEmail,
            snippet: payload.snippet,
            threadId: payload.threadId,
            leadId: match.leadId,
          });
        }

        // 5. Update telegram notified flag
        if (inserted.length > 0) {
          await db
            .update(replies)
            .set({ telegramNotified: true })
            .where(eq(replies.id, inserted[0].id));
        }
      } catch (tgErr: any) {
        console.warn(`⚠️ [Reply Detector] Telegram notification error for reply ${inserted[0].id}:`, tgErr.message);
      }

      return { recorded: true };
    } catch (error: any) {
      console.error('[Reply Detector Error]:', error);
      return { recorded: false, reason: error.message };
    }
  }

  // Simulated reply trigger for dry run verification
  public async simulateReplyForLead(leadId: number, replySnippet: string): Promise<boolean> {
    const recentSent = await db
      .select()
      .from(messages)
      .where(and(eq(messages.leadId, leadId), eq(messages.sendStatus, 'SENT')))
      .limit(1);

    if (recentSent.length === 0 || !recentSent[0].threadId) {
      return false;
    }

    const res = await this.processInboundReply({
      threadId: recentSent[0].threadId,
      messageId: `mock_reply_${Date.now()}`,
      senderEmail: recentSent[0].recipientEmail,
      snippet: replySnippet,
      receivedAt: new Date(),
      gmailAccountId: recentSent[0].gmailAccountId || undefined,
    });

    return res.recorded;
  }
}

export const replyDetectorService = new ReplyDetectorService();
