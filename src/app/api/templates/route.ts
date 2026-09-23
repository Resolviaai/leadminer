import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { templates } from "../../../db/schema";
import { verifyDashboardAuth } from "../../../lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) return auth.response!;

  let body: { name?: string; subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, subject, body: templateBody } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!subject?.trim()) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  if (!templateBody?.trim()) return NextResponse.json({ error: "Body is required" }, { status: 400 });

  try {
    const [created] = await db
      .insert(templates)
      .values({
        name: name.trim(),
        subject: subject.trim(),
        body: templateBody.trim(),
        isActive: true,
      })
      .returning();

    return NextResponse.json({ template: created }, { status: 201 });
  } catch (e) {
    console.error("[templates POST]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}