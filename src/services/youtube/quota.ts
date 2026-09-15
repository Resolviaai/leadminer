import { db } from '../../db/client';
import { systemSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { QuotaState } from './types';

export class YouTubeQuotaManager {
  private inMemoryQuota: QuotaState;
  private inMemoryOnly: boolean;

  constructor(inMemoryOnly?: boolean) {
    this.inMemoryOnly = inMemoryOnly ?? (process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test');
    this.inMemoryQuota = {
      searchCallsDailyLimit: env.YOUTUBE_DAILY_SEARCH_LIMIT,
      searchCallsUsedToday: 0,
      generalQuotaDailyLimit: env.YOUTUBE_DAILY_GENERAL_LIMIT,
      generalQuotaUsedToday: 0,
      lastResetPt: new Date().toISOString(),
    };
  }

  private getPacificDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  }

  public async syncQuotaState(): Promise<QuotaState> {
    if (!this.inMemoryOnly) {
      try {
        const record = await db.select().from(systemSettings).where(eq(systemSettings.key, 'youtube_quota')).limit(1);

        if (record.length > 0 && record[0].value) {
          const val = record[0].value as any;
          this.inMemoryQuota = {
            searchCallsDailyLimit: val.search_calls_daily_limit ?? env.YOUTUBE_DAILY_SEARCH_LIMIT,
            searchCallsUsedToday: val.search_calls_used_today ?? 0,
            generalQuotaDailyLimit: val.general_quota_daily_limit ?? env.YOUTUBE_DAILY_GENERAL_LIMIT,
            generalQuotaUsedToday: val.general_quota_used_today ?? 0,
            lastResetPt: val.last_reset_pt ?? new Date().toISOString(),
          };
        }
      } catch (e) {
        // If DB is offline or not yet migrated, maintain in-memory quota
      }
    }

    // Check if midnight in Pacific Time has passed
    const nowPt = this.getPacificDateString();
    const lastResetDate = new Date(this.inMemoryQuota.lastResetPt);
    const lastPt = this.getPacificDateString(isNaN(lastResetDate.getTime()) ? new Date(0) : lastResetDate);

    if (nowPt !== lastPt) {
      this.inMemoryQuota.searchCallsUsedToday = 0;
      this.inMemoryQuota.generalQuotaUsedToday = 0;
      this.inMemoryQuota.lastResetPt = new Date().toISOString();
      await this.persistQuotaState();
    }

    return { ...this.inMemoryQuota };
  }

  public async persistQuotaState(): Promise<void> {
    if (this.inMemoryOnly) {
      return;
    }
    try {
      await db
        .insert(systemSettings)
        .values({
          key: 'youtube_quota',
          value: {
            search_calls_daily_limit: this.inMemoryQuota.searchCallsDailyLimit,
            search_calls_used_today: this.inMemoryQuota.searchCallsUsedToday,
            general_quota_daily_limit: this.inMemoryQuota.generalQuotaDailyLimit,
            general_quota_used_today: this.inMemoryQuota.generalQuotaUsedToday,
            last_reset_pt: this.inMemoryQuota.lastResetPt,
          },
          description: 'YouTube API dual-bucket quota tracking (search.list 100 calls/day; general 10,000 units/day; resets midnight PT).',
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: {
              search_calls_daily_limit: this.inMemoryQuota.searchCallsDailyLimit,
              search_calls_used_today: this.inMemoryQuota.searchCallsUsedToday,
              general_quota_daily_limit: this.inMemoryQuota.generalQuotaDailyLimit,
              general_quota_used_today: this.inMemoryQuota.generalQuotaUsedToday,
              last_reset_pt: this.inMemoryQuota.lastResetPt,
            },
            updatedAt: new Date(),
          },
        });
    } catch (e) {
      // Graceful in-memory fallback
    }
  }

  public async canExecuteSearch(): Promise<boolean> {
    const quota = await this.syncQuotaState();
    return quota.searchCallsUsedToday < quota.searchCallsDailyLimit;
  }

  public async canExecuteGeneralCall(units: number = 1): Promise<boolean> {
    const quota = await this.syncQuotaState();
    return quota.generalQuotaUsedToday + units <= quota.generalQuotaDailyLimit;
  }

  public async recordSearchExecution(): Promise<void> {
    this.inMemoryQuota.searchCallsUsedToday += 1;
    await this.persistQuotaState();
  }

  public async recordGeneralQuotaUsage(units: number = 1): Promise<void> {
    this.inMemoryQuota.generalQuotaUsedToday += units;
    await this.persistQuotaState();
  }

  public async getRemainingSearchCalls(): Promise<number> {
    const quota = await this.syncQuotaState();
    return Math.max(0, quota.searchCallsDailyLimit - quota.searchCallsUsedToday);
  }

  public async getRemainingGeneralQuota(): Promise<number> {
    const quota = await this.syncQuotaState();
    return Math.max(0, quota.generalQuotaDailyLimit - quota.generalQuotaUsedToday);
  }
}

export const quotaManager = new YouTubeQuotaManager();
