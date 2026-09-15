import { db } from '../../db/client';
import { jobs, keywords, logs, leads } from '../../db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { env } from '../../config/env';

export class JobRunner {
  public async createJob(jobType: string, parameters: Record<string, any> = {}): Promise<number> {
    try {
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
      const staleLeads = await db
        .update(leads)
        .set({
          outreachStatus: 'UNPROCESSED',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leads.outreachStatus, 'QUEUED'),
            lt(leads.updatedAt, staleThreshold)
          )
        )
        .returning({ id: leads.id });

      if (staleLeads.length > 0) {
        console.log(`[Recovery] Reset ${staleLeads.length} stale QUEUED leads to UNPROCESSED.`);
      }
      return staleLeads.length;
    } catch (e: any) {
      console.warn('[Recovery] Warning during stale lead recovery:', e.message);
      return 0;
    }
  }
}

export const jobRunner = new JobRunner();
