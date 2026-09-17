import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { leads, contacts, keywords } from "../../../db/schema";
import { eq, desc, asc, lt, gte, inArray, notInArray, and, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const filter = searchParams.get("filter") || "ALL";
  const search = searchParams.get("search")?.trim();
  const sortBy = searchParams.get("sortBy") || "id";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const minSubs = parseInt(searchParams.get("minSubs") ?? "0", 10);
  const country = searchParams.get("country");
  const uncontactedOnly = searchParams.get("uncontactedOnly") === "true";
  const deliverableOnly = searchParams.get("deliverableOnly") === "true";
  const hasWebsite = searchParams.get("hasWebsite") === "true";
  const hasSocial = searchParams.get("hasSocial") === "true";
  const hasPhone = searchParams.get("hasPhone") === "true";
  const qualification = searchParams.get("qualification");

  try {
    const conditions = [];

    if (sortBy === "id" && sortDir === "desc" && lastId > 0 && offset === 0) {
      conditions.push(lt(leads.id, lastId));
    }

    if (filter === "CONTACTED") {
      conditions.push(eq(leads.outreachStatus, "CONTACTED"));
    }

    if (qualification && (qualification === "QUALIFIED" || qualification === "UNQUALIFIED" || qualification === "DISQUALIFIED")) {
      conditions.push(eq(leads.qualificationStatus, qualification));
    }

    if (minSubs > 0) {
      conditions.push(gte(leads.subscriberCount, minSubs));
    }

    if (country) {
      conditions.push(eq(leads.country, country));
    }

    if (uncontactedOnly) {
      conditions.push(notInArray(leads.outreachStatus, ["CONTACTED", "REPLIED"]));
    }

    if (search) {
      conditions.push(
        or(
          ilike(leads.channelTitle, `%${search}%`),
          ilike(leads.channelUrl, `%${search}%`),
          ilike(leads.customUrl, `%${search}%`)
        )
      );
    }

    let orderExpr;
    switch (sortBy) {
      case "subscribers":
        orderExpr = sortDir === "asc" ? asc(leads.subscriberCount) : desc(leads.subscriberCount);
        break;
      case "title":
        orderExpr = sortDir === "asc" ? asc(leads.channelTitle) : desc(leads.channelTitle);
        break;
      case "videos":
        orderExpr = sortDir === "asc" ? asc(leads.videoCount) : desc(leads.videoCount);
        break;
      case "views":
        orderExpr = sortDir === "asc" ? asc(leads.viewCount) : desc(leads.viewCount);
        break;
      case "discoveredAt":
        orderExpr = sortDir === "asc" ? asc(leads.discoveredAt) : desc(leads.discoveredAt);
        break;
      default:
        orderExpr = sortDir === "asc" ? asc(leads.id) : desc(leads.id);
        break;
    }

    let query = db
      .select({
        id: leads.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        customUrl: leads.customUrl,
        description: leads.description,
        website: leads.website,
        thumbnailUrl: leads.thumbnailUrl,
        subscriberCount: leads.subscriberCount,
        videoCount: leads.videoCount,
        viewCount: leads.viewCount,
        publishedAt: leads.publishedAt,
        qualificationStatus: leads.qualificationStatus,
        outreachStatus: leads.outreachStatus,
        suppressionStatus: leads.suppressionStatus,
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
      .orderBy(orderExpr)
      .limit(limit);

    if (offset > 0) {
      query = query.offset(offset) as any;
    }

    const leadRows = await query;

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

    if (deliverableOnly) {
      data = data.filter((d) => Boolean(d.email) && (d.emailStatus === "VALID" || d.emailStatus === "DOMAIN_VALID" || d.emailStatus === "MAILBOX_VERIFIED"));
    }

    if (hasWebsite) {
      data = data.filter((d) => Boolean(d.website || d.contactPageUrl));
    }
    if (hasSocial) {
      data = data.filter((d) => Boolean(d.socialLinks && d.socialLinks.length > 0));
    }
    if (hasPhone) {
      data = data.filter((d) => Boolean(d.phone));
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("GET /api/leads error:", e);
    return NextResponse.json([], { status: 500 });
  }
}