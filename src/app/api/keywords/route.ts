import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { keywords } from "../../../db/schema";
import { desc, asc, lt, gte, gt, and, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const statusFilter = searchParams.get("status");
  const searchQuery = searchParams.get("search")?.trim();
  const sortBy = searchParams.get("sortBy") || "id";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const minChannels = parseInt(searchParams.get("minChannels") ?? "0", 10);
  const categoryFilter = searchParams.get("category");
  const unexecutedOnly = searchParams.get("unexecutedOnly") === "true";
  const hasQualified = searchParams.get("hasQualified") === "true";
  const hasEmails = searchParams.get("hasEmails") === "true";
  const categoriesOnly = searchParams.get("categoriesOnly") === "true";

  try {
    if (categoriesOnly) {
      const distinctCats = await db
        .selectDistinct({ category: keywords.category })
        .from(keywords)
        .orderBy(asc(keywords.category));
      return NextResponse.json(distinctCats.map((c) => c.category).filter(Boolean));
    }

    const conditions = [];

    if (sortBy === "id" && sortDir === "desc" && lastId > 0 && offset === 0) {
      conditions.push(lt(keywords.id, lastId));
    }

    if (statusFilter && statusFilter !== "ALL") {
      conditions.push(eq(keywords.status, statusFilter as any));
    }

    if (minChannels > 0) {
      conditions.push(gte(keywords.channelsFound, minChannels));
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      conditions.push(eq(keywords.category, categoryFilter));
    }

    if (unexecutedOnly) {
      conditions.push(eq(keywords.attemptCount, 0));
    }

    if (hasQualified) {
      conditions.push(gt(keywords.qualifiedLeadsFound, 0));
    }

    if (hasEmails) {
      conditions.push(gt(keywords.emailsFound, 0));
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

    let orderExpr;
    switch (sortBy) {
      case "channels":
        orderExpr = sortDir === "asc" ? asc(keywords.channelsFound) : desc(keywords.channelsFound);
        break;
      case "priority":
        orderExpr = sortDir === "asc" ? asc(keywords.priorityScore) : desc(keywords.priorityScore);
        break;
      case "keyword":
        orderExpr = sortDir === "asc" ? asc(keywords.keyword) : desc(keywords.keyword);
        break;
      case "attempts":
        orderExpr = sortDir === "asc" ? asc(keywords.attemptCount) : desc(keywords.attemptCount);
        break;
      case "lastAttempt":
        orderExpr = sortDir === "asc" ? asc(keywords.lastAttemptAt) : desc(keywords.lastAttemptAt);
        break;
      case "category":
        orderExpr = sortDir === "asc" ? asc(keywords.category) : desc(keywords.category);
        break;
      default:
        orderExpr = sortDir === "asc" ? asc(keywords.id) : desc(keywords.id);
        break;
    }

    let query = db
      .select()
      .from(keywords)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderExpr)
      .limit(limit);

    if (offset > 0) {
      query = query.offset(offset) as any;
    }

    const data = await query;
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