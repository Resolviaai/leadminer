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
    const [updated] = await db
      .update(keywords)
      .set({
        status: "PENDING",
        attemptCount: 0,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(keywords.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("POST /api/keywords/[id]/retry error:", e);
    return NextResponse.json({ error: e.message || "Failed to retry keyword" }, { status: 500 });
  }
}
