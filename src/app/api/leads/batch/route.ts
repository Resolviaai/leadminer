import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/client";
import { leads, contacts, campaigns } from "../../../../db/schema";
import { inArray, eq } from "drizzle-orm";
import { emailVerificationService } from "../../../../services/verification/verifier.service";
import { leadQualificationService } from "../../../../services/qualification/qualification.service";
import { websiteScraper } from "../../../../services/extraction/website.scraper";
import { emailExtractor } from "../../../../services/extraction/email.extractor";
import { socialExtractor } from "../../../../services/extraction/social.extractor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as "reprocess" | "verify" | "suppress" | "delete";
    const ids = (body.ids || []).map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));

    if (!ids.length) {
      return NextResponse.json({ error: "No valid lead IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      const deleted = await db.delete(leads).where(inArray(leads.id, ids)).returning();
      return NextResponse.json({ success: true, count: deleted.length });
    }

    if (action === "suppress") {
      const updated = await db
        .update(leads)
        .set({
          suppressionStatus: true,
          qualificationStatus: "DISQUALIFIED",
          updatedAt: new Date(),
        })
        .where(inArray(leads.id, ids))
        .returning();

      return NextResponse.json({ success: true, count: updated.length });
    }

    if (action === "verify") {
      const leadContacts = await db
        .select()
        .from(contacts)
        .where(inArray(contacts.leadId, ids));

      const [activeCampaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.status, "ACTIVE"))
        .limit(1);

      let verifiedCount = 0;

      for (const leadId of ids) {
        const leadEmail =
          leadContacts.find((c) => c.leadId === leadId && c.contactType === "EMAIL" && c.isPrimary && c.email) ||
          leadContacts.find((c) => c.leadId === leadId && c.email);

        if (leadEmail?.email) {
          const vResult = await emailVerificationService.verifyEmail(leadEmail.email);
          await db
            .update(contacts)
            .set({
              emailStatus: vResult.status as any,
              verificationProvider: vResult.provider,
              verificationReason: vResult.reasonCode || vResult.reason,
              verificationTimestamp: vResult.timestamp,
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, leadEmail.id));

          const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
          if (lead) {
            const isDeliverable =
              vResult.status === "VALID" || vResult.status === "DOMAIN_VALID" || vResult.status === "MAILBOX_VERIFIED";
            await db
              .update(leads)
              .set({
                qualificationStatus: isDeliverable ? "QUALIFIED" : "DISQUALIFIED",
                updatedAt: new Date(),
              })
              .where(eq(leads.id, leadId));
          }
          verifiedCount++;
        }
      }

      return NextResponse.json({ success: true, count: verifiedCount });
    }

    if (action === "reprocess") {
      // Reprocess sequentially up to batch size
      let processedCount = 0;
      for (const leadId of ids) {
        const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
        if (!lead) continue;

        const existingContacts = await db
          .select()
          .from(contacts)
          .where(eq(contacts.leadId, leadId));

        const descEmails = emailExtractor.extractEmails(lead.description || "");
        const descSocials = socialExtractor.extractSocials(lead.description || "");

        const scrapeTargets = new Set<string>();
        if (lead.website) scrapeTargets.add(lead.website);
        if (descSocials.website) scrapeTargets.add(descSocials.website);
        if (descSocials.linktree) scrapeTargets.add(descSocials.linktree);
        if (descSocials.beacons) scrapeTargets.add(descSocials.beacons);

        for (const c of existingContacts) {
          if (["WEBSITE", "LINKTREE", "BEACONS"].includes(c.contactType) && c.value) {
            scrapeTargets.add(c.value);
          }
        }

        const newlyDiscoveredEmails: string[] = [];
        let foundPhone: string | null = null;
        let foundContactPageUrl: string | null = null;
        let scrapedWebsiteUrl: string | null = null;

        for (const targetUrl of Array.from(scrapeTargets)) {
          try {
            const scraped = await websiteScraper.scrapeUrl(targetUrl);
            if (scraped.emails.length > 0) newlyDiscoveredEmails.push(...scraped.emails);
            if (!foundPhone && scraped.phones.length > 0) foundPhone = scraped.phones[0];
            if (!foundContactPageUrl && scraped.contactPageUrl) foundContactPageUrl = scraped.contactPageUrl;
            if (!scrapedWebsiteUrl && scraped.url) scrapedWebsiteUrl = scraped.url;
          } catch {
            // ignore timeout
          }
        }

        for (const de of descEmails) newlyDiscoveredEmails.push(de.email);

        const uniqueNewEmails = Array.from(new Set(newlyDiscoveredEmails.map((e) => e.toLowerCase().trim())));
        let primaryEmail = existingContacts.find((c) => c.contactType === "EMAIL" && c.isPrimary)?.email;
        let primaryEmailStatus = existingContacts.find((c) => c.contactType === "EMAIL" && c.isPrimary)?.emailStatus || "UNKNOWN";

        for (const email of uniqueNewEmails) {
          const existing = existingContacts.find((c) => c.email?.toLowerCase() === email);
          if (!existing) {
            const vResult = await emailVerificationService.verifyEmail(email);
            await db
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
              .onConflictDoNothing();

            if (!primaryEmail) {
              primaryEmail = email;
              primaryEmailStatus = vResult.status;
            }
          }
        }

        const updateData: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
        if (foundPhone && !lead.phone) updateData.phone = foundPhone;
        if (foundContactPageUrl && !lead.contactPageUrl) updateData.contactPageUrl = foundContactPageUrl;
        if (scrapedWebsiteUrl && !lead.website) updateData.website = scrapedWebsiteUrl;

        const isDeliverable =
          primaryEmailStatus === "VALID" || primaryEmailStatus === "DOMAIN_VALID" || primaryEmailStatus === "MAILBOX_VERIFIED";
        if (primaryEmail && isDeliverable) {
          updateData.qualificationStatus = "QUALIFIED";
        }

        await db.update(leads).set(updateData).where(eq(leads.id, leadId));
        processedCount++;
      }

      return NextResponse.json({ success: true, count: processedCount });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    console.error("POST /api/leads/batch error:", e);
    return NextResponse.json({ error: e.message || "Failed batch action" }, { status: 500 });
  }
}
