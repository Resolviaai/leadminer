import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { keywords } from "../../../db/schema";
import { desc, lt, and, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const statusFilter = searchParams.get("status");
  const searchQuery = searchParams.get("search")?.trim();

  try {
    const conditions = [];

    if (lastId > 0) {
      conditions.push(lt(keywords.id, lastId));
    }

    if (statusFilter && statusFilter !== "ALL") {
      conditions.push(eq(keywords.status, statusFilter as any));
    }

    if (searchQuery) {
      conditions.push(
        or(
          ilike(keywords.keyword, `%${searchQuery}%`),
          ilike(keywords.category, `%${searchQuery}%`),
          ilike(keywords.entity, `%${searchQuery}%`)
        )
      );
    }

    const data = await db
      .select()
      .from(keywords)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(keywords.id))
      .limit(limit);

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("GET /api/keywords error:", e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawKeyword = body.keyword?.trim();
    if (!rawKeyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const normalizedKeyword = rawKeyword.toLowerCase().trim();
    const category = body.category?.trim() || "General";
    const entity = body.entity?.trim() || rawKeyword;
    const modifier = body.modifier?.trim() || "";
    const priorityScore = typeof body.priorityScore === "number" ? body.priorityScore : 50;

    const [inserted] = await db
      .insert(keywords)
      .values({
        keyword: rawKeyword,
        normalizedKeyword,
        category,
        entity,
        modifier,
        priorityScore,
        status: "PENDING",
        attemptCount: 0,
      })
      .onConflictDoUpdate({
        target: keywords.normalizedKeyword,
        set: {
          category,
          entity,
          modifier,
          priorityScore,
          status: "PENDING",
          attemptCount: 0,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/keywords error:", e);
    return NextResponse.json({ error: e.message || "Failed to create keyword" }, { status: 500 });
  }
}