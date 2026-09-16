import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { leads, contacts, keywords } from "../../../db/schema";
import { eq, desc, lt, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  try {
    const leadRows = await db
      .select({
        id: leads.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        qualificationStatus: leads.qualificationStatus,
        outreachStatus: leads.outreachStatus,
        country: leads.country,
        discoveredAt: leads.discoveredAt,
        sourceKeyword: keywords.keyword,
        category: keywords.category,
      })
      .from(leads)
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .where(lastId > 0 ? lt(leads.id, lastId) : undefined)
      .orderBy(desc(leads.id))
      .limit(limit);

    if (leadRows.length === 0) {
      return NextResponse.json([]);
    }

    const leadIds = leadRows.map((l) => l.id);
    const allContacts = await db
      .select({
        id: contacts.id,
        leadId: contacts.leadId,
        contactType: contacts.contactType,
        value: contacts.value,
        email: contacts.email,
        emailStatus: contacts.emailStatus,
        instagram: contacts.instagram,
        twitter: contacts.twitter,
        tiktok: contacts.tiktok,
        discord: contacts.discord,
        linkedin: contacts.linkedin,
      })
      .from(contacts)
      .where(inArray(contacts.leadId, leadIds));

    // Map contacts to leads
    const contactsByLead = new Map<number, typeof allContacts>();
    for (const c of allContacts) {
      const list = contactsByLead.get(c.leadId) || [];
      list.push(c);
      contactsByLead.set(c.leadId, list);
    }

    const data = leadRows.map((l) => {
      const leadContacts = contactsByLead.get(l.id) || [];
      const allEmailContacts = leadContacts.filter((c) => c.email);
      const primaryEmailContact =
        allEmailContacts.find((c) => c.contactType === "EMAIL") || allEmailContacts[0];
      const additionalEmails = allEmailContacts
        .filter((c) => c.email !== primaryEmailContact?.email)
        .map((c) => c.email as string);

      const socialLinks = leadContacts
        .filter((c) => c.contactType !== "EMAIL" || !c.email)
        .map((c) => ({
          type: c.contactType,
          value: c.value || c.instagram || c.twitter || c.tiktok || c.discord || c.linkedin || "",
        }))
        .filter((s) => Boolean(s.value));

      return {
        ...l,
        email: primaryEmailContact?.email || null,
        emailStatus: primaryEmailContact?.emailStatus || null,
        additionalEmails,
        socialLinks,
      };
    });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}