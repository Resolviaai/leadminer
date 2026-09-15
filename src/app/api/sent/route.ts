import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { messages, leads, campaigns, gmailAccounts } from "../../../db/schema";
import { eq, desc, lt, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const accountId = searchParams.get("accountId");

  try {
    const conditions = [];
    if (lastId > 0) {
      conditions.push(lt(messages.id, lastId));
    }
    if (accountId && !isNaN(parseInt(accountId, 10))) {
      conditions.push(eq(messages.gmailAccountId, parseInt(accountId, 10)));
    }

    const data = await db
      .select({
        id: messages.id,
        recipientEmail: messages.recipientEmail,
        subject: messages.subject,
        body: messages.body,
        sendStatus: messages.sendStatus,
        sentAt: messages.sentAt,
        messageId: messages.messageId,
        threadId: messages.threadId,
        error: messages.error,
        personalizationStatus: messages.personalizationStatus,
        senderEmail: gmailAccounts.email,
        gmailAccountId: messages.gmailAccountId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        campaignName: campaigns.name,
      })
      .from(messages)
      .leftJoin(gmailAccounts, eq(messages.gmailAccountId, gmailAccounts.id))
      .leftJoin(leads, eq(messages.leadId, leads.id))
      .leftJoin(campaigns, eq(messages.campaignId, campaigns.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(messages.id))
      .limit(limit);

    return NextResponse.json(data);
  } catch (e) {
    console.error("[Sent API Error]", e);
    return NextResponse.json([], { status: 500 });
  }
}
