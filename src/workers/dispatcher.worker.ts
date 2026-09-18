import { db } from '../db/client';
import {
  campaigns,
  leads,
  contacts,
  templates,
  scheduledEmails,
  systemSettings,
} from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { templateEngine } from '../services/outreach/template.engine';
import { geminiService } from '../services/ai/gemini.service';
import { gmailSendingService } from '../services/outreach/gmail.service';

export interface DispatcherResult {
  dispatched: number;
  failed: number;
  skipped: number;
  details?: string;
}

/**
 * Lightweight Dispatcher Worker
 * Invoked every 10–15 minutes (via cron-job.org or timer).
 *
 * Responsibilities:
 * 1. Claims up to 2 due emails atomically using PostgreSQL FOR UPDATE SKIP LOCKED.
 * 2. Applies Gemini personalization (if enabled) & renders template with Spintax rotation.
 * 3. Sends email via Gmail API.
 * 4. Applies in-flight micro-delay (15-30s) if sending multiple emails in the same invocation.
 * 5. Updates scheduled_emails table to SENT or FAILED.
 * 6. Finishes execution quickly (< 5s for 1 email, < 25s for 2 emails).
 */
export async function runDispatcher(batchLimit = 2): Promise<DispatcherResult> {
  // 1. Mandatory Kill Switch Check
  const killSwitchRecord = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'kill_switch'))
    .limit(1);

  if (killSwitchRecord.length > 0 && (killSwitchRecord[0].value as any)?.enabled) {
    console.warn('⛔ [Kill Switch Active] Outreach halted by emergency stop.');
    return { dispatched: 0, failed: 0, skipped: 0, details: 'Kill switch active' };
  }

  // 2. Atomic Row Claiming via FOR UPDATE SKIP LOCKED
  // Finds emails where scheduled_at <= NOW() and status = 'PENDING'
  const claimedRows = await db.transaction(async (tx) => {
    const candidateIdsResult = await tx.execute<{ id: number }>(sql`
      SELECT id FROM ${scheduledEmails}
      WHERE ${scheduledEmails.status} = 'PENDING'
        AND ${scheduledEmails.scheduledAt} <= NOW()
      ORDER BY ${scheduledEmails.scheduledAt} ASC
      LIMIT ${batchLimit}
      FOR UPDATE SKIP LOCKED
    `);

    const claimedIds = candidateIdsResult.rows.map((r) => Number(r.id));
    if (claimedIds.length === 0) {
      return [];
    }

    // Mark claimed rows as SENDING
    await tx
      .update(scheduledEmails)
      .set({
        status: 'SENDING',
        attempts: sql`${scheduledEmails.attempts} + 1`,
        updatedAt: new Date(),
      })
      .where(inArray(scheduledEmails.id, claimedIds));

    return claimedIds;
  });

  if (claimedRows.length === 0) {
    return { dispatched: 0, failed: 0, skipped: 0, details: 'No scheduled emails due at this time.' };
  }

  console.log(`[Dispatcher] Claimed ${claimedRows.length} due email(s) for immediate dispatch.`);

  let dispatchedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < claimedRows.length; i++) {
    const scheduledId = claimedRows[i];

    // In-Flight Micro-Delay between emails in the same batch (30–45 seconds)
    if (i > 0) {
      const pauseMs = Math.round(30000 + Math.random() * 15000);
      console.log(`⏳ [Micro-Delay] Pausing natural ${Math.round(pauseMs / 1000)}s between consecutive sends...`);
      await new Promise((resolve) => setTimeout(resolve, pauseMs));
    }

    // Active Kill Switch Check before each send
    const activeKill = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'kill_switch'))
      .limit(1);
    if (activeKill.length > 0 && (activeKill[0].value as any)?.enabled) {
      console.warn('⛔ [Kill Switch Active] Mid-dispatch emergency stop.');
      // Revert this row to PENDING
      await db
        .update(scheduledEmails)
        .set({ status: 'PENDING', updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      break;
    }

    // Fetch full details for the claimed scheduled email
    const fullDetails = await db
      .select({
        scheduledId: scheduledEmails.id,
        attempts: scheduledEmails.attempts,
        leadId: leads.id,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        website: leads.website,
        description: leads.description,
        leadOutreachStatus: leads.outreachStatus,
        contactId: contacts.id,
        recipientEmail: contacts.email,
        campaignId: campaigns.id,
        enableGeminiPersonalization: campaigns.enableGeminiPersonalization,
        templateId: campaigns.templateId,
      })
      .from(scheduledEmails)
      .innerJoin(leads, eq(scheduledEmails.leadId, leads.id))
      .innerJoin(contacts, eq(scheduledEmails.contactId, contacts.id))
      .innerJoin(campaigns, eq(scheduledEmails.campaignId, campaigns.id))
      .where(eq(scheduledEmails.id, scheduledId))
      .limit(1);

    const item = fullDetails[0];
    if (!item || !item.recipientEmail) {
      console.warn(`⚠️ [Dispatcher] Missing details or email for scheduled row ${scheduledId}. Marking FAILED.`);
      await db
        .update(scheduledEmails)
        .set({ status: 'FAILED', error: 'Missing contact or lead details', updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      failedCount++;
      continue;
    }

    const recipientEmail: string = item.recipientEmail;

    // If lead has already replied or unsubscribed, cancel this email
    if (item.leadOutreachStatus === 'REPLIED' || item.leadOutreachStatus === 'UNSUBSCRIBED') {
      console.log(`ℹ️ [Dispatcher] Lead ${item.leadId} is ${item.leadOutreachStatus}. Cancelling scheduled email.`);
      await db
        .update(scheduledEmails)
        .set({ status: 'CANCELLED', error: `Lead status is ${item.leadOutreachStatus}`, updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      skippedCount++;
      continue;
    }

    // Fetch template
    const templateRecord = await db
      .select()
      .from(templates)
      .where(eq(templates.id, item.templateId || 1))
      .limit(1);

    if (templateRecord.length === 0) {
      console.error(`❌ Template ID ${item.templateId} not found.`);
      await db
        .update(scheduledEmails)
        .set({ status: 'FAILED', error: 'Template not found', updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      failedCount++;
      continue;
    }

    const template = templateRecord[0];

    // Gemini Personalization (if enabled)
    const DEFAULT_CUSTOM_LINE = 'I really enjoy the direction of your channel content.';
    let customLine = DEFAULT_CUSTOM_LINE;
    let personalizationStatus: 'NONE' | 'CUSTOMIZED' | 'FALLBACK' | 'FAILED' = 'NONE';
    let modelUsed: string | undefined;

    if (item.enableGeminiPersonalization) {
      try {
        const aiRes = await geminiService.generateCustomLine({
          channelTitle: item.channelTitle,
          description: item.description || undefined,
          subscriberCount: item.subscriberCount || undefined,
        });

        modelUsed = aiRes.model;
        let candidate = (aiRes.customLine || '').trim();

        // Clean quotes and linebreaks
        candidate = candidate.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '').trim();
        candidate = candidate.replace(/[\r\n]+/g, ' ').trim();
        candidate = candidate
          .replace(/\s*[—–]\s*/g, ', ')
          .replace(/--+/g, ', ')
          .replace(/,\s*,/g, ', ')
          .replace(/,\s*\./g, '.')
          .trim();

        if (candidate.length > 0 && candidate.length <= 120) {
          customLine = candidate;
          personalizationStatus = aiRes.status;
        } else {
          customLine = DEFAULT_CUSTOM_LINE;
          personalizationStatus = 'FALLBACK';
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Gemini hook error: ${err.message}. Using safe default.`);
        customLine = DEFAULT_CUSTOM_LINE;
        personalizationStatus = 'FALLBACK';
      }
    }

    // Render Template (resolves variables and applies Spintax word rotation)
    const firstName = templateEngine.extractFirstName(item.channelTitle);
    const renderedSubject = templateEngine.render(template.subject, {
      first_name: firstName,
      channel_name: item.channelTitle,
      subscriber_count: item.subscriberCount || 0,
    });

    const renderedBody = templateEngine.render(template.body, {
      first_name: firstName,
      channel_name: item.channelTitle,
      channel_url: item.channelUrl,
      subscriber_count: item.subscriberCount || 0,
      website: item.website || '',
      custom_line: customLine,
    });

    const idempotencyKey = `sched_${item.scheduledId}_c_${item.campaignId}_l_${item.leadId}_cnt_${item.contactId}`;

    // Send via Gmail Service
    console.log(`✉️ [Dispatcher] Sending to "${item.channelTitle}" (${item.recipientEmail})...`);
    const sendResult = await gmailSendingService.sendEmail({
      leadId: item.leadId,
      campaignId: item.campaignId,
      templateId: template.id,
      contactId: item.contactId,
      recipientEmail,
      subject: renderedSubject,
      body: renderedBody,
      idempotencyKey,
      personalizationStatus,
      personalizationModel: modelUsed,
    });

    if (sendResult.success) {
      dispatchedCount++;
      await db
        .update(scheduledEmails)
        .set({
          status: 'SENT',
          sentMessageId: sendResult.messageId || null,
          updatedAt: new Date(),
        })
        .where(eq(scheduledEmails.id, scheduledId));

      console.log(`  ✅ Dispatched successfully (ID: ${sendResult.messageId || 'simulated'})`);
    } else {
      failedCount++;
      const errorMessage = sendResult.error || sendResult.skippedReason || 'Send failed';
      console.error(`  ❌ Send failed: ${errorMessage}`);

      // Retry policy: if attempts < 3 and error is transient, postpone 10 minutes
      const maxAttempts = 3;
      if (item.attempts < maxAttempts && sendResult.skippedReason !== 'RECIPIENT_SUPPRESSED') {
        const retryTime = new Date(Date.now() + 10 * 60 * 1000);
        await db
          .update(scheduledEmails)
          .set({
            status: 'PENDING',
            scheduledAt: retryTime,
            error: errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(scheduledEmails.id, scheduledId));
      } else {
        await db
          .update(scheduledEmails)
          .set({
            status: 'FAILED',
            error: errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(scheduledEmails.id, scheduledId));
      }
    }
  }

  return {
    dispatched: dispatchedCount,
    failed: failedCount,
    skipped: skippedCount,
    details: `Dispatched ${dispatchedCount} email(s), ${failedCount} failed, ${skippedCount} skipped.`,
  };
}

if (require.main === module) {
  runDispatcher()
    .then((res) => {
      console.log(res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal dispatcher error:', err);
      process.exit(1);
    });
}
