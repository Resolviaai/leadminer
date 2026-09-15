import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { replies, leads, campaigns } from "../../../db/schema";
import { eq, desc, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  try {
    const data = await db
      .select({
        id: replies.id,
        threadId: replies.threadId,
        messageId: replies.messageId,
        senderEmail: replies.senderEmail,
        snippet: replies.snippet,
        receivedAt: replies.receivedAt,
        processed: replies.processed,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        campaignName: campaigns.name,
      })
      .from(replies)
      .leftJoin(leads, eq(replies.leadId, leads.id))
      .leftJoin(campaigns, eq(leads.id, campaigns.id))
      .where(lastId > 0 ? lt(replies.id, lastId) : undefined)
      .orderBy(desc(replies.id))
      .limit(limit);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}