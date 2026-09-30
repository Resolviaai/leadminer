import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { leads, contacts, keywords } from "../../../db/schema";
import { eq, desc, asc, lt, gte, inArray, notInArray, and, ilike, or, sql } from "drizzle-orm";
import { TIER_1_COUNTRIES } from "../../../config/countries";
import { classifyEmailRole } from "../../../services/extraction/email.extractor";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawLastId = parseInt(searchParams.get("lastId") ?? "0", 10);
  const lastId = isNaN(rawLastId) ? 0 : Math.max(0, rawLastId);
  const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
  const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = isNaN(rawLimit) ? 50 : Math.max(1, Math.min(100, rawLimit));
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
  const emailRoleFilter = searchParams.get("role")?.toUpperCase();

  try {
    const conditions = [];

    // Cursor pagination when sorting by id DESC
    if (sortBy === "id" && sortDir === "desc" && lastId > 0 && offset === 0) {
      conditions.push(lt(leads.id, lastId));
    }

    if (filter === "CONTACTED") {
      conditions.push(eq(leads.outreachStatus, "CONTACTED"));
    } else if (filter === "EMAIL_FOUND") {
      // Direct SQL condition: lead must have an email contact in contacts table
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND (contacts.contact_type = 'EMAIL' OR contacts.email IS NOT NULL)
        )`
      );
    } else if (filter === "NO_EMAIL") {
      // Direct SQL condition: lead has no email contact
      conditions.push(
        sql`NOT EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND (contacts.contact_type = 'EMAIL' OR contacts.email IS NOT NULL)
        )`
      );
    } else if (filter === "VERIFIED") {
      // Direct SQL condition: lead must have a verified deliverable email
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND contacts.email_status IN ('VALID', 'DOMAIN_VALID', 'MAILBOX_VERIFIED')
        )`
      );
    } else if (filter === "FAILED") {
      // Direct SQL condition: lead has invalid/failed email verification
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND contacts.email_status IN ('INVALID', 'FAILED', 'DISPOSABLE')
        )`
      );
    }

    if (deliverableOnly) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND contacts.email_status IN ('VALID', 'DOMAIN_VALID', 'MAILBOX_VERIFIED')
        )`
      );
    }

    if (hasWebsite) {
      conditions.push(
        sql`(${leads.website} IS NOT NULL OR ${leads.contactPageUrl} IS NOT NULL OR EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND contacts.contact_type = 'WEBSITE'
        ))`
      );
    }

    if (hasSocial) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND contacts.contact_type IN ('INSTAGRAM', 'TWITTER_X', 'TIKTOK', 'DISCORD', 'LINKEDIN', 'LINKTREE', 'BEACONS')
        )`
      );
    }

    if (hasPhone) {
      conditions.push(
        sql`(${leads.phone} IS NOT NULL OR EXISTS (
          SELECT 1 FROM contacts 
          WHERE contacts.lead_id = ${leads.id} 
            AND contacts.contact_type IN ('PHONE', 'WHATSAPP')
        ))`
      );
    }

    if (qualification && (qualification === "QUALIFIED" || qualification === "UNQUALIFIED" || qualification === "DISQUALIFIED")) {
      conditions.push(eq(leads.qualificationStatus, qualification));
    }

    if (emailRoleFilter) {
      if (emailRoleFilter === "COMMERCIAL") {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.lead_id = ${leads.id} 
              AND (
                contacts.email_category IN ('BUSINESS', 'MANAGEMENT', 'BUSINESS_INQUIRIES')
                OR contacts.email ~* '^(business|collab|partner|sponsor|booking|mgmt|manager|agent)'
              )
          )`
        );
      } else if (emailRoleFilter === "DIRECT") {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.lead_id = ${leads.id} 
              AND (
                contacts.email_category IN ('DIRECT', 'SALES', 'CREATOR_DIRECT')
                OR (contacts.email IS NOT NULL AND contacts.email !~* '^(support|help|info|admin|billing|team|office)')
              )
          )`
        );
      } else if (emailRoleFilter === "GENERIC") {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.lead_id = ${leads.id} 
              AND (
                contacts.email_category IN ('GENERIC', 'SUPPORT', 'GENERIC_SUPPORT')
                OR contacts.email ~* '^(support|help|info|admin|billing|team|office)'
              )
          )`
        );
      }
    }

    if (minSubs > 0) {
      conditions.push(gte(leads.subscriberCount, minSubs));
    }

    if (country) {
      if (country.toUpperCase() === "TIER_1") {
        conditions.push(inArray(leads.country, TIER_1_COUNTRIES as any));
      } else {
        conditions.push(eq(leads.country, country));
      }
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
        source: contacts.source,
        isPrimary: contacts.isPrimary,
        email: contacts.email,
        emailStatus: contacts.emailStatus,
        opportunityTier: contacts.opportunityTier,
        priorityScore: contacts.priorityScore,
        emailCategory: contacts.emailCategory,
        verificationReason: contacts.verificationReason,
        instagram: contacts.instagram,
        twitter: contacts.twitter,
        tiktok: contacts.tiktok,
        discord: contacts.discord,
        linkedin: contacts.linkedin,
      })
      .from(contacts)
      .where(inArray(contacts.leadId, leadIds))
      .orderBy(desc(contacts.isPrimary), asc(contacts.id));

    // Map contacts to leads
    const contactsByLead = new Map<number, typeof allContacts>();
    for (const c of allContacts) {
      const list = contactsByLead.get(c.leadId) || [];
      list.push(c);
      contactsByLead.set(c.leadId, list);
    }

    // Format final response: each lead has primary email, additional emails, and all social links
    const data = leadRows.map((l) => {
      const leadContacts = contactsByLead.get(l.id) || [];
      const allEmailContacts = leadContacts.filter((c) => c.email || c.contactType === "EMAIL");
      const primaryEmailContact =
        allEmailContacts.find((c) => c.isPrimary && c.email) ||
        allEmailContacts.find((c) => c.contactType === "EMAIL" && c.email) ||
        allEmailContacts[0];

      const additionalEmails = allEmailContacts
        .filter((c) => c.email && c.email !== primaryEmailContact?.email)
        .map((c) => c.email as string);

      const allEmails = allEmailContacts
        .filter((c) => Boolean(c.email))
        .map((c) => {
          const { role, priorityScore: fallbackScore } = classifyEmailRole(c.email!);
          return {
            id: c.id,
            email: c.email!,
            isPrimary: Boolean(c.isPrimary),
            emailStatus: c.emailStatus || "UNKNOWN",
            opportunityTier: c.opportunityTier || null,
            priorityScore: c.priorityScore ?? fallbackScore,
            verificationReason: c.verificationReason || null,
            role: c.emailCategory || role,
            source: c.source,
          };
        });

      const primaryRole = primaryEmailContact?.email
        ? primaryEmailContact.emailCategory || classifyEmailRole(primaryEmailContact.email).role
        : null;

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
        emailRole: primaryRole,
        opportunityTier: primaryEmailContact?.opportunityTier || null,
        priorityScore: primaryEmailContact?.priorityScore ?? null,
        phone: l.phone || phoneContact?.value || null,
        additionalEmails,
        allEmails,
        socialLinks,
      };
    });

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("GET /api/leads error:", e);
    return NextResponse.json([], { status: 500 });
  }
}