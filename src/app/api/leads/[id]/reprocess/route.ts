import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db/client";
import { leads, contacts, campaigns } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { emailExtractor } from "../../../../../services/extraction/email.extractor";
import { socialExtractor } from "../../../../../services/extraction/social.extractor";
import { websiteScraper } from "../../../../../services/extraction/website.scraper";
import { emailVerificationService } from "../../../../../services/verification/verifier.service";
import { leadQualificationService } from "../../../../../services/qualification/qualification.service";

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const leadId = parseInt(params.id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
  }

  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const existingContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.leadId, leadId));

    // 1. Re-extract from channel description
    const descEmails = emailExtractor.extractEmails(lead.description || "");
    const descSocials = socialExtractor.extractSocials(lead.description || "");

    // 2. Identify all targets to scrape (website, Linktree, Beacons)
    const scrapeTargets = new Set<string>();
    if (lead.website) scrapeTargets.add(lead.website);
    if (descSocials.website) scrapeTargets.add(descSocials.website);
    if (descSocials.linktree) scrapeTargets.add(descSocials.linktree);
    if (descSocials.beacons) scrapeTargets.add(descSocials.beacons);

    for (const c of existingContacts) {
      if (c.contactType === "WEBSITE" || c.contactType === "LINKTREE" || c.contactType === "BEACONS") {
        if (c.value) scrapeTargets.add(c.value);
      }
    }

    // 3. Scrape websites
    const newlyDiscoveredEmails: string[] = [];
    let foundPhone: string | null = null;
    let foundContactPageUrl: string | null = null;
    let scrapedWebsiteUrl: string | null = null;

    for (const targetUrl of Array.from(scrapeTargets)) {
      try {
        const scraped = await websiteScraper.scrapeUrl(targetUrl);
        if (scraped.emails.length > 0) {
          newlyDiscoveredEmails.push(...scraped.emails);
        }
        if (!foundPhone && scraped.phones.length > 0) {
          foundPhone = scraped.phones[0];
        }
        if (!foundContactPageUrl && scraped.contactPageUrl) {
          foundContactPageUrl = scraped.contactPageUrl;
        }
        if (!scrapedWebsiteUrl && scraped.url) {
          scrapedWebsiteUrl = scraped.url;
        }

        // Insert extra contacts discovered
        for (const item of scraped.rawItems) {
          if (item.type === "EMAIL") continue;
          await db
            .insert(contacts)
            .values({
              leadId,
              contactType: item.type,
              value: item.value,
              normalizedValue: item.normalizedValue,
              source: item.source,
              isPrimary: false,
              instagram: item.type === "INSTAGRAM" ? item.normalizedValue : undefined,
              twitter: item.type === "TWITTER_X" ? item.normalizedValue : undefined,
              discord: item.type === "DISCORD" ? item.value : undefined,
              tiktok: item.type === "TIKTOK" ? item.normalizedValue : undefined,
              linkedin: item.type === "LINKEDIN" ? item.value : undefined,
            })
            .onConflictDoNothing();
        }
      } catch (e: any) {
        console.warn(`[Reprocess] Failed scraping ${targetUrl}:`, e?.message);
      }
    }

    // Also include any description emails not yet in existing contacts
    for (const de of descEmails) {
      newlyDiscoveredEmails.push(de.email);
    }

    // Insert description socials if missing
    for (const item of descSocials.items) {
      if (item.type === "EMAIL") continue;
      await db
        .insert(contacts)
        .values({
          leadId,
          contactType: item.type,
          value: item.value,
          normalizedValue: item.normalizedValue,
          source: item.source,
          isPrimary: false,
          instagram: item.type === "INSTAGRAM" ? item.normalizedValue : undefined,
          twitter: item.type === "TWITTER_X" ? item.normalizedValue : undefined,
          discord: item.type === "DISCORD" ? item.value : undefined,
          tiktok: item.type === "TIKTOK" ? item.normalizedValue : undefined,
          linkedin: item.type === "LINKEDIN" ? item.value : undefined,
        })
        .onConflictDoNothing();
    }

    // Deduplicate discovered emails
    const uniqueNewEmails = Array.from(new Set(newlyDiscoveredEmails.map((e) => e.toLowerCase().trim())));
    let primaryEmail = existingContacts.find((c) => c.contactType === "EMAIL" && c.isPrimary)?.email;
    let primaryEmailStatus = existingContacts.find((c) => c.contactType === "EMAIL" && c.isPrimary)?.emailStatus || "UNKNOWN";

    for (const email of uniqueNewEmails) {
      const existing = existingContacts.find((c) => c.email?.toLowerCase() === email);
      if (!existing) {
        // Verify deliverability right away
        const vResult = await emailVerificationService.verifyEmail(email);
        const [insertedContact] = await db
          .insert(contacts)
          .values({
            leadId,
            contactType: "EMAIL",
            value: email,
            normalizedValue: email,
            email,
            emailStatus: vResult.status as any,
            verificationProvider: vResult.provider,
            verificationReason: vResult.reasonCode || vResult.reason,
            verificationTimestamp: vResult.timestamp,
            isPrimary: !primaryEmail,
            source: "reprocess_scraper",
          })
          .onConflictDoNothing()
          .returning();

        if (!primaryEmail) {
          primaryEmail = email;
          primaryEmailStatus = vResult.status;
        }
      }
    }

    // 4. Update Lead record (phone, contactPageUrl, website, and qualify if email deliverable)
    const updateLeadData: Partial<typeof leads.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (foundPhone && !lead.phone) {
      updateLeadData.phone = foundPhone;
    }
    if (foundContactPageUrl && !lead.contactPageUrl) {
      updateLeadData.contactPageUrl = foundContactPageUrl;
    }
    if (scrapedWebsiteUrl && !lead.website) {
      updateLeadData.website = scrapedWebsiteUrl;
    }

    // Run qualification check if we have an active campaign
    const [activeCampaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "ACTIVE"))
      .limit(1);

    const qualificationCriteria = activeCampaign
      ? {
          minSubscribers: activeCampaign.minSubscribers || 0,
          maxSubscribers: activeCampaign.maxSubscribers || 10_000_000,
          requireEmail: true,
          requireValidEmail: true,
          targetCountry: activeCampaign.targetCountry || undefined,
        }
      : {
          minSubscribers: 1000,
          requireEmail: true,
          requireValidEmail: true,
        };

    const qResult = leadQualificationService.qualify(
      {
        subscriberCount: lead.subscriberCount || 0,
        email: primaryEmail || null,
        emailStatus: primaryEmailStatus,
        website: lead.website || scrapedWebsiteUrl || null,
        country: lead.country || null,
        isSuppressed: lead.suppressionStatus,
        alreadyContacted: lead.outreachStatus === "CONTACTED",
      },
      qualificationCriteria
    );

    updateLeadData.qualificationStatus = qResult.qualified ? "QUALIFIED" : "UNQUALIFIED";

    const [updatedLead] = await db
      .update(leads)
      .set(updateLeadData)
      .where(eq(leads.id, leadId))
      .returning();

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      primaryEmail,
      primaryEmailStatus,
      newEmailsFound: uniqueNewEmails.length,
      phone: updateLeadData.phone || lead.phone,
      contactPageUrl: updateLeadData.contactPageUrl || lead.contactPageUrl,
      qualificationStatus: updateLeadData.qualificationStatus,
    });
  } catch (e: any) {
    console.error("POST /api/leads/[id]/reprocess error:", e);
    return NextResponse.json({ error: e.message || "Failed to reprocess lead" }, { status: 500 });
  }
}
