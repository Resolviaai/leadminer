import React from "react";
import { db } from "../../db/client";
import { keywords } from "../../db/schema";
import { desc, sql } from "drizzle-orm";
import { Layers, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeywordsInfiniteList } from "@/components/keywords/KeywordsInfiniteList";

export const revalidate = 5;

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
          paused: sql<number>`count(*) filter (where status = 'PAUSED')::int`,
        })
        .from(keywords),
    ]);

    const counts = countResult?.[0] || {
      total: 0,
      pending: 0,
      completed: 0,
      failed: 0,
      paused: 0,
    };

    return { list: listResult || [], counts };
  } catch (err) {
    console.error("[KeywordsPage Error]", err);
    return {
      list: [],
      counts: { total: 0, pending: 0, completed: 0, failed: 0, paused: 0 },
    };
  }
}

export default async function KeywordsPage() {
  const { list, counts } = await getData();

  return (
    <div className="flex flex-col md:h-full flex-1 min-h-0 space-y-3.5 max-w-7xl mx-auto w-full md:overflow-hidden">
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Search Keywords
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {counts.total.toLocaleString()} search queries configured for autonomous discovery
          </p>
        </div>
        <form action="/api/workers/discovery" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto min-h-[44px]">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Find Creators Now</span>
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
        <Card className="p-3.5">
          <span className="text-[11px] text-text-muted block font-medium">Total</span>
          <span className="text-lg font-bold text-text-main font-mono tabular-nums">{counts.total.toLocaleString()}</span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-warning block font-medium">Pending Queue</span>
          <span className="text-lg font-bold text-warning font-mono tabular-nums">{counts.pending.toLocaleString()}</span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-primary block font-medium">Searched</span>
          <span className="text-lg font-bold text-primary font-mono tabular-nums">{counts.completed.toLocaleString()}</span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-text-muted block font-medium">Paused</span>
          <span className="text-lg font-bold text-text-muted font-mono tabular-nums">{counts.paused.toLocaleString()}</span>
        </Card>
        <Card className="p-3.5 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-danger block font-medium">Needs Retry</span>
          <span className="text-lg font-bold text-danger font-mono tabular-nums">{counts.failed.toLocaleString()}</span>
        </Card>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <KeywordsInfiniteList initialData={list} total={counts.total} />
      </div>
    </div>
  );
}