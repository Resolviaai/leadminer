import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/client";
import { leads, contacts, campaigns } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { emailVerificationService } from "../../../../services/verification/verifier.service";
import { leadQualificationService } from "../../../../services/qualification/qualification.service";

interface Params {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const leadId = parseInt(params.id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updateLeadData: Partial<typeof leads.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.channelTitle !== undefined) updateLeadData.channelTitle = body.channelTitle.trim();
    if (body.website !== undefined) updateLeadData.website = body.website.trim() || null;
    if (body.phone !== undefined) updateLeadData.phone = body.phone.trim() || null;
    if (body.contactPageUrl !== undefined) updateLeadData.contactPageUrl = body.contactPageUrl.trim() || null;

    let primaryEmail = body.email?.trim()?.toLowerCase();
    let emailStatus = "UNKNOWN";

    if (primaryEmail) {
      // Run verification on the updated email
      const vResult = await emailVerificationService.verifyEmail(primaryEmail);
      emailStatus = vResult.status;

      // Check if primary contact exists
      const [existingContact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.leadId, leadId), eq(contacts.contactType, "EMAIL"), eq(contacts.isPrimary, true)));

      if (existingContact) {
        await db
          .update(contacts)
          .set({
            value: primaryEmail,
            normalizedValue: primaryEmail,
            email: primaryEmail,
            emailStatus: vResult.status as any,
            verificationProvider: vResult.provider,
            verificationReason: vResult.reasonCode || vResult.reason,
            verificationTimestamp: vResult.timestamp,
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, existingContact.id));
      } else {
        await db.insert(contacts).values({
          leadId,
          contactType: "EMAIL",
          value: primaryEmail,
          normalizedValue: primaryEmail,
          email: primaryEmail,
          emailStatus: vResult.status as any,
          verificationProvider: vResult.provider,
          verificationReason: vResult.reasonCode || vResult.reason,
          verificationTimestamp: vResult.timestamp,
          isPrimary: true,
          source: "manual_entry",
        });
      }

      // Check qualification
      const [activeCampaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.status, "ACTIVE"))
        .limit(1);

      const qResult = leadQualificationService.qualify(
        {
          subscriberCount: lead.subscriberCount || 0,
          email: primaryEmail,
          emailStatus: vResult.status,
          website: updateLeadData.website || lead.website,
          country: lead.country,
          isSuppressed: lead.suppressionStatus,
          alreadyContacted: lead.outreachStatus === "CONTACTED",
        },
        activeCampaign
          ? {
              minSubscribers: activeCampaign.minSubscribers || 0,
              maxSubscribers: activeCampaign.maxSubscribers || 10_000_000,
              requireEmail: true,
              requireValidEmail: true,
              targetCountry: activeCampaign.targetCountry || undefined,
            }
          : { minSubscribers: 1000, requireEmail: true, requireValidEmail: true }
      );

      updateLeadData.qualificationStatus = qResult.qualified ? "QUALIFIED" : "UNQUALIFIED";
    }

    const [updated] = await db
      .update(leads)
      .set(updateLeadData)
      .where(eq(leads.id, leadId))
      .returning();

    return NextResponse.json({
      success: true,
      lead: updated,
      email: primaryEmail,
      emailStatus,
    });
  } catch (e: any) {
    console.error("PATCH /api/leads/[id] error:", e);
    return NextResponse.json({ error: e.message || "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const leadId = parseInt(params.id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(leads)
      .where(eq(leads.id, leadId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: leadId });
  } catch (e: any) {
    console.error("DELETE /api/leads/[id] error:", e);
    return NextResponse.json({ error: e.message || "Failed to delete lead" }, { status: 500 });
  }
}
