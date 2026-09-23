import { db } from '../../db/client';
import { systemSettings } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { env } from '../../config/env';
import { QuotaState } from './types';

export function getAvailableYouTubeKeys(): string[] {
  return [
    env.YOUTUBE_API_KEY,
    env.YOUTUBE_API_KEY_2,
    env.YOUTUBE_API_KEY_3,
    env.YOUTUBE_API_KEY_4,
  ].filter(
    (k): k is string =>
      Boolean(
        k &&
        k.trim().length > 0 &&
        !k.startsWith('mock_') &&
        !k.includes('[YOUR') &&
        !k.startsWith('your_') &&
        k.toLowerCase() !== 'none'
      )
  );
}

export class YouTubeQuotaManager {
  private inMemoryQuota: QuotaState;
  private inMemoryOnly: boolean;
  private exhaustedKeyIndices = new Set<number>();

  constructor(inMemoryOnly?: boolean) {
    this.inMemoryOnly = inMemoryOnly ?? (process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test');
    const keyCount = Math.max(1, getAvailableYouTubeKeys().length);
    this.inMemoryQuota = {
      searchCallsDailyLimit: env.YOUTUBE_DAILY_SEARCH_LIMIT * keyCount,
      searchCallsUsedToday: 0,
      generalQuotaDailyLimit: env.YOUTUBE_DAILY_GENERAL_LIMIT * keyCount,
      generalQuotaUsedToday: 0,
      lastResetPt: new Date().toISOString(),
    };
  }

  private getPacificDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  }

  public getActiveKeyIndex(): number {
    const keys = getAvailableYouTubeKeys();
    if (keys.length <= 1) return 0;

    // P3-7: Derive active key index directly from DB quota counts
    const derivedIdx = Math.min(
      keys.length - 1,
      Math.floor(this.inMemoryQuota.searchCallsUsedToday / Math.max(1, env.YOUTUBE_DAILY_SEARCH_LIMIT))
    );

    for (let i = derivedIdx; i < keys.length; i++) {
      if (!this.exhaustedKeyIndices.has(i)) {
        return i;
      }
    }
    for (let i = 0; i < derivedIdx; i++) {
      if (!this.exhaustedKeyIndices.has(i)) {
        return i;
      }
    }
    return Math.min(derivedIdx, keys.length - 1);
  }

  public markActiveKeyExhausted(): void {
    const currentIdx = this.getActiveKeyIndex();
    this.exhaustedKeyIndices.add(currentIdx);
    console.warn(`[YouTube Quota] Marked API key index ${currentIdx} as quota-exhausted.`);
    const nextTarget = (currentIdx + 1) * env.YOUTUBE_DAILY_SEARCH_LIMIT;
    this.inMemoryQuota.searchCallsUsedToday = Math.max(this.inMemoryQuota.searchCallsUsedToday, nextTarget);
  }

  public async syncQuotaState(): Promise<QuotaState> {
    const keyCount = Math.max(1, getAvailableYouTubeKeys().length);
    const expectedSearchLimit = env.YOUTUBE_DAILY_SEARCH_LIMIT * keyCount;
    const expectedGeneralLimit = env.YOUTUBE_DAILY_GENERAL_LIMIT * keyCount;

    if (!this.inMemoryOnly) {
      try {
        const record = await db.select().from(systemSettings).where(eq(systemSettings.key, 'youtube_quota')).limit(1);

        if (record.length > 0 && record[0].value) {
          const val = record[0].value as any;
          this.inMemoryQuota = {
            searchCallsDailyLimit: expectedSearchLimit,
            searchCallsUsedToday: val.search_calls_used_today ?? 0,
            generalQuotaDailyLimit: expectedGeneralLimit,
            generalQuotaUsedToday: val.general_quota_used_today ?? 0,
            lastResetPt: val.last_reset_pt ?? new Date().toISOString(),
          };
        }
      } catch (e) {
        // If DB is offline or not yet migrated, maintain in-memory quota
      }
    }

    // P3-10: Check if midnight in Pacific Time has passed (Atomic midnight reset)
    const nowPt = this.getPacificDateString();
    const lastResetDate = new Date(this.inMemoryQuota.lastResetPt);
    const lastPt = this.getPacificDateString(isNaN(lastResetDate.getTime()) ? new Date(0) : lastResetDate);

    if (nowPt !== lastPt) {
      this.inMemoryQuota.searchCallsUsedToday = 0;
      this.inMemoryQuota.generalQuotaUsedToday = 0;
      this.inMemoryQuota.lastResetPt = new Date().toISOString();
      this.exhaustedKeyIndices.clear();

      if (!this.inMemoryOnly) {
        try {
          await db.execute(sql`
            UPDATE system_settings
            SET value = jsonb_set(
              jsonb_set(
                jsonb_set(
                  value,
                  '{search_calls_used_today}',
                  '0'::jsonb
                ),
                '{general_quota_used_today}',
                '0'::jsonb
              ),
              '{last_reset_pt}',
              to_jsonb(${this.inMemoryQuota.lastResetPt}::text)
            ),
            updated_at = NOW()
            WHERE key = 'youtube_quota';
          `);
        } catch {
          await this.persistQuotaState();
        }
      } else {
        await this.persistQuotaState();
      }
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

  /**
   * Concurrency-Safe Atomic Claim for Search Calls (1 search.list call).
   * Atomically checks quota against limit in PostgreSQL via conditional UPDATE.
   */
  public async tryClaimSearchCall(): Promise<boolean> {
    if (this.inMemoryOnly) {
      await this.syncQuotaState();
      if (this.inMemoryQuota.searchCallsUsedToday < this.inMemoryQuota.searchCallsDailyLimit) {
        this.inMemoryQuota.searchCallsUsedToday += 1;
        return true;
      }
      return false;
    }

    try {
      await this.syncQuotaState();

      const result = await db.execute(sql`
        UPDATE system_settings
        SET value = jsonb_set(
          value,
          '{search_calls_used_today}',
          to_jsonb(COALESCE((value->>'search_calls_used_today')::int, 0) + 1)
        ),
        updated_at = NOW()
        WHERE key = 'youtube_quota'
          AND (COALESCE((value->>'search_calls_used_today')::int, 0) + 1) <= COALESCE((value->>'search_calls_daily_limit')::int, ${this.inMemoryQuota.searchCallsDailyLimit})
        RETURNING value;
      `);

      if (result.rows && result.rows.length > 0) {
        const updatedVal = (result.rows[0] as any).value;
        if (updatedVal) {
          this.inMemoryQuota.searchCallsUsedToday = updatedVal.search_calls_used_today ?? (this.inMemoryQuota.searchCallsUsedToday + 1);
        }
        return true;
      }

      const exists = await db.select({ key: systemSettings.key }).from(systemSettings).where(eq(systemSettings.key, 'youtube_quota')).limit(1);
      if (exists.length === 0) {
        this.inMemoryQuota.searchCallsUsedToday = 1;
        await this.persistQuotaState();
        return true;
      }

      return false;
    } catch (e) {
      console.error('[YouTube Quota] DB error during tryClaimSearchCall — failing closed:', e);
      if (process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test') {
        if (this.inMemoryQuota.searchCallsUsedToday < this.inMemoryQuota.searchCallsDailyLimit) {
          this.inMemoryQuota.searchCallsUsedToday += 1;
          return true;
        }
      }
      return false;
    }
  }

  /**
   * Concurrency-Safe Atomic Claim for General Quota (e.g. channels.list).
   */
  public async tryClaimGeneralQuota(units: number = 1): Promise<boolean> {
    if (this.inMemoryOnly) {
      await this.syncQuotaState();
      if (this.inMemoryQuota.generalQuotaUsedToday + units <= this.inMemoryQuota.generalQuotaDailyLimit) {
        this.inMemoryQuota.generalQuotaUsedToday += units;
        return true;
      }
      return false;
    }

    try {
      await this.syncQuotaState();

      const result = await db.execute(sql`
        UPDATE system_settings
        SET value = jsonb_set(
          value,
          '{general_quota_used_today}',
          to_jsonb(COALESCE((value->>'general_quota_used_today')::int, 0) + ${units})
        ),
        updated_at = NOW()
        WHERE key = 'youtube_quota'
          AND (COALESCE((value->>'general_quota_used_today')::int, 0) + ${units}) <= COALESCE((value->>'general_quota_daily_limit')::int, ${this.inMemoryQuota.generalQuotaDailyLimit})
        RETURNING value;
      `);

      if (result.rows && result.rows.length > 0) {
        const updatedVal = (result.rows[0] as any).value;
        if (updatedVal) {
          this.inMemoryQuota.generalQuotaUsedToday = updatedVal.general_quota_used_today ?? (this.inMemoryQuota.generalQuotaUsedToday + units);
        }
        return true;
      }

      const exists = await db.select({ key: systemSettings.key }).from(systemSettings).where(eq(systemSettings.key, 'youtube_quota')).limit(1);
      if (exists.length === 0) {
        this.inMemoryQuota.generalQuotaUsedToday = units;
        await this.persistQuotaState();
        return true;
      }

      return false;
    } catch (e) {
      console.error('[YouTube Quota] DB error during tryClaimGeneralQuota — failing closed:', e);
      if (process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test') {
        if (this.inMemoryQuota.generalQuotaUsedToday + units <= this.inMemoryQuota.generalQuotaDailyLimit) {
          this.inMemoryQuota.generalQuotaUsedToday += units;
          return true;
        }
      }
      return false;
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

  public async refundSearchCall(): Promise<void> {
    if (this.inMemoryQuota.searchCallsUsedToday > 0) {
      this.inMemoryQuota.searchCallsUsedToday -= 1;
    }
    if (!this.inMemoryOnly) {
      try {
        await db.execute(sql`
          UPDATE system_settings
          SET value = jsonb_set(
            value,
            '{search_calls_used_today}',
            to_jsonb(GREATEST(0, COALESCE((value->>'search_calls_used_today')::int, 0) - 1))
          ),
          updated_at = NOW()
          WHERE key = 'youtube_quota';
        `);
      } catch (e) {
        // Non-fatal
      }
    }
  }

  public async refundGeneralQuota(units: number = 1): Promise<void> {
    if (this.inMemoryQuota.generalQuotaUsedToday >= units) {
      this.inMemoryQuota.generalQuotaUsedToday -= units;
    }
    if (!this.inMemoryOnly) {
      try {
        await db.execute(sql`
          UPDATE system_settings
          SET value = jsonb_set(
            value,
            '{general_quota_used_today}',
            to_jsonb(GREATEST(0, COALESCE((value->>'general_quota_used_today')::int, 0) - ${units}))
          ),
          updated_at = NOW()
          WHERE key = 'youtube_quota';
        `);
      } catch (e) {
        // Non-fatal
      }
    }
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
