import React from "react";
import { db } from "../../db/client";
import { logs } from "../../db/schema";
import { desc, sql } from "drizzle-orm";
import { Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LogsInfiniteList } from "@/components/logs/LogsInfiniteList";

export const revalidate = 5;

async function getData() {
  try {
    const [listResult, countResult] = await Promise.all([
      db.select().from(logs).orderBy(desc(logs.id)).limit(50),
      db.select({ total: sql<number>`count(*)::int` }).from(logs),
    ]);
    const total = countResult?.[0]?.total ?? 0;
    return { list: listResult || [], total };
  } catch (err) {
    console.error("[LogsPage Error]", err);
    return { list: [], total: 0 };
  }
}

export default async function LogsPage() {
  const { list, total } = await getData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            Activity Logs
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          {total.toLocaleString()} records tracking everything the system has done in the background.
        </p>
      </Card>

      <LogsInfiniteList initialData={list} total={total} />
    </div>
  );
}