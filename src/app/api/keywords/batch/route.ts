import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/client";
import { keywords } from "../../../../db/schema";
import { inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as "retry" | "pause" | "resume" | "delete";
    const ids = (body.ids || []).map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));

    if (!ids.length) {
      return NextResponse.json({ error: "No valid keyword IDs provided" }, { status: 400 });
    }

    if (action === "retry") {
      const updated = await db
        .update(keywords)
        .set({
          status: "PENDING",
          attemptCount: 0,
          lastError: null,
          updatedAt: new Date(),
        })
        .where(inArray(keywords.id, ids))
        .returning();

      return NextResponse.json({ success: true, count: updated.length, updated });
    }

    if (action === "pause") {
      const updated = await db
        .update(keywords)
        .set({
          status: "PAUSED",
          updatedAt: new Date(),
        })
        .where(inArray(keywords.id, ids))
        .returning();

      return NextResponse.json({ success: true, count: updated.length, updated });
    }

    if (action === "resume") {
      const updated = await db
        .update(keywords)
        .set({
          status: "PENDING",
          updatedAt: new Date(),
        })
        .where(inArray(keywords.id, ids))
        .returning();

      return NextResponse.json({ success: true, count: updated.length, updated });
    }

    if (action === "delete") {
      const deleted = await db
        .delete(keywords)
        .where(inArray(keywords.id, ids))
        .returning();

      return NextResponse.json({ success: true, count: deleted.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    console.error("POST /api/keywords/batch error:", e);
    return NextResponse.json({ error: e.message || "Failed batch action" }, { status: 500 });
  }
}
