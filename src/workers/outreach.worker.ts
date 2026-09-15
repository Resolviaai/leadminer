import { db } from '../db/client';
import { campaigns, leads, contacts, templates, messages, systemSettings, gmailAccounts } from '../db/schema';
import { eq, and, isNotNull, inArray, sql } from 'drizzle-orm';
import { env } from '../config/env';
import { templateEngine } from '../services/outreach/template.engine';
import { geminiService } from '../services/ai/gemini.service';
import { gmailSendingService } from '../services/outreach/gmail.service';
import { jobRunner } from '../services/jobs/job.runner';

export async function runOutreachBatch(batchLimit?: number): Promise<{ sent: number; skipped: number; errors: number }> {
  // Dynamically calculate capacity based on active connected accounts if batchLimit not explicitly provided
  let effectiveBatchLimit = batchLimit;
  if (!effectiveBatchLimit) {
    try {
      const activeAccounts = await db
        .select({
          id: gmailAccounts.id,
          dailyLimit: gmailAccounts.dailyLimit,
          sentToday: gmailAccounts.sentToday,
        })
        .from(gmailAccounts)
        .where(eq(gmailAccounts.status, 'ACTIVE'));

      if (activeAccounts.length > 0) {
        const totalRemaining = activeAccounts.reduce((sum, acc) => {
          const limit = acc.dailyLimit || 25;
          const sent = acc.sentToday || 0;
          return sum + Math.max(0, limit - sent);
        }, 0);
        effectiveBatchLimit = Math.max(totalRemaining, 25);
      } else {
        effectiveBatchLimit = 25;
      }
    } catch {
      effectiveBatchLimit = 25;
    }
  }

  console.log(`\n======================================================`);
  console.log(`✉️ Starting Cold Outreach Sending Worker (limit=${effectiveBatchLimit})`);
  console.log(`======================================================\n`);

  // 1. Mandatory Kill Switch Check
  const killSwitchRecord = await db.select().from(systemSettings).where(eq(systemSettings.key, 'kill_switch')).limit(1);
  if (killSwitchRecord.length > 0 && (killSwitchRecord[0].value as any)?.enabled) {
    console.warn('⛔ [Kill Switch Active] STOP ALL OUTREACH is enabled in dashboard. Halting.');
    return { sent: 0, skipped: 0, errors: 0 };
  }

  // Pipeline recovery: recover any stale jobs, keywords, or abandoned queued leads
  await jobRunner.recoverStaleJobsAndKeywords(env.WORKER_STALE_TIMEOUT_MINUTES);
  await jobRunner.recoverStaleOutreachLeads(env.WORKER_STALE_TIMEOUT_MINUTES);

  const jobId = await jobRunner.createJob('CAMPAIGN_SEND', { batchLimit: effectiveBatchLimit });

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

    // 4. Fetch QUALIFIED leads with VALID, DOMAIN_VALID, or MAILBOX_VERIFIED email that have not been contacted yet
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
          inArray(contacts.emailStatus, ['VALID', 'DOMAIN_VALID', 'MAILBOX_VERIFIED']),
          isNotNull(contacts.email)
        )
      )
      .limit(effectiveBatchLimit);

    if (candidateLeads.length === 0) {
      console.log('ℹ️ No qualified leads ready for outreach at this time.');
      await jobRunner.completeJob(jobId, 0);
      return { sent: 0, skipped: 0, errors: 0 };
    }

    // Deduplicate candidate leads by leadId
    const seenLeadIds = new Set<number>();
    const uniqueCandidateLeads = candidateLeads.filter((l) => {
      if (seenLeadIds.has(l.leadId)) return false;
      seenLeadIds.add(l.leadId);
      return true;
    });

    console.log(`📬 Found ${uniqueCandidateLeads.length} unique qualified leads for outreach.`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const lead of uniqueCandidateLeads) {
      if (!lead.email) continue;

      const idempotencyKey = `campaign_${campaign.id}_lead_${lead.leadId}`;

      // Atomic locking / guard:
      // Step A: Check if message already exists with this idempotency key
      const existing = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  [Skip] Message already exists for lead ${lead.leadId} (idempotency enforced)`);
        await db
          .update(leads)
          .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
          .where(eq(leads.id, lead.leadId));
        skippedCount++;
        continue;
      }

      // Step B: Atomically mark lead as QUEUED to prevent concurrent workers from processing the same lead
      const lockResult = await db
        .update(leads)
        .set({ outreachStatus: 'QUEUED', updatedAt: new Date() })
        .where(and(eq(leads.id, lead.leadId), eq(leads.outreachStatus, 'UNPROCESSED')))
        .returning({ id: leads.id });

      if (lockResult.length === 0) {
        console.log(`  [Skip] Lead ${lead.leadId} already locked or processed by another worker`);
        skippedCount++;
        continue;
      }

      console.log(`\n[Outreach] Preparing message for "${lead.channelTitle}" (${lead.email})...`);

      // 5. Gemini Personalization with strict validation
      const DEFAULT_CUSTOM_LINE = 'I really enjoy the direction of your channel content.';
      let customLine = DEFAULT_CUSTOM_LINE;
      let personalizationStatus: 'NONE' | 'CUSTOMIZED' | 'FALLBACK' | 'FAILED' = 'NONE';
      let modelUsed: string | undefined;

      if (campaign.enableGeminiPersonalization) {
        try {
          const aiRes = await geminiService.generateCustomLine({
            channelTitle: lead.channelTitle,
            description: lead.description || undefined,
            subscriberCount: lead.subscriberCount || undefined,
          });

          modelUsed = aiRes.model;
          let candidate = (aiRes.customLine || '').trim();

          // Strip outer quotes (single, double, smart quotes, backticks)
          candidate = candidate.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '').trim();
          candidate = candidate.replace(/[\r\n]+/g, ' ').trim();
          // Purge any em dashes, en dashes, or double hyphens
          candidate = candidate
            .replace(/\s*[—–]\s*/g, ', ')
            .replace(/--+/g, ', ')
            .replace(/,\s*,/g, ', ')
            .replace(/,\s*\./g, '.')
            .trim();

          // Ensure customLine is non-empty and length <= 120 chars
          if (candidate.length > 0 && candidate.length <= 120) {
            customLine = candidate;
            personalizationStatus = aiRes.status;
            console.log(`  Gemini Hook: "${customLine}" (${personalizationStatus})`);
          } else {
            console.warn(`  ⚠️ Gemini hook invalid or exceeds 120 chars (len=${candidate.length}). Using safe default.`);
            customLine = DEFAULT_CUSTOM_LINE;
            personalizationStatus = 'FALLBACK';
          }
        } catch (err: any) {
          console.warn(`  ⚠️ Gemini personalization error: ${err.message}. Using safe default.`);
          customLine = DEFAULT_CUSTOM_LINE;
          personalizationStatus = 'FALLBACK';
        }
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
        if (sendResult.skippedReason === 'RECIPIENT_SUPPRESSED') {
          await db
            .update(leads)
            .set({ outreachStatus: 'UNSUBSCRIBED', suppressionStatus: true, updatedAt: new Date() })
            .where(eq(leads.id, lead.leadId));
        } else {
          // Revert to UNPROCESSED so pipeline checkpoint allows clean retry on next run
          await db
            .update(leads)
            .set({ outreachStatus: 'UNPROCESSED', updatedAt: new Date() })
            .where(eq(leads.id, lead.leadId));
        }
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
