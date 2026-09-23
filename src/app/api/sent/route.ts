import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { messages, leads, campaigns, gmailAccounts } from "../../../db/schema";
import { eq, desc, lt, and, ilike, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage);
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = isNaN(rawLimit) ? 50 : Math.max(1, Math.min(100, rawLimit));
  const rawOffset = searchParams.has("offset")
    ? parseInt(searchParams.get("offset")!, 10)
    : (page - 1) * limit;
  const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
  const rawLastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const lastId = isNaN(rawLastId) ? 0 : Math.max(0, rawLastId);
  const accountId = searchParams.get("accountId");
  const q = searchParams.get("q")?.trim();
  const isPaginated = searchParams.get("paginated") === "true" || searchParams.has("page");

  try {
    const conditions = [];
    if (!isPaginated && lastId > 0) {
      conditions.push(lt(messages.id, lastId));
    }
    if (accountId && accountId !== "ALL" && !isNaN(parseInt(accountId, 10))) {
      conditions.push(eq(messages.gmailAccountId, parseInt(accountId, 10)));
    }
    if (q) {
      conditions.push(
        or(
          ilike(messages.recipientEmail, `%${q}%`),
          ilike(messages.subject, `%${q}%`),
          ilike(leads.channelTitle, `%${q}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
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
        .where(whereClause)
        .orderBy(desc(messages.id))
        .limit(limit)
        .offset(isPaginated ? offset : 0),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .leftJoin(leads, eq(messages.leadId, leads.id))
        .where(whereClause),
    ]);

    if (isPaginated) {
      return NextResponse.json({
        items: data,
        total: countResult[0]?.count ?? 0,
        page,
        pageSize: limit,
      });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[Sent API Error]", e);
    return NextResponse.json(isPaginated ? { items: [], total: 0, page: 1, pageSize: limit } : [], { status: 500 });
  }
}
