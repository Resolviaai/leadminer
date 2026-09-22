import { db } from '../../db/client';
import { jobs, keywords, logs, leads, messages, scheduledEmails } from '../../db/schema';
import { eq, and, lt, sql, inArray } from 'drizzle-orm';
import { env } from '../../config/env';

export class JobRunner {
  public async createJob(jobType: string, parameters: Record<string, any> = {}): Promise<number> {
    try {
      // BUG-24: Guard against runaway RUNNING rows — if >5 jobs of this type are already
      // RUNNING (e.g. because serverless crashes left them stuck), supersede the oldest ones.
      // This prevents the jobs table from accumulating thousands of ghost RUNNING rows.
      const MAX_CONCURRENT = 5;
      const stuck = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.jobType, jobType), eq(jobs.status, 'RUNNING')))
        .orderBy(jobs.id) // oldest first
        .limit(MAX_CONCURRENT + 1);

      if (stuck.length >= MAX_CONCURRENT) {
        const toSupersede = stuck.slice(0, stuck.length - MAX_CONCURRENT + 1).map((r) => r.id);
        await db
          .update(jobs)
          .set({ status: 'FAILED', error: 'Superseded by new job (max concurrent limit)', updatedAt: new Date() })
          .where(inArray(jobs.id, toSupersede));
        console.warn(`[JobRunner] Superseded ${toSupersede.length} stuck RUNNING ${jobType} job(s).`);
      }

      const [inserted] = await db
        .insert(jobs)
        .values({
          jobType,
          status: 'RUNNING',
          parameters,
          startedAt: new Date(),
          lastHeartbeat: new Date(),
        })
        .returning({ id: jobs.id });

      await this.logEvent(inserted.id, 'JOB_STARTED', 'INFO', `Started job ${jobType}`, parameters);
      return inserted.id;
    } catch (e: any) {
      console.error(`[JobRunner] Failed to create job ${jobType}:`, e.message);
      return -1;
    }
  }

  public async updateHeartbeat(jobId: number, processed: number, failed: number): Promise<void> {
    if (jobId <= 0) return;
    try {
      await db
        .update(jobs)
        .set({
          itemsProcessed: processed,
          itemsFailed: failed,
          lastHeartbeat: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
    } catch (e) {
      // Non-critical telemetry update
    }
  }

  public async completeJob(jobId: number, totalProcessed: number): Promise<void> {
    if (jobId <= 0) return;
    try {
      await db
        .update(jobs)
        .set({
          status: 'COMPLETED',
          itemsProcessed: totalProcessed,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));

      await this.logEvent(jobId, 'JOB_COMPLETED', 'INFO', `Completed job with ${totalProcessed} processed items`);
    } catch (e) {
      // Non-critical
    }
  }

  public async stopJobQuota(jobId: number, reason: string): Promise<void> {
    if (jobId <= 0) return;
    try {
      await db
        .update(jobs)
        .set({
          status: 'STOPPED_QUOTA',
          error: reason,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));

      await this.logEvent(jobId, 'QUOTA_REACHED', 'WARN', `Job stopped due to quota: ${reason}`);
    } catch (e) {
      // Non-critical
    }
  }

  public async failJob(jobId: number, error: string): Promise<void> {
    if (jobId <= 0) return;
    try {
      await db
        .update(jobs)
        .set({
          status: 'FAILED',
          error,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));

      await this.logEvent(jobId, 'JOB_FAILED', 'ERROR', `Job failed: ${error}`);
    } catch (e) {
      // Non-critical
    }
  }

  public async logEvent(jobId: number | null, eventType: string, level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL', message: string, metadata: any = {}): Promise<void> {
    try {
      await db.insert(logs).values({
        jobId: jobId && jobId > 0 ? jobId : null,
        eventType,
        level,
        message,
        metadata,
      });
    } catch (e) {
      console.log(`[${level}] ${eventType}: ${message}`);
    }
  }

  public async recoverStaleJobsAndKeywords(timeoutMinutes = 30): Promise<{ recoveredKeywords: number; recoveredJobs: number }> {
    console.log(`[Recovery] Scanning for abandoned jobs and stale PROCESSING keywords (> ${timeoutMinutes}m)...`);
    let recoveredKeywords = 0;
    let recoveredJobs = 0;

    try {
      const staleThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      // 1. Reset stale PROCESSING keywords to RETRY
      const staleKeywords = await db
        .update(keywords)
        .set({
          status: 'RETRY',
          lastError: 'Worker crashed or timed out mid-execution',
          updatedAt: new Date(),
        })
        .where(and(eq(keywords.status, 'PROCESSING'), lt(keywords.lastAttemptAt, staleThreshold)))
        .returning({ id: keywords.id });

      recoveredKeywords = staleKeywords.length;
      if (recoveredKeywords > 0) {
        console.log(`[Recovery] Reset ${recoveredKeywords} stale keywords to RETRY.`);
      }

      // 2. Mark abandoned RUNNING jobs as FAILED
      const abandonedJobs = await db
        .update(jobs)
        .set({
          status: 'FAILED',
          error: 'Process terminated unexpectedly without heartbeat update',
          updatedAt: new Date(),
        })
        .where(and(eq(jobs.status, 'RUNNING'), lt(jobs.lastHeartbeat, staleThreshold)))
        .returning({ id: jobs.id });

      recoveredJobs = abandonedJobs.length;
      if (recoveredJobs > 0) {
        console.log(`[Recovery] Marked ${recoveredJobs} abandoned jobs as FAILED.`);
      }
    } catch (e: any) {
      console.warn('[Recovery] Warning during stale job recovery:', e.message);
    }

    return { recoveredKeywords, recoveredJobs };
  }

  public async recoverStaleOutreachLeads(timeoutMinutes = 30): Promise<number> {
    try {
      const staleThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      // Find stale QUEUED leads
      const staleQueuedLeads = await db
        .select({ id: leads.id })
        .from(leads)
        .where(
          and(
            eq(leads.outreachStatus, 'QUEUED'),
            lt(leads.updatedAt, staleThreshold)
          )
        );

      if (staleQueuedLeads.length === 0) return 0;

      let recovered = 0;

      for (const lead of staleQueuedLeads) {
        // Check if a message already exists for this lead
        const msg = await db
          .select({ id: messages.id, sendStatus: messages.sendStatus })
          .from(messages)
          .where(eq(messages.leadId, lead.id))
          .limit(1);

        if (msg.length > 0 && msg[0].sendStatus === 'SENT') {
          // Message was actually sent! Ensure lead is marked CONTACTED
          await db
            .update(leads)
            .set({ outreachStatus: 'CONTACTED', updatedAt: new Date() })
            .where(eq(leads.id, lead.id));
          recovered++;
        } else {
          // If a message was stuck in SENDING, mark it FAILED
          if (msg.length > 0 && msg[0].sendStatus === 'SENDING') {
            await db
              .update(messages)
              .set({
                sendStatus: 'FAILED',
                error: 'Outreach worker timed out mid-send',
                updatedAt: new Date(),
              })
              .where(eq(messages.id, msg[0].id));
          }

          // Reset lead to UNPROCESSED so it can be retried cleanly
          await db
            .update(leads)
            .set({ outreachStatus: 'UNPROCESSED', updatedAt: new Date() })
            .where(eq(leads.id, lead.id));
          recovered++;
        }
      }

      if (recovered > 0) {
        console.log(`[Recovery] Reconciled and recovered ${recovered} stale QUEUED leads.`);
      }
      return recovered;
    } catch (e: any) {
      console.warn('[Recovery] Warning during stale lead recovery:', e.message);
      return 0;
    }
  }

  /**
   * BUG-03: Watchdog Recovery for scheduled_emails stuck in SENDING
   * Recovers rows left stranded in SENDING due to serverless execution timeouts (120s maxDuration).
   */
  public async recoverStaleScheduledEmails(timeoutMinutes = 30): Promise<number> {
    try {
      const staleThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      const staleSending = await db
        .select({
          id: scheduledEmails.id,
          leadId: scheduledEmails.leadId,
          campaignId: scheduledEmails.campaignId,
          contactId: scheduledEmails.contactId,
          stepNumber: scheduledEmails.stepNumber,
        })
        .from(scheduledEmails)
        .where(
          and(
            eq(scheduledEmails.status, 'SENDING'),
            lt(scheduledEmails.updatedAt, staleThreshold)
          )
        );

      if (staleSending.length === 0) return 0;

      let recovered = 0;

      for (const item of staleSending) {
        const stepNum = item.stepNumber || 1;
        const idempotencyKey = `camp_${item.campaignId}_lead_${item.leadId}_cnt_${item.contactId}_step_${stepNum}`;

        const existingMsg = await db
          .select({ id: messages.id, sendStatus: messages.sendStatus })
          .from(messages)
          .where(eq(messages.idempotencyKey, idempotencyKey))
          .limit(1);

        if (existingMsg.length > 0 && existingMsg[0].sendStatus === 'SENT') {
          // Delivered before timeout recorded: mark SENT
          await db
            .update(scheduledEmails)
            .set({
              status: 'SENT',
              updatedAt: new Date(),
            })
            .where(eq(scheduledEmails.id, item.id));
        } else {
          // Abandoned in SENDING without delivery: reset back to PENDING for retry
          await db
            .update(scheduledEmails)
            .set({
              status: 'PENDING',
              error: 'Recovered by watchdog from orphaned SENDING state',
              updatedAt: new Date(),
            })
            .where(eq(scheduledEmails.id, item.id));
        }
        recovered++;
      }

      if (recovered > 0) {
        console.log(`[Watchdog] Recovered ${recovered} stale SENDING scheduled email(s).`);
      }
      return recovered;
    } catch (e: any) {
      console.warn('[Watchdog] Warning during stale scheduled emails recovery:', e.message);
      return 0;
    }
  }
}

export const jobRunner = new JobRunner();
