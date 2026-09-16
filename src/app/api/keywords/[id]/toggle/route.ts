import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db/client";
import { keywords } from "../../../../../db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select({ id: keywords.id, status: keywords.status })
      .from(keywords)
      .where(eq(keywords.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    const nextStatus = existing.status === "PAUSED" ? "PENDING" : "PAUSED";

    const [updated] = await db
      .update(keywords)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(keywords.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("POST /api/keywords/[id]/toggle error:", e);
    return NextResponse.json({ error: e.message || "Failed to toggle keyword" }, { status: 500 });
  }
}
