import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { replies, leads, campaigns, messages, suppressions } from "../../../db/schema";
import { eq, desc, lt } from "drizzle-orm";
import { verifyDashboardAuth } from "../../../lib/api-auth";
import { sequenceService } from "../../../services/outreach/sequence.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawLastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const lastId = isNaN(rawLastId) ? 0 : Math.max(0, rawLastId);
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = isNaN(rawLimit) ? 50 : Math.max(1, Math.min(100, rawLimit));
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
      .leftJoin(messages, eq(replies.threadId, messages.threadId))
      .leftJoin(campaigns, eq(messages.campaignId, campaigns.id))
      .where(lastId > 0 ? lt(replies.id, lastId) : undefined)
      .orderBy(desc(replies.id))
      .limit(limit);

    // Deduplicate rows if thread has multiple messages
    const seen = new Set<number>();
    const deduplicated = data.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    return NextResponse.json(deduplicated);
  } catch (e: any) {
    console.error("[api/replies GET error]:", e.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const { action, replyId } = body;

    if (!replyId || typeof replyId !== "number") {
      return NextResponse.json({ success: false, error: "Invalid replyId" }, { status: 400 });
    }

    const replyRecords = await db
      .select()
      .from(replies)
      .where(eq(replies.id, replyId))
      .limit(1);

    if (replyRecords.length === 0) {
      return NextResponse.json({ success: false, error: "Reply not found" }, { status: 404 });
    }

    const targetReply = replyRecords[0];

    if (action === "handled" || action === "mark_handled") {
      await db
        .update(replies)
        .set({ processed: true })
        .where(eq(replies.id, replyId));

      return NextResponse.json({ success: true, processed: true });
    }

    if (action === "stop" || action === "stop_emailing") {
      const email = targetReply.senderEmail.toLowerCase().trim();

      // 1. Suppress email
      await db
        .insert(suppressions)
        .values({
          email,
          channelId: null,
          reason: "MANUAL_STOP_FROM_REPLIES",
          source: "DASHBOARD_OPERATOR",
        })
        .onConflictDoNothing();

      // 2. Mark lead as UNSUBSCRIBED and suppressed
      await db
        .update(leads)
        .set({
          outreachStatus: "UNSUBSCRIBED",
          suppressionStatus: true,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, targetReply.leadId));

      // 3. Cancel pending scheduled emails and sequence
      await sequenceService.cancelSequenceForLead(targetReply.leadId, "CANCELLED_OPT_OUT");

      // 4. Mark reply as handled
      await db
        .update(replies)
        .set({ processed: true })
        .where(eq(replies.id, replyId));

      return NextResponse.json({ success: true, stopped: true, processed: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    console.error("[api/replies POST error]:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}