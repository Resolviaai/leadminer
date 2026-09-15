import { db } from '../db/client';
import { campaigns, leads, contacts, templates, messages, systemSettings, gmailAccounts } from '../db/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { templateEngine } from '../services/outreach/template.engine';
import { geminiService } from '../services/ai/gemini.service';
import { gmailSendingService } from '../services/outreach/gmail.service';
import { jobRunner } from '../services/jobs/job.runner';

export async function runOutreachBatch(batchLimit = 10): Promise<{ sent: number; skipped: number; errors: number }> {
  console.log(`\n======================================================`);
  console.log(`✉️ Starting Cold Outreach Sending Worker (limit=${batchLimit})`);
  console.log(`======================================================\n`);

  // 1. Mandatory Kill Switch Check
  const killSwitchRecord = await db.select().from(systemSettings).where(eq(systemSettings.key, 'kill_switch')).limit(1);
  if (killSwitchRecord.length > 0 && (killSwitchRecord[0].value as any)?.enabled) {
    console.warn('⛔ [Kill Switch Active] STOP ALL OUTREACH is enabled in dashboard. Halting.');
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const jobId = await jobRunner.createJob('CAMPAIGN_SEND', { batchLimit });

  try {
    // 2. Fetch Active Campaigns (or fall back to first campaign in draft for testing if none active)
    let activeCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, 'ACTIVE')).limit(5);

    if (activeCampaigns.length === 0) {
      console.log('ℹ️ No campaigns currently marked ACTIVE. Checking for any available campaign...');
      activeCampaigns = await db.select().from(campaigns).limit(1);
    }

    if (activeCampaigns.length === 0) {
      console.log('ℹ️ No campaigns found in database. Please create a campaign first.');
      await jobRunner.completeJob(jobId, 0);
      return { sent: 0, skipped: 0, errors: 0 };
    }

    const campaign = activeCampaigns[0];
    console.log(`📋 Running campaign: "${campaign.name}" (ID: ${campaign.id})`);

    // 3. Fetch template
    const templateRecord = await db
      .select()
      .from(templates)
      .where(eq(templates.id, campaign.templateId || 1))
      .limit(1);

    if (templateRecord.length === 0) {
      throw new Error(`Template ID ${campaign.templateId} not found`);
    }

    const template = templateRecord[0];

    // 4. Fetch QUALIFIED leads with VALID email that have not been contacted yet
    const candidateLeads = await db
      .select({
        leadId: leads.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        website: leads.website,
        description: leads.description,
        email: contacts.email,
      })
      .from(leads)
      .innerJoin(contacts, eq(leads.id, contacts.leadId))
      .where(
        and(
          eq(leads.qualificationStatus, 'QUALIFIED'),
          eq(leads.outreachStatus, 'UNPROCESSED'),
          eq(leads.suppressionStatus, false),
          eq(contacts.emailStatus, 'VALID'),
          isNotNull(contacts.email)
        )
      )
      .limit(batchLimit);

    if (candidateLeads.length === 0) {
      console.log('ℹ️ No qualified leads ready for outreach at this time.');
      await jobRunner.completeJob(jobId, 0);
      return { sent: 0, skipped: 0, errors: 0 };
    }

    console.log(`📬 Found ${candidateLeads.length} qualified leads for outreach.`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const lead of candidateLeads) {
      if (!lead.email) continue;

      const idempotencyKey = `campaign_${campaign.id}_lead_${lead.leadId}`;

      // Check if message already exists with this idempotency key
      const existing = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  [Skip] Message already exists for lead ${lead.leadId} (idempotency enforced)`);
        skippedCount++;
        continue;
      }

      console.log(`\n[Outreach] Preparing message for "${lead.channelTitle}" (${lead.email})...`);

      // 5. Optional Gemini Personalization
      let customLine = 'I really enjoy the direction of your channel content.';
      let personalizationStatus: 'NONE' | 'CUSTOMIZED' | 'FALLBACK' | 'FAILED' = 'NONE';
      let modelUsed: string | undefined;

      if (campaign.enableGeminiPersonalization) {
        const aiRes = await geminiService.generateCustomLine({
          channelTitle: lead.channelTitle,
          description: lead.description || undefined,
          subscriberCount: lead.subscriberCount || undefined,
        });

        customLine = aiRes.customLine;
        personalizationStatus = aiRes.status;
        modelUsed = aiRes.model;
        console.log(`  Gemini Hook: "${customLine}" (${personalizationStatus})`);
      }

      // 6. Render Template
      const firstName = templateEngine.extractFirstName(lead.channelTitle);
      const renderedSubject = templateEngine.render(template.subject, {
        first_name: firstName,
        channel_name: lead.channelTitle,
        subscriber_count: lead.subscriberCount || 0,
      });

      const renderedBody = templateEngine.render(template.body, {
        first_name: firstName,
        channel_name: lead.channelTitle,
        channel_url: lead.channelUrl,
        subscriber_count: lead.subscriberCount || 0,
        website: lead.website || '',
        custom_line: customLine,
      });

      // 7. Dispatch via Gmail Service
      const sendResult = await gmailSendingService.sendEmail({
        leadId: lead.leadId,
        campaignId: campaign.id,
        templateId: template.id,
        recipientEmail: lead.email,
        subject: renderedSubject,
        body: renderedBody,
        idempotencyKey,
        personalizationStatus,
        personalizationModel: modelUsed,
      });

      if (sendResult.success) {
        sentCount++;
        console.log(`  ✅ Sent successfully (Message ID: ${sendResult.messageId})`);
        await jobRunner.logEvent(jobId, 'MESSAGE_SENT', 'INFO', `Sent message to ${lead.email} (${lead.channelTitle})`, {
          leadId: lead.leadId,
          campaignId: campaign.id,
          messageId: sendResult.messageId,
        });
      } else {
        errorCount++;
        console.error(`  ❌ Send failed: ${sendResult.error || sendResult.skippedReason}`);
        await jobRunner.logEvent(jobId, 'MESSAGE_FAILED', 'WARN', `Failed to send to ${lead.email}: ${sendResult.error || sendResult.skippedReason}`);
      }

      await jobRunner.updateHeartbeat(jobId, sentCount, errorCount);
    }

    await jobRunner.completeJob(jobId, sentCount);
    console.log(`\n✅ Outreach batch completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors.`);
    return { sent: sentCount, skipped: skippedCount, errors: errorCount };
  } catch (error: any) {
    console.error('[Outreach Worker] Critical failure:', error);
    await jobRunner.failJob(jobId, error.message);
    return { sent: 0, skipped: 0, errors: 1 };
  }
}

if (require.main === module) {
  runOutreachBatch()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal outreach worker crash:', err);
      process.exit(1);
    });
}
