import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/client";
import { templates } from "../../../../db/schema";
import { eq } from "drizzle-orm";

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