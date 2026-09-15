import React from "react";
import { db } from "../../db/client";
import { leads, contacts, keywords } from "../../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Users, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadsInfiniteList } from "@/components/leads/LeadsInfiniteList";

export const dynamic = "force-dynamic";

async function getData() {
  const [list, [{ total }]] = await Promise.all([
    db
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
      .orderBy(desc(leads.id))
      .limit(50),
    db.select({ total: sql<number>`count(*)::int` }).from(leads),
  ]);
  return { list, total: total ?? 0 };
}

export default async function LeadsPage() {
  const { list, total } = await getData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Discovered Leads
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {total.toLocaleString()} deduplicated YouTube channels with extracted emails, verification status, and outreach qualification.
          </p>
        </div>
        <form action="/api/workers/verification" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Verify &amp; Qualify Batch</span>
          </Button>
        </form>
      </Card>

      <LeadsInfiniteList initialData={list} total={total} />
    </div>
  );
}