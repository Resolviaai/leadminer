import { db } from '../db/client';
import {
  campaigns,
  leads,
  contacts,
  templates,
  scheduledEmails,
  systemSettings,
  sequences,
  sequenceSteps,
  leadSequenceProgress,
  messages,
} from '../db/schema';
import { eq, inArray, sql, and } from 'drizzle-orm';
import { templateEngine } from '../services/outreach/template.engine';
import { geminiService } from '../services/ai/gemini.service';
import { gmailSendingService } from '../services/outreach/gmail.service';
import { runReplySync } from './replies.worker';
import { sequenceService } from '../services/outreach/sequence.service';
import { telegramService } from '../services/notifications/telegram.service';

export interface DispatcherResult {
  dispatched: number;
  failed: number;
  skipped: number;
  details?: string;
}

/**
 * Computes 9:15 AM Eastern Time on the next day, dynamically converted to UTC.
 */
export function getNextMorning915ET(referenceDate = new Date()): Date {
  const tomorrow = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = etFormatter.formatToParts(tomorrow);
  const etHour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const etMinute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const tomorrowUtcMinutes = tomorrow.getUTCHours() * 60 + tomorrow.getUTCMinutes();
  const etTomorrowMinutes = etHour * 60 + etMinute;
  let etOffsetMinutes = etTomorrowMinutes - tomorrowUtcMinutes;
  if (etOffsetMinutes > 720) etOffsetMinutes -= 1440;
  if (etOffsetMinutes < -720) etOffsetMinutes += 1440;

  const targetUtcMinutes = 9 * 60 + 15 - etOffsetMinutes;
  const targetUtcHours = Math.floor(targetUtcMinutes / 60);
  const targetUtcMins = targetUtcMinutes % 60;
  return new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), targetUtcHours, targetUtcMins, 0));
}

/**
 * Lightweight Dispatcher Worker (Sequence v2)
 * Invoked every 15 minutes (via cron-job.org).
 *
 * Responsibilities:
 * 1. Pre-dispatch Reply Sync: Runs reply sync first to guarantee < 15m reply cancellation window.
 * 2. Claims due emails atomically using PostgreSQL FOR UPDATE SKIP LOCKED.
 * 3. Enforces in-flight safety check against lead outreach status (REPLIED, UNSUBSCRIBED, BOUNCED).
 * 4. Resolves step-specific template from sequence_steps.
 * 5. Handles in-thread email bumping (Re: Subject, In-Reply-To, References, threadId).
 * 6. Dispatches via pinned Gmail account and advances the state machine.
 */
export async function runDispatcher(batchLimit = 3): Promise<DispatcherResult> {
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

  // 2. Pre-Dispatch Inbound Reply Sync (Shrinks cancellation latency to < 15m)
  try {
    const syncRes = await runReplySync();
    if (syncRes && syncRes.repliesDetected > 0) {
      console.log(`📥 [Dispatcher Pre-Sync] Detected and processed ${syncRes.repliesDetected} new replies.`);
    }
  } catch (e: any) {
    console.warn('[Dispatcher Pre-Sync Non-Fatal]:', e.message);
  }

  // 3. Atomic Row Claiming via FOR UPDATE SKIP LOCKED
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

    // In-Flight Micro-Delay between emails in the same batch (10–18 seconds natural jitter)
    if (i > 0) {
      const pauseMs = Math.round(10000 + Math.random() * 8000);
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
      const remainingClaimed = claimedRows.slice(i);
      await db
        .update(scheduledEmails)
        .set({
          status: 'PENDING',
          attempts: sql`GREATEST(0, ${scheduledEmails.attempts} - 1)`,
          updatedAt: new Date(),
        })
        .where(inArray(scheduledEmails.id, remainingClaimed));
      break;
    }

    // Fetch full details for the claimed scheduled email
    const fullDetails = await db
      .select({
        scheduledId: scheduledEmails.id,
        attempts: scheduledEmails.attempts,
        stepNumber: scheduledEmails.stepNumber,
        inReplyToRfcId: scheduledEmails.inReplyToRfcId,
        gmailAccountId: scheduledEmails.gmailAccountId,
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
        campaignStatus: campaigns.status,
        campaignTemplateId: campaigns.templateId,
        enableGeminiPersonalization: campaigns.enableGeminiPersonalization,
        sequenceId: leadSequenceProgress.sequenceId,
        threadId: leadSequenceProgress.threadId,
        lastRfc822Id: leadSequenceProgress.lastRfc822MessageId,
        referencesChain: leadSequenceProgress.referencesChain,
        progressStatus: leadSequenceProgress.status,
      })
      .from(scheduledEmails)
      .innerJoin(leads, eq(scheduledEmails.leadId, leads.id))
      .innerJoin(contacts, eq(scheduledEmails.contactId, contacts.id))
      .innerJoin(campaigns, eq(scheduledEmails.campaignId, campaigns.id))
      .leftJoin(
        leadSequenceProgress,
        and(
          eq(scheduledEmails.contactId, leadSequenceProgress.contactId),
          eq(scheduledEmails.leadId, leadSequenceProgress.leadId)
        )
      )
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

    // A campaign can be paused after rows were planned. Re-check its state at
    // dispatch time so the Pause control stops already-queued sends too.
    if (item.campaignStatus && item.campaignStatus !== 'ACTIVE') {
      await db
        .update(scheduledEmails)
        .set({ status: 'CANCELLED', error: `Campaign status is ${item.campaignStatus}`, updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      skippedCount++;
      continue;
    }

    // In-Flight Safety Check: If lead has already replied, unsubscribed, or bounced, abort!
    if (['REPLIED', 'UNSUBSCRIBED', 'BOUNCED'].includes(item.leadOutreachStatus)) {
      console.log(`ℹ️ [Dispatcher] Lead #${item.leadId} is ${item.leadOutreachStatus}. Cancelling scheduled email.`);
      await db
        .update(scheduledEmails)
        .set({ status: 'CANCELLED', error: `Lead status is ${item.leadOutreachStatus}`, updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      skippedCount++;
      continue;
    }

    // In-Flight Safety Check: If sequence progress is COMPLETED, CANCELLED, or PAUSED, abort!
    if (item.progressStatus && ['COMPLETED', 'CANCELLED', 'PAUSED'].includes(item.progressStatus)) {
      console.log(`ℹ️ [Dispatcher] Lead #${item.leadId} sequence progress is ${item.progressStatus}. Cancelling scheduled email.`);
      await db
        .update(scheduledEmails)
        .set({ status: 'CANCELLED', error: `Sequence progress is ${item.progressStatus}`, updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      skippedCount++;
      continue;
    }

    // Resolve Step Template
    let templateId = item.campaignTemplateId || 1;
    if (item.sequenceId) {
      const stepRow = await db
        .select({ templateId: sequenceSteps.templateId })
        .from(sequenceSteps)
        .where(
          and(
            eq(sequenceSteps.sequenceId, item.sequenceId),
            eq(sequenceSteps.stepNumber, item.stepNumber)
          )
        )
        .limit(1);

      if (stepRow.length > 0 && stepRow[0].templateId) {
        templateId = stepRow[0].templateId;
      }
    }

    const templateRecord = await db
      .select()
      .from(templates)
      .where(eq(templates.id, templateId))
      .limit(1);

    if (templateRecord.length === 0) {
      console.error(`❌ Template ID ${templateId} not found.`);
      await db
        .update(scheduledEmails)
        .set({ status: 'FAILED', error: 'Template not found', updatedAt: new Date() })
        .where(eq(scheduledEmails.id, scheduledId));
      failedCount++;
      continue;
    }

    const template = templateRecord[0];

    // Gemini Personalization (if enabled and on Step 1)
    const DEFAULT_CUSTOM_LINE = 'I really enjoy the direction of your channel content.';
    let customLine = DEFAULT_CUSTOM_LINE;
    let personalizationStatus: 'NONE' | 'CUSTOMIZED' | 'FALLBACK' | 'FAILED' = 'NONE';
    let modelUsed: string | undefined;

    if (item.enableGeminiPersonalization && item.stepNumber === 1) {
      try {
        const aiRes = await geminiService.generateCustomLine({
          channelTitle: item.channelTitle,
          description: item.description || undefined,
          subscriberCount: item.subscriberCount || undefined,
        });

        modelUsed = aiRes.model;
        let candidate = (aiRes.customLine || '').trim();
        candidate = candidate.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '').trim();
        candidate = candidate.replace(/[\r\n]+/g, ' ').trim();

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
    // BUG-10: pass leadId as seed so retries produce identical wording for the same lead
    const firstName = templateEngine.extractFirstName(item.channelTitle, true);
    const renderedSubject = templateEngine.render(template.subject, {
      first_name: firstName,
      channel_name: item.channelTitle,
      subscriber_count: item.subscriberCount || 0,
    }, item.leadId);

    const renderedBody = templateEngine.render(template.body, {
      first_name: firstName,
      channel_name: item.channelTitle,
      channel_url: item.channelUrl,
      subscriber_count: item.subscriberCount || 0,
      website: item.website || '',
      custom_line: customLine,
    }, item.leadId);

    // In-Thread Subject Bumping for Follow-Up Steps (2..N), sanitize Step 1 (P3-4 / Bug #1 & #2)
    let finalSubject = renderedSubject;
    if (item.stepNumber > 1) {
      // Look up Step 1's actual sent subject to guarantee Gmail conversation threading!
      const step1Msg = await db
        .select({ subject: messages.subject })
        .from(messages)
        .where(
          and(
            eq(messages.campaignId, item.campaignId),
            eq(messages.leadId, item.leadId),
            eq(messages.contactId, item.contactId),
            eq(messages.stepNumber, 1),
            eq(messages.sendStatus, 'SENT')
          )
        )
        .limit(1);

      const baseSubject = (step1Msg.length > 0 && step1Msg[0].subject ? step1Msg[0].subject : renderedSubject).trim();
      const isAlreadyRe = baseSubject.toLowerCase().startsWith('re:');
      finalSubject = isAlreadyRe ? baseSubject : `Re: ${baseSubject}`;
    } else {
      finalSubject = templateEngine.sanitizeSubject(renderedSubject, 1);
    }

    const idempotencyKey = `camp_${item.campaignId}_lead_${item.leadId}_cnt_${item.contactId}_step_${item.stepNumber}`;

    // In-flight safety re-check: Verify row wasn't cancelled right before live send
    const [freshScheduled] = await db
      .select({ status: scheduledEmails.status })
      .from(scheduledEmails)
      .where(eq(scheduledEmails.id, scheduledId))
      .limit(1);

    if (freshScheduled?.status === 'CANCELLED') {
      console.log(`ℹ️ [Dispatcher] Scheduled email #${scheduledId} was cancelled in-flight. Aborting send.`);
      skippedCount++;
      continue;
    }

    // Send via Gmail Service with strict inbox affinity and threading headers
    console.log(
      `✉️ [Dispatcher] Sending Step ${item.stepNumber} to "${item.channelTitle}" (${item.recipientEmail}) via Account #${item.gmailAccountId}...`
    );

    const sendResult = await gmailSendingService.sendEmail({
      leadId: item.leadId,
      campaignId: item.campaignId,
      templateId: template.id,
      contactId: item.contactId,
      recipientEmail,
      subject: finalSubject,
      body: renderedBody,
      idempotencyKey,
      stepNumber: item.stepNumber,
      pinnedAccountId: item.gmailAccountId,
      inReplyToRfcId: item.inReplyToRfcId || item.lastRfc822Id || undefined,
      referencesChain: item.referencesChain || undefined,
      threadId: item.threadId || undefined,
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

      console.log(`  ✅ Dispatched Step ${item.stepNumber} successfully (ID: ${sendResult.messageId || 'simulated'})`);

      // Advance State Machine in Sequence Engine
      if (item.sequenceId) {
        try {
          await sequenceService.advanceLeadSequence({
            leadId: item.leadId,
            contactId: item.contactId,
            campaignId: item.campaignId,
            sequenceId: item.sequenceId,
            stepNumber: item.stepNumber,
            pinnedAccountId: item.gmailAccountId,
            threadId: sendResult.threadId || item.threadId || '',
            rfc822MessageId: sendResult.rfc822MessageId || '',
            referencesChain: sendResult.referencesChain || item.referencesChain || undefined,
          });
        } catch (advErr: any) {
          console.warn(`  ⚠️ Could not advance sequence for Lead #${item.leadId}:`, advErr.message);
        }
      }
    } else {
      failedCount++;
      const errorMessage = sendResult.error || sendResult.skippedReason || 'Send failed';
      console.error(`  ❌ Send failed: ${errorMessage}`);

      // BUG-08: Daily Quota Exhaustion Deferral
      // If no healthy account or account daily limit hit, defer to next morning 9:15 AM ET
      // without burning the 3-attempt strike budget!
      if (sendResult.skippedReason === 'NO_HEALTHY_GMAIL_ACCOUNT') {
        console.warn(`  ⚠️ Daily sending quota reached for account(s). Rescheduling to tomorrow 9:15 AM ET.`);
        const retryTime = getNextMorning915ET();

        await db
          .update(scheduledEmails)
          .set({
            status: 'PENDING',
            attempts: sql`GREATEST(0, ${scheduledEmails.attempts} - 1)`,
            scheduledAt: retryTime,
            scheduledDate: gmailSendingService.getPacificDateStr(retryTime),
            deferReason: 'DAILY_QUOTA_EXHAUSTED',
            error: 'Daily quota exhausted; deferred to next morning 9:15 AM ET',
            updatedAt: new Date(),
          })
          .where(eq(scheduledEmails.id, scheduledId));

        // Release any other claimed rows in this batch back to PENDING and restore attempt counts
        const remainingClaimed = claimedRows.slice(i + 1);
        if (remainingClaimed.length > 0) {
          await db
            .update(scheduledEmails)
            .set({
              status: 'PENDING',
              attempts: sql`GREATEST(0, ${scheduledEmails.attempts} - 1)`,
              updatedAt: new Date(),
            })
            .where(inArray(scheduledEmails.id, remainingClaimed));
        }

        // Halt rest of current dispatch batch
        break;
      }

      // Retry policy: if attempts < 3 and error is transient, postpone.
      // BUG-01: Treat post-send verification failure and unconfirmed states as terminal to prevent duplicate sends!
      const isTerminalFailure =
        sendResult.skippedReason === 'POST_SEND_VERIFICATION_FAILED' ||
        sendResult.skippedReason === 'RECIPIENT_SUPPRESSED' ||
        sendResult.skippedReason === 'MESSAGE_PREVIOUSLY_UNCONFIRMED' ||
        sendResult.skippedReason === 'RECIPIENT_ALREADY_CONTACTED';

      const isRateLimited =
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('ratelimit') ||
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('quota exceeded') ||
        errorMessage.toLowerCase().includes('userratelimitexceeded') ||
        errorMessage.toLowerCase().includes('resource_exhausted');

      const maxAttempts = 3;

      if (isRateLimited) {
        console.warn(`  ⚠️ Rate limit detected for account #${item.gmailAccountId}. Halting batch and applying backoff.`);
        await telegramService.notifyCriticalError(
          'Gmail API Rate Limit (429)',
          `Account #${item.gmailAccountId} hit rate limits (${errorMessage}). Dispatched batch halted, backing off pending sends by 30+ minutes.`
        );

        // Exponential backoff for this email: 30m, 60m, 120m
        const backoffMs = Math.pow(2, Math.max(0, item.attempts - 1)) * 30 * 60 * 1000;
        const retryTime = new Date(Date.now() + backoffMs);

        await db
          .update(scheduledEmails)
          .set({
            status: item.attempts >= maxAttempts ? 'FAILED' : 'PENDING',
            scheduledAt: retryTime,
            scheduledDate: gmailSendingService.getPacificDateStr(retryTime),
            error: `Rate limited: ${errorMessage}`,
            updatedAt: new Date(),
          })
          .where(eq(scheduledEmails.id, scheduledId));

        // Delay other pending emails on this account by 30m to let rate limit cool down
        const coolDownTime = new Date(Date.now() + 30 * 60 * 1000);
        await db
          .update(scheduledEmails)
          .set({
            scheduledAt: sql`GREATEST(${scheduledEmails.scheduledAt}, ${coolDownTime})`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(scheduledEmails.gmailAccountId, item.gmailAccountId),
              eq(scheduledEmails.status, 'PENDING')
            )
          );

        // Release any other claimed rows in this batch before breaking
        const remainingClaimed = claimedRows.slice(i + 1);
        if (remainingClaimed.length > 0) {
          await db
            .update(scheduledEmails)
            .set({
              status: 'PENDING',
              attempts: sql`GREATEST(0, ${scheduledEmails.attempts} - 1)`,
              updatedAt: new Date(),
            })
            .where(inArray(scheduledEmails.id, remainingClaimed));
        }

        // Halt rest of current dispatch batch
        break;
      }

      if (item.attempts < maxAttempts && !isTerminalFailure) {
        const retryTime = new Date(Date.now() + 10 * 60 * 1000);
        await db
          .update(scheduledEmails)
          .set({
            status: 'PENDING',
            scheduledAt: retryTime,
            scheduledDate: gmailSendingService.getPacificDateStr(retryTime),
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
