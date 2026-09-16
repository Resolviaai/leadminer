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
    // 2. Fetch Active Campaigns (STRICT: Never fall back to draft or inactive campaigns)
    const activeCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, 'ACTIVE')).limit(5);

    if (activeCampaigns.length === 0) {
      console.log('ℹ️ [Outreach] No campaigns currently marked ACTIVE. Halting outreach (will not send without an ACTIVE campaign).');
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

    // 4. Determine allowed email verification statuses for outreach.
    // Supports verified deliverable emails: MAILBOX_VERIFIED, VALID, and DOMAIN_VALID (major providers).
    const allowedEmailStatuses: ('MAILBOX_VERIFIED' | 'VALID' | 'DOMAIN_VALID')[] = env.ALLOW_DOMAIN_VALID_OUTREACH
      ? ['MAILBOX_VERIFIED', 'VALID', 'DOMAIN_VALID']
      : ['MAILBOX_VERIFIED', 'VALID'];

    // Fetch contacts already sent/sending in this active campaign to avoid duplicates across all runs
    const sentMessages = await db
      .select({
        leadId: messages.leadId,
        contactId: messages.contactId,
        recipientEmail: sql<string>`lower(trim(${messages.recipientEmail}))`.as('clean_email'),
      })
      .from(messages)
      .where(
        and(
          eq(messages.campaignId, campaign.id),
          inArray(messages.sendStatus, ['SENT', 'SENDING', 'UNCONFIRMED'])
        )
      );

    const sentContactIds = new Set<number>();
    const sentEmailKeys = new Set<string>();
    for (const sm of sentMessages) {
      if (sm.contactId) {
        sentContactIds.add(sm.contactId);
      }
      if (sm.leadId && sm.recipientEmail) {
        sentEmailKeys.add(`${sm.leadId}_${sm.recipientEmail}`);
      }
    }

    // Fetch QUALIFIED leads with allowed email status
    const candidateLeads = await db
      .select({
        leadId: leads.id,
        contactId: contacts.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        website: leads.website,
        description: leads.description,
        email: contacts.email,
        leadOutreachStatus: leads.outreachStatus,
      })
      .from(leads)
      .innerJoin(contacts, eq(leads.id, contacts.leadId))
      .where(
        and(
          eq(leads.qualificationStatus, 'QUALIFIED'),
          eq(leads.suppressionStatus, false),
          inArray(contacts.emailStatus, allowedEmailStatuses),
          isNotNull(contacts.email)
        )
      )
      .limit(effectiveBatchLimit * 4);

    // Filter out contacts that were already sent to for this campaign
    const unsentCandidates = candidateLeads.filter((c) => {
      if (!c.email) return false;
      const cleanEmail = c.email.toLowerCase().trim();
      if (sentContactIds.has(c.contactId)) return false;
      if (sentEmailKeys.has(`${c.leadId}_${cleanEmail}`)) return false;
      return true;
    });

    if (unsentCandidates.length === 0) {
      console.log('ℹ️ No qualified leads ready for outreach at this time.');
      await jobRunner.completeJob(jobId, 0);
      return { sent: 0, skipped: 0, errors: 0 };
    }

    // Deduplicate candidate contacts by (leadId, email) so we don't send duplicate emails to the same address,
    // while fully preserving multi-email outreach across all unique verified emails for a creator.
    const seenContactEmails = new Set<string>();
    const uniqueCandidateContacts: typeof unsentCandidates = [];
    for (const c of unsentCandidates) {
      const key = `${c.leadId}_${c.email?.toLowerCase().trim()}`;
      if (!seenContactEmails.has(key)) {
        seenContactEmails.add(key);
        uniqueCandidateContacts.push(c);
      }
      if (uniqueCandidateContacts.length >= effectiveBatchLimit) {
        break;
      }
    }

    console.log(`📬 Found ${uniqueCandidateContacts.length} verified candidate contacts for outreach.`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const lead of uniqueCandidateContacts) {
      if (!lead.email) continue;

      // Active Kill Switch Panic Check before each message dispatch
      const activeKillSwitch = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'kill_switch'))
        .limit(1);
      if (activeKillSwitch.length > 0 && (activeKillSwitch[0].value as any)?.enabled) {
        console.warn('⛔ [Kill Switch Active] Outreach was halted mid-batch by user emergency stop.');
        break;
      }

      const idempotencyKey = `campaign_${campaign.id}_lead_${lead.leadId}_contact_${lead.contactId}`;

      // Atomic locking / guard:
      // Step A: Check if message already exists with this idempotency key
      const existing = await db
        .select({ id: messages.id, sendStatus: messages.sendStatus, createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing.length > 0) {
        if (existing[0].sendStatus === 'SENT') {
          console.log(`  [Skip] Message already SENT for contact ${lead.contactId} (idempotency enforced)`);
          await db
            .update(leads)
            .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
            .where(eq(leads.id, lead.leadId));
          skippedCount++;
          continue;
        } else if (existing[0].sendStatus === 'SENDING') {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (existing[0].createdAt && existing[0].createdAt > fiveMinutesAgo) {
            console.log(`  [Skip] Message currently SENDING for contact ${lead.contactId} (in-flight)`);
            skippedCount++;
            continue;
          }
        }
      }

      // Step B: Mark lead as QUEUED if it was UNPROCESSED to signal activity
      if (lead.leadOutreachStatus === 'UNPROCESSED') {
        await db
          .update(leads)
          .set({ outreachStatus: 'QUEUED', updatedAt: new Date() })
          .where(and(eq(leads.id, lead.leadId), eq(leads.outreachStatus, 'UNPROCESSED')));
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
        contactId: lead.contactId,
        recipientEmail: lead.email,
        subject: renderedSubject,
        body: renderedBody,
        idempotencyKey,
        personalizationStatus,
        personalizationModel: modelUsed,
      });

      if (sendResult.success) {
        sentCount++;
        if (sendResult.simulated) {
          console.log(`  [SIMULATED] Dry-run send simulated for ${lead.email} (Message ID: ${sendResult.messageId})`);
          await jobRunner.logEvent(
            jobId,
            'SIMULATION_COMPLETED',
            'INFO',
            `[DRY RUN] Simulated outreach to ${lead.email} (${lead.channelTitle}) - no real email dispatched`,
            {
              leadId: lead.leadId,
              campaignId: campaign.id,
              messageId: sendResult.messageId,
              simulated: true,
            }
          );
        } else {
          console.log(
            `  ✅ Sent successfully (From: ${sendResult.senderEmail || 'connected inbox'}, Message ID: ${sendResult.messageId})`
          );
          await jobRunner.logEvent(
            jobId,
            'MESSAGE_SENT',
            'INFO',
            `SENT From: ${sendResult.senderEmail || 'connected inbox'} To: ${lead.email} | Gmail Message ID: ${sendResult.messageId} | Thread ID: ${sendResult.threadId}`,
            {
              leadId: lead.leadId,
              campaignId: campaign.id,
              messageId: sendResult.messageId,
              threadId: sendResult.threadId,
              senderEmail: sendResult.senderEmail,
            }
          );
        }
      } else {
        errorCount++;
        console.error(`  ❌ Send failed: ${sendResult.error || sendResult.skippedReason}`);
        if (sendResult.skippedReason === 'RECIPIENT_SUPPRESSED') {
          await db
            .update(leads)
            .set({ outreachStatus: 'UNSUBSCRIBED', suppressionStatus: true, updatedAt: new Date() })
            .where(eq(leads.id, lead.leadId));
        } else if (sendResult.skippedReason === 'POST_SEND_VERIFICATION_FAILED') {
          // Terminal unconfirmed state: lead is already locked as CONTACTED in gmail service to prevent duplicates
          console.warn(`  [Unconfirmed State] Lead ${lead.leadId} held in non-retryable unconfirmed state.`);
        } else if (sendResult.skippedReason === 'IN_FLIGHT_SENDING') {
          // Leave lead in current state; active worker is currently dispatching
          console.log(`  [In-Flight] Lead ${lead.leadId} is already being dispatched by an active worker.`);
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
