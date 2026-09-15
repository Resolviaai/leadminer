import React from "react";
import { db } from "../../db/client";
import { jobs } from "../../db/schema";
import { desc, sql } from "drizzle-orm";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JobsInfiniteList } from "@/components/jobs/JobsInfiniteList";

export const dynamic = "force-dynamic";

async function getData() {
  const [list, [{ total }]] = await Promise.all([
    db.select().from(jobs).orderBy(desc(jobs.id)).limit(50),
    db.select({ total: sql<number>`count(*)::int` }).from(jobs),
  ]);
  return { list, total: total ?? 0 };
}

export default async function JobsPage() {
  const { list, total } = await getData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            Background Worker Jobs
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          {total.toLocaleString()} job runs — execution telemetry, progress checkpoints, and heartbeat tracking across discovery, verification, and outreach workers.
        </p>
      </Card>

      <JobsInfiniteList initialData={list} total={total} />
    </div>
  );
}