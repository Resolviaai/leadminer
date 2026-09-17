import React from "react";
import { db } from "../../db/client";
import { messages, leads, campaigns, gmailAccounts } from "../../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Send, CheckCircle2, Clock, Mail, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SentInfiniteList, SentMessage, InboxOption } from "@/components/sent/SentInfiniteList";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const [listResult, countResult, inboxes] = await Promise.all([
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
        .orderBy(desc(messages.id))
        .limit(50),

      db
        .select({
          total: sql<number>`count(*)::int`,
          sentCount: sql<number>`count(*) filter (where send_status = 'SENT')::int`,
          sentToday: sql<number>`count(*) filter (where send_status = 'SENT' and sent_at >= ${todayUtc})::int`,
          failedCount: sql<number>`count(*) filter (where send_status = 'FAILED')::int`,
        })
        .from(messages),

      db
        .select({
          id: gmailAccounts.id,
          email: gmailAccounts.email,
          status: gmailAccounts.status,
          sentToday: gmailAccounts.sentToday,
          dailyLimit: gmailAccounts.dailyLimit,
        })
        .from(gmailAccounts),
    ]);

    const counts = countResult?.[0] ?? { total: 0, sentCount: 0, sentToday: 0, failedCount: 0 };

    return {
      list: (listResult || []) as SentMessage[],
      counts,
      inboxes: (inboxes || []) as InboxOption[],
    };
  } catch (err) {
    console.error("[SentPage Error]", err);
    return {
      list: [],
      counts: { total: 0, sentCount: 0, sentToday: 0, failedCount: 0 },
      inboxes: [],
    };
  }
}

export default async function SentPage() {
  const { list, counts, inboxes } = await getData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Top Header Card */}
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
                Sent Outreach Mail
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Centralized outbox across all connected Gmail inboxes and outreach campaigns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Connected Inboxes:</span>
            <span className="font-mono font-semibold text-text-main">
              {inboxes.length} active
            </span>
          </div>
        </div>
      </Card>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Card className="p-3 sm:p-3.5 space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] text-text-muted font-medium truncate">Total Messages</span>
            <span className="text-[9px] sm:text-[10px] text-text-muted font-mono shrink-0">All time</span>
          </div>
          <div className="flex items-baseline justify-end">
            <span className="text-lg sm:text-xl font-bold text-text-main font-mono tracking-tight tabular-nums">
              {counts.total.toLocaleString()}
            </span>
          </div>
        </Card>

        <Card className="p-3 sm:p-3.5 space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium truncate">Delivered Sent</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 opacity-80 shrink-0" />
          </div>
          <div className="flex items-baseline justify-end">
            <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono tracking-tight tabular-nums">
              {counts.sentCount.toLocaleString()}
            </span>
          </div>
        </Card>

        <Card className="p-3 sm:p-3.5 space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] text-primary font-medium truncate">Sent Today</span>
            <Clock className="w-3.5 h-3.5 text-primary opacity-80 shrink-0" />
          </div>
          <div className="flex items-baseline justify-end">
            <span className="text-lg sm:text-xl font-bold text-primary font-mono tracking-tight tabular-nums">
              {counts.sentToday.toLocaleString()}
            </span>
          </div>
        </Card>

        <Card className="p-3 sm:p-3.5 space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] text-danger font-medium truncate">Failed / Blocked</span>
            <AlertTriangle className="w-3.5 h-3.5 text-danger opacity-80 shrink-0" />
          </div>
          <div className="flex items-baseline justify-end">
            <span className="text-lg sm:text-xl font-bold text-danger font-mono tracking-tight tabular-nums">
              {counts.failedCount.toLocaleString()}
            </span>
          </div>
        </Card>
      </div>

      {/* Gmail-styled Infinite List */}
      <SentInfiniteList
        initialData={list}
        total={counts.total}
        inboxes={inboxes}
      />
    </div>
  );
}
