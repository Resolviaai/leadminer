import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/client";
import { sequences, sequenceSteps, campaigns, templates } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { sequenceService } from "../../../services/outreach/sequence.service";

export async function GET(req: NextRequest) {
  try {
    const activeCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "ACTIVE"))
      .limit(1);

    const campaignId = activeCampaigns.length > 0 ? activeCampaigns[0].id : 1;
    const { sequence, steps } = await sequenceService.getOrCreateCampaignSequence(campaignId);
    const metrics = await sequenceService.getSequenceMetrics(sequence.id);

    const allTemplates = await db
      .select({
        id: templates.id,
        name: templates.name,
        subject: templates.subject,
        body: templates.body,
      })
      .from(templates)
      .where(eq(templates.isActive, true));

    return NextResponse.json({
      sequence,
      steps,
      metrics,
      templates: allTemplates,
      campaign: activeCampaigns[0] || null,
    });
  } catch (err: any) {
    console.error("[sequences GET]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch sequence" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sequenceId,
      name,
      weekendPolicy,
      capacityBias,
      steps: newSteps,
    } = body;

    if (!sequenceId) {
      return NextResponse.json({ error: "sequenceId is required" }, { status: 400 });
    }

    if (!Array.isArray(newSteps) || newSteps.length === 0) {
      return NextResponse.json({ error: "At least 1 step is required in sequence" }, { status: 400 });
    }

    // 1. Update sequence settings
    await db
      .update(sequences)
      .set({
        name: name || "Outreach Sequence",
        weekendPolicy: weekendPolicy === "SEND_7_DAYS" ? "SEND_7_DAYS" : "SKIP_WEEKENDS",
        capacityBias: String(Number(capacityBias || 0).toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(sequences.id, Number(sequenceId)));

    // 2. Reconcile sequence steps in a transaction
    await db.transaction(async (tx) => {
      // Delete existing steps
      await tx.delete(sequenceSteps).where(eq(sequenceSteps.sequenceId, Number(sequenceId)));

      // Re-insert new steps and persist template content
      for (let i = 0; i < newSteps.length; i++) {
        const step = newSteps[i];
        let targetTemplateId = Number(step.templateId) || 0;

        // If template content (subject or body) is passed, update or create the template
        if (step.templateSubject !== undefined || step.templateBody !== undefined) {
          if (targetTemplateId > 0) {
            await tx
              .update(templates)
              .set({
                name: step.templateName || `Sequence Step ${i + 1}`,
                subject: (step.templateSubject || "Follow-up").trim(),
                body: (step.templateBody || "").trim(),
                updatedAt: new Date(),
              })
              .where(eq(templates.id, targetTemplateId));
          } else {
            const [newTpl] = await tx
              .insert(templates)
              .values({
                name: step.templateName || `Sequence Step ${i + 1}`,
                subject: (step.templateSubject || (i === 0 ? "Outreach Pitch" : "Follow-Up")).trim(),
                body: (step.templateBody || "Hey {{channel_name}},\n\nFollowing up on my previous note!").trim(),
                isActive: true,
              })
              .returning();
            targetTemplateId = newTpl.id;
          }
        }

        await tx.insert(sequenceSteps).values({
          sequenceId: Number(sequenceId),
          stepNumber: i + 1,
          templateId: targetTemplateId,
          delayDays: i === 0 ? 0 : Math.max(1, Number(step.delayDays || 2)),
          delayHours: Number(step.delayHours || 0),
        });
      }
    });

    const updated = await sequenceService.getOrCreateCampaignSequence(
      body.campaignId || 1
    );
    const metrics = await sequenceService.getSequenceMetrics(Number(sequenceId));

    return NextResponse.json({
      success: true,
      sequence: updated.sequence,
      steps: updated.steps,
      metrics,
    });
  } catch (err: any) {
    console.error("[sequences POST]", err);
    return NextResponse.json({ error: err.message || "Failed to update sequence" }, { status: 500 });
  }
}
