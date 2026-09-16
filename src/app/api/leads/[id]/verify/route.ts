import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db/client";
import { leads, contacts, campaigns } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";
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

    const leadContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.leadId, leadId));

    const emailContact =
      leadContacts.find((c) => c.contactType === "EMAIL" && c.isPrimary && c.email) ||
      leadContacts.find((c) => c.email);

    if (!emailContact || !emailContact.email) {
      return NextResponse.json({ error: "Lead has no email to verify" }, { status: 400 });
    }

    const vResult = await emailVerificationService.verifyEmail(emailContact.email);

    await db
      .update(contacts)
      .set({
        emailStatus: vResult.status as any,
        verificationProvider: vResult.provider,
        verificationReason: vResult.reasonCode || vResult.reason,
        verificationTimestamp: vResult.timestamp,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, emailContact.id));

    // Run qualification check
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
        email: emailContact.email,
        emailStatus: vResult.status,
        website: lead.website,
        country: lead.country,
        isSuppressed: lead.suppressionStatus,
        alreadyContacted: lead.outreachStatus === "CONTACTED",
      },
      qualificationCriteria
    );

    const nextQualification = qResult.qualified ? "QUALIFIED" : "DISQUALIFIED";

    await db
      .update(leads)
      .set({
        qualificationStatus: nextQualification,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    return NextResponse.json({
      success: true,
      email: emailContact.email,
      status: vResult.status,
      reason: vResult.reason,
      reasonCode: vResult.reasonCode,
      qualificationStatus: nextQualification,
    });
  } catch (e: any) {
    console.error("POST /api/leads/[id]/verify error:", e);
    return NextResponse.json({ error: e.message || "Failed to verify email" }, { status: 500 });
  }
}
