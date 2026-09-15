import React from "react";
import { db } from "../../db/client";
import { templates } from "../../db/schema";
import { desc } from "drizzle-orm";
import { TemplatesManager } from "@/components/templates/TemplatesManager";

export const dynamic = "force-dynamic";

async function getTemplates() {
  try {
    return await db.select().from(templates).orderBy(desc(templates.id));
  } catch {
    return [];
  }
}

export default async function TemplatesPage() {
  const list = await getTemplates();

  return <TemplatesManager initialTemplates={list} />;
}