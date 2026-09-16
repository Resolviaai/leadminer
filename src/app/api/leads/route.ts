import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { leads, contacts, keywords } from "../../../db/schema";
import { eq, desc, lt, inArray, and, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const filter = searchParams.get("filter") || "ALL";
  const search = searchParams.get("search")?.trim();

  try {
    const conditions = [];

    if (lastId > 0) {
      conditions.push(lt(leads.id, lastId));
    }

    if (filter === "CONTACTED") {
      conditions.push(eq(leads.outreachStatus, "CONTACTED"));
    }

    if (search) {
      conditions.push(
        or(
          ilike(leads.channelTitle, `%${search}%`),
          ilike(leads.channelUrl, `%${search}%`)
        )
      );
    }

    const leadRows = await db
      .select({
        id: leads.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        qualificationStatus: leads.qualificationStatus,
        outreachStatus: leads.outreachStatus,
        suppressionStatus: leads.suppressionStatus,
        website: leads.website,
        phone: leads.phone,
        contactPageUrl: leads.contactPageUrl,
        country: leads.country,
        discoveredAt: leads.discoveredAt,
        sourceKeyword: keywords.keyword,
        category: keywords.category,
      })
      .from(leads)
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
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
        normalizedValue: contacts.normalizedValue,
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

    let data = leadRows.map((l) => {
      const leadContacts = contactsByLead.get(l.id) || [];
      const allEmailContacts = leadContacts.filter((c) => c.email || c.contactType === "EMAIL");
      const primaryEmailContact =
        allEmailContacts.find((c) => c.contactType === "EMAIL" && c.email) || allEmailContacts[0];
      const additionalEmails = allEmailContacts
        .filter((c) => c.email && c.email !== primaryEmailContact?.email)
        .map((c) => c.email as string);

      const socialLinks = leadContacts
        .filter((c) => c.contactType !== "EMAIL" && c.contactType !== "PHONE" && c.contactType !== "WHATSAPP")
        .map((c) => ({
          type: c.contactType,
          value: c.value || c.instagram || c.twitter || c.tiktok || c.discord || c.linkedin || "",
        }))
        .filter((s) => Boolean(s.value));

      const phoneContact = leadContacts.find((c) => c.contactType === "PHONE" || c.contactType === "WHATSAPP");

      return {
        ...l,
        email: primaryEmailContact?.email || null,
        emailStatus: primaryEmailContact?.emailStatus || null,
        phone: l.phone || phoneContact?.value || null,
        additionalEmails,
        socialLinks,
      };
    });

    // Apply in-memory contact-specific filters
    if (filter === "EMAIL_FOUND") {
      data = data.filter((d) => Boolean(d.email));
    } else if (filter === "NO_EMAIL") {
      data = data.filter((d) => !d.email);
    } else if (filter === "VERIFIED") {
      data = data.filter((d) => d.emailStatus === "VALID" || d.emailStatus === "DOMAIN_VALID" || d.emailStatus === "MAILBOX_VERIFIED");
    } else if (filter === "FAILED") {
      data = data.filter((d) => d.emailStatus === "INVALID" || d.emailStatus === "FAILED" || d.emailStatus === "DISPOSABLE");
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("GET /api/leads error:", e);
    return NextResponse.json([], { status: 500 });
  }
}