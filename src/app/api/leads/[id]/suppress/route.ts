import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db/client";
import { leads } from "../../../../../db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const leadId = parseInt(params.id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
  }

  try {
    const [lead] = await db
      .select({ id: leads.id, suppressionStatus: leads.suppressionStatus })
      .from(leads)
      .where(eq(leads.id, leadId));

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const nextSuppression = !lead.suppressionStatus;

    const [updated] = await db
      .update(leads)
      .set({
        suppressionStatus: nextSuppression,
        qualificationStatus: nextSuppression ? "DISQUALIFIED" : "UNQUALIFIED",
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))
      .returning();

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("POST /api/leads/[id]/suppress error:", e);
    return NextResponse.json({ error: e.message || "Failed to toggle lead suppression" }, { status: 500 });
  }
}
