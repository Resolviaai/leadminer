import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { jobs } from "../../../db/schema";
import { desc, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawLastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const lastId = isNaN(rawLastId) ? 0 : Math.max(0, rawLastId);
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = isNaN(rawLimit) ? 50 : Math.max(1, Math.min(100, rawLimit));
  try {
    const data = await db
      .select()
      .from(jobs)
      .where(lastId > 0 ? lt(jobs.id, lastId) : undefined)
      .orderBy(desc(jobs.id))
      .limit(limit);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}