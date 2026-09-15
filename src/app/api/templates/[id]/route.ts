import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/client";
import { templates, campaigns } from "../../../../db/schema";
import { eq, count } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
  }

  let body: { name?: string; subject?: string; body?: string; isActive?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, subject, body: templateBody, isActive } = body;

  if (subject !== undefined && !subject.trim()) {
    return NextResponse.json({ error: "Subject cannot be empty" }, { status: 400 });
  }
  if (templateBody !== undefined && !templateBody.trim()) {
    return NextResponse.json({ error: "Body cannot be empty" }, { status: 400 });
  }

  try {
    const updated = await db
      .update(templates)
      .set({
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(subject !== undefined ? { subject: subject.trim() } : {}),
        ...(templateBody !== undefined ? { body: templateBody.trim() } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(templates.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template: updated[0] });
  } catch (e) {
    console.error("[templates PATCH]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
  }

  try {
    // Check if any campaigns are using this template (onDelete: restrict in schema)
    const [{ usedBy }] = await db
      .select({ usedBy: count() })
      .from(campaigns)
      .where(eq(campaigns.templateId, id));

    if (usedBy > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${usedBy} campaign(s) are using this template. Remove them first.` },
        { status: 409 }
      );
    }

    const deleted = await db
      .delete(templates)
      .where(eq(templates.id, id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[templates DELETE]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}