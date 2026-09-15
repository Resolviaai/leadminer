import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { keywords } from "../../../db/schema";
import { desc, lt, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  try {
    const data = await db
      .select()
      .from(keywords)
      .where(lastId > 0 ? lt(keywords.id, lastId) : undefined)
      .orderBy(desc(keywords.id))
      .limit(limit);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}