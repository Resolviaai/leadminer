import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/client";
import { keywords } from "../../../../db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updateData: Partial<typeof keywords.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.keyword) {
      updateData.keyword = body.keyword.trim();
      updateData.normalizedKeyword = body.keyword.trim().toLowerCase();
    }
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.entity !== undefined) updateData.entity = body.entity.trim();
    if (body.modifier !== undefined) updateData.modifier = body.modifier.trim();
    if (typeof body.priorityScore === "number") updateData.priorityScore = body.priorityScore;

    const [updated] = await db
      .update(keywords)
      .set(updateData)
      .where(eq(keywords.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PUT /api/keywords/[id] error:", e);
    return NextResponse.json({ error: e.message || "Failed to update keyword" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(keywords)
      .where(eq(keywords.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    console.error("DELETE /api/keywords/[id] error:", e);
    return NextResponse.json({ error: e.message || "Failed to delete keyword" }, { status: 500 });
  }
}
