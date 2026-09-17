import React from "react";
import { db } from "../../db/client";
import { replies, leads, campaigns } from "../../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RepliesInfiniteList } from "@/components/replies/RepliesInfiniteList";

export const revalidate = 5;

async function getData() {
  try {
    const [listResult, countResult] = await Promise.all([
      db
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
        .leftJoin(campaigns, eq(replies.leadId, campaigns.id))
        .orderBy(desc(replies.id))
        .limit(50),
      db.select({ total: sql<number>`count(*)::int` }).from(replies),
    ]);

    const total = countResult?.[0]?.total ?? 0;
    return { list: listResult || [], total };
  } catch (err) {
    console.error("[RepliesPage Error]", err);
    return { list: [], total: 0 };
  }
}

export default async function RepliesPage() {
  const { list, total } = await getData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            Creator Replies
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          {total.toLocaleString()} responses received from creators you emailed.
        </p>
      </Card>

      <RepliesInfiniteList initialData={list} total={total} />
    </div>
  );
}