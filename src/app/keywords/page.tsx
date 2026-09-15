import React from "react";
import { db } from "../../db/client";
import { keywords } from "../../db/schema";
import { desc, sql } from "drizzle-orm";
import { Layers, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeywordsInfiniteList } from "@/components/keywords/KeywordsInfiniteList";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [listResult, countResult] = await Promise.all([
      db
        .select()
        .from(keywords)
        .orderBy(desc(keywords.id))
        .limit(50),
      db
        .select({
          total: sql<number>`count(*)::int`,
          pending: sql<number>`count(*) filter (where status = 'PENDING')::int`,
          completed: sql<number>`count(*) filter (where status = 'COMPLETED')::int`,
          failed: sql<number>`count(*) filter (where status = 'FAILED')::int`,
        })
        .from(keywords),
    ]);

    const counts = countResult?.[0] || {
      total: 0,
      pending: 0,
      completed: 0,
      failed: 0,
    };

    return { list: listResult || [], counts };
  } catch (err) {
    console.error("[KeywordsPage Error]", err);
    return {
      list: [],
      counts: { total: 0, pending: 0, completed: 0, failed: 0 },
    };
  }
}

export default async function KeywordsPage() {
  const { list, counts } = await getData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Keyword Taxonomy
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {counts.total.toLocaleString()} unique normalized search terms
          </p>
        </div>
        <form action="/api/workers/discovery" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Next Batch (10)</span>
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <span className="text-[11px] text-text-muted block">Total Corpus</span>
          <span className="text-lg font-bold text-text-main font-mono">{counts.total.toLocaleString()}</span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-warning block">Pending Queue</span>
          <span className="text-lg font-bold text-warning font-mono">{counts.pending.toLocaleString()}</span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-primary block">Completed</span>
          <span className="text-lg font-bold text-primary font-mono">{counts.completed.toLocaleString()}</span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-danger block">Failed / Retry</span>
          <span className="text-lg font-bold text-danger font-mono">{counts.failed.toLocaleString()}</span>
        </Card>
      </div>

      <KeywordsInfiniteList initialData={list} total={counts.total} />
    </div>
  );
}