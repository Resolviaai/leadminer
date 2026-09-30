import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db/client";
import { leads, contacts, campaigns } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";
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
    const body = await req.json();
    const contactId = body.contactId ? parseInt(body.contactId, 10) : null;
    const email = body.email?.trim()?.toLowerCase() || null;

    if (!contactId && !email) {
      return NextResponse.json({ error: "Missing contactId or email" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Verify lead exists
      const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId));
      if (!lead) {
        return { error: "Lead not found", status: 404 };
      }

      // 2. Identify target contact strictly scoped to this lead
      const whereCondition = contactId
        ? and(eq(contacts.id, contactId), eq(contacts.leadId, leadId))
        : and(eq(contacts.email, email!), eq(contacts.leadId, leadId));

      const [targetContact] = await tx.select().from(contacts).where(whereCondition);
      if (!targetContact) {
        return { error: "Contact not found for this lead", status: 404 };
      }

      // 3. Atomically unset previous primary contact(s) for this lead
      await tx
        .update(contacts)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(contacts.leadId, leadId));

      // 4. Mark target contact as primary
      await tx
        .update(contacts)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(contacts.id, targetContact.id));

      // 5. Re-evaluate qualification for the newly selected primary contact
      let newQualificationStatus = lead.qualificationStatus;
      const [activeCampaign] = await tx
        .select()
        .from(campaigns)
        .where(eq(campaigns.status, "ACTIVE"))
        .limit(1);

      if (activeCampaign && targetContact.email) {
        const qRes = leadQualificationService.qualify(
          {
            subscriberCount: lead.subscriberCount || 0,
            email: targetContact.email,
            emailStatus: targetContact.emailStatus,
            country: lead.country || undefined,
            isSuppressed: lead.suppressionStatus,
            alreadyContacted: lead.outreachStatus === "CONTACTED",
          },
          {
            minSubscribers: activeCampaign.minSubscribers ? Number(activeCampaign.minSubscribers) : 10,
            maxSubscribers: activeCampaign.maxSubscribers ? Number(activeCampaign.maxSubscribers) : undefined,
            requireEmail: true,
            requireValidEmail: true,
            targetCountry: activeCampaign.targetCountry || undefined,
          }
        );
        newQualificationStatus = qRes.qualified ? "QUALIFIED" : "DISQUALIFIED";

        if (newQualificationStatus !== lead.qualificationStatus) {
          await tx
            .update(leads)
            .set({ qualificationStatus: newQualificationStatus, updatedAt: new Date() })
            .where(eq(leads.id, leadId));
        }
      }

      return {
        success: true,
        leadId,
        primaryContactId: targetContact.id,
        primaryEmail: targetContact.email,
        qualificationStatus: newQualificationStatus,
      };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/leads/[id]/set-primary error:", error);
    return NextResponse.json({ error: "Failed to set primary contact" }, { status: 500 });
  }
}
