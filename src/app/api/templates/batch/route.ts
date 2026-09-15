import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/client";
import { templates, campaigns } from "../../../../db/schema";
import { inArray, notInArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let body: { action?: "activate" | "deactivate" | "delete"; ids?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, ids } = body;

  if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "action and non-empty ids array are required" },
      { status: 400 }
    );
  }

  // Filter valid numeric ids
  const validIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
  if (validIds.length === 0) {
    return NextResponse.json({ error: "No valid IDs provided" }, { status: 400 });
  }

  try {
    if (action === "activate") {
      await db
        .update(templates)
        .set({ isActive: true, updatedAt: new Date() })
        .where(inArray(templates.id, validIds));
      return NextResponse.json({ ok: true, count: validIds.length });
    }

    if (action === "deactivate") {
      await db
        .update(templates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(inArray(templates.id, validIds));
      return NextResponse.json({ ok: true, count: validIds.length });
    }

    if (action === "delete") {
      // Find templates currently tied to a campaign
      const activeCampaigns = await db
        .select({ templateId: campaigns.templateId })
        .from(campaigns)
        .where(inArray(campaigns.templateId, validIds));

      const blockedIds = new Set(
        activeCampaigns
          .map((c) => c.templateId)
          .filter((id): id is number => id !== null && id !== undefined)
      );

      const deletableIds = validIds.filter((id) => !blockedIds.has(id));

      if (deletableIds.length > 0) {
        await db.delete(templates).where(inArray(templates.id, deletableIds));
      }

      return NextResponse.json({
        ok: true,
        deletedCount: deletableIds.length,
        blockedCount: blockedIds.size,
        blockedIds: Array.from(blockedIds),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[templates batch POST]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}