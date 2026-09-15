import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { leads, contacts, keywords } from "../../../db/schema";
import { eq, desc, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  try {
    const data = await db
      .select({
        id: leads.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        qualificationStatus: leads.qualificationStatus,
        outreachStatus: leads.outreachStatus,
        discoveredAt: leads.discoveredAt,
        email: contacts.email,
        emailStatus: contacts.emailStatus,
        sourceKeyword: keywords.keyword,
        category: keywords.category,
      })
      .from(leads)
      .leftJoin(contacts, eq(leads.id, contacts.leadId))
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .where(lastId > 0 ? lt(leads.id, lastId) : undefined)
      .orderBy(desc(leads.id))
      .limit(limit);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}