import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { replies, jobs, logs } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export interface NotificationItem {
  id: string;
  type: "reply" | "job" | "alert" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export async function GET() {
  try {
    const [recentReplies, recentJobs, recentLogs] = await Promise.all([
      db
        .select()
        .from(replies)
        .orderBy(desc(replies.receivedAt))
        .limit(5),
      db
        .select()
        .from(jobs)
        .orderBy(desc(jobs.createdAt))
        .limit(5),
      db
        .select()
        .from(logs)
        .where(eq(logs.level, "ERROR"))
        .orderBy(desc(logs.createdAt))
        .limit(3),
    ]);

    const items: NotificationItem[] = [];

    // Map replies to high-priority notifications
    for (const r of recentReplies) {
      items.push({
        id: `reply-${r.id}`,
        type: "reply",
        title: "Lead Reply Received",
        message: `${r.senderEmail || "A prospect"} replied: "${(r.snippet || "").slice(0, 75)}..."`,
        timestamp: r.receivedAt?.toISOString() || new Date().toISOString(),
        read: r.processed ?? false,
        link: "/replies",
      });
    }

    // Map jobs to notifications
    for (const j of recentJobs) {
      items.push({
        id: `job-${j.id}`,
        type: "job",
        title: `Worker ${j.jobType} ${j.status.toLowerCase()}`,
        message: `Processed ${j.itemsProcessed} items. Status: ${j.status}`,
        timestamp: j.createdAt?.toISOString() || new Date().toISOString(),
        read: true,
        link: "/jobs",
      });
    }

    // Map error logs to alert notifications
    for (const l of recentLogs) {
      items.push({
        id: `log-${l.id}`,
        type: "alert",
        title: `System Alert (${l.level})`,
        message: l.message.slice(0, 100),
        timestamp: l.createdAt?.toISOString() || new Date().toISOString(),
        read: false,
        link: "/logs",
      });
    }

    // Sort descending by timestamp
    items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ notifications: items });
  } catch (e) {
    console.error("[notifications GET]", e);
    return NextResponse.json({ notifications: [] });
  }
}