import { db } from '../../db/client';
import { messages, replies, leads, campaigns, gmailAccounts } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { telegramService } from '../notifications/telegram.service';
import { env } from '../../config/env';

export interface InboundReplyPayload {
  threadId: string;
  messageId: string;
  senderEmail: string;
  snippet: string;
  receivedAt: Date;
  gmailAccountId?: number;
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

      // 3. Update lead outreach status to REPLIED
      await db
        .update(leads)
        .set({
          outreachStatus: 'REPLIED',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, match.leadId));

      // 4. Send high-signal Telegram notification
      await telegramService.notifyReply({
        channelTitle: match.leadTitle || 'Unknown Channel',
        subscriberCount: match.leadSubs || undefined,
        campaignName: match.campaignName || 'General Campaign',
        senderEmail: payload.senderEmail,
        snippet: payload.snippet,
        threadId: payload.threadId,
        leadId: match.leadId,
      });

      // 5. Update telegram notified flag
      await db
        .update(replies)
        .set({ telegramNotified: true })
        .where(eq(replies.id, inserted[0].id));

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
