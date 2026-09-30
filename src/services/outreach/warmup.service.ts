import { db } from '../../db/client';
import { messages, gmailAccounts } from '../../db/schema';
import { sql } from 'drizzle-orm';

export interface WarmupSchedule {
  min: number;
  max: number;
}

export const WARMUP_INACTIVITY_RESET_DAYS = 14;

export interface AccountWarmupStatus {
  activeSendDays: number;
  currentDay: number;
  stageTarget: number;
  effectiveDailyLimit: number;
  isWarmedUp: boolean;
  daysSinceLastSend: number | null;
  isColdReset: boolean;
}

function parseDateOnly(val: any): Date {
  if (val instanceof Date) {
    const d = new Date(val);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const str = String(val).split('T')[0];
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export class WarmupService {
  /**
   * Deterministic 7-day warmup schedule based on days with actual sent messages:
   * Day 0 (first day active): 4 - 6 sends (target 5)
   * Day 1: 7 - 9 sends (target 8)
   * Day 2: 9 - 11 sends (target 10)
   * Day 3: 14 - 16 sends (target 15)
   * Day 4: 17 - 19 sends (target 18)
   * Day 5: 20 - 22 sends (target 21)
   * Day 6+: 18 - 25 sends (target 25, fully warmed)
   */
  public static getWarmupSchedule(activeSendDays: number): WarmupSchedule {
    if (activeSendDays <= 0) return { min: 4, max: 6 };
    if (activeSendDays === 1) return { min: 7, max: 9 };
    if (activeSendDays === 2) return { min: 9, max: 11 };
    if (activeSendDays === 3) return { min: 14, max: 16 };
    if (activeSendDays === 4) return { min: 17, max: 19 };
    if (activeSendDays === 5) return { min: 20, max: 22 };
    return { min: 18, max: 25 };
  }

  public static getStageTarget(activeSendDays: number): number {
    if (activeSendDays <= 0) return 5;
    if (activeSendDays === 1) return 8;
    if (activeSendDays === 2) return 10;
    if (activeSendDays === 3) return 15;
    if (activeSendDays === 4) return 18;
    if (activeSendDays === 5) return 21;
    return 25;
  }

  /**
   * Calculates distinct calendar days in the current continuous active send streak.
   * If an account is inactive for > 14 days, the ramp resets to Day 0 (Cold Reset Rule).
   * Aggregates across past reconnects of the same inbox if googleAccountId is provided.
   */
  public async getActiveSendDays(accountId: number, googleAccountId?: string | null): Promise<number> {
    const details = await this.getStreakDetails(accountId, googleAccountId);
    return details.activeSendDays;
  }

  /**
   * Internal helper to compute streak length, days since last send, and cold reset flag.
   */
  public async getStreakDetails(
    accountId: number,
    googleAccountId?: string | null
  ): Promise<{ activeSendDays: number; daysSinceLastSend: number | null; isColdReset: boolean }> {
    try {
      let datesResult;
      if (googleAccountId) {
        datesResult = await db.execute(sql`
          SELECT DISTINCT DATE(m.sent_at) as send_date
          FROM ${messages} m
          INNER JOIN ${gmailAccounts} ga ON m.gmail_account_id = ga.id
          WHERE ga.google_account_id = ${googleAccountId}
            AND m.send_status = 'SENT'
          ORDER BY send_date DESC
        `);
      } else {
        datesResult = await db.execute(sql`
          SELECT DISTINCT DATE(sent_at) as send_date
          FROM ${messages}
          WHERE gmail_account_id = ${accountId}
            AND send_status = 'SENT'
          ORDER BY send_date DESC
        `);
      }

      const rows = datesResult.rows || [];
      if (rows.length === 0) {
        return { activeSendDays: 0, daysSinceLastSend: null, isColdReset: false };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      const mostRecentSendDate = parseDateOnly((rows[0] as any).send_date);
      const diffMs = today.getTime() - mostRecentSendDate.getTime();
      const daysSinceLastSend = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));

      // Cold Reset Rule: If account has been completely dark/inactive for > 14 days,
      // its warmup ramp resets to Day 0 to protect IP/domain reputation.
      if (daysSinceLastSend > WARMUP_INACTIVITY_RESET_DAYS) {
        return { activeSendDays: 0, daysSinceLastSend, isColdReset: true };
      }

      // Count consecutive send days within the active streak (no gap > 14 days between consecutive sends)
      let streak = 1;
      for (let i = 1; i < rows.length; i++) {
        const prevDate = parseDateOnly((rows[i - 1] as any).send_date);
        const currDate = parseDateOnly((rows[i] as any).send_date);
        const gapDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));

        if (gapDays > WARMUP_INACTIVITY_RESET_DAYS) {
          break; // Hit an older inactivity gap — earlier sends are outside current streak
        }
        streak++;
      }

      return { activeSendDays: streak, daysSinceLastSend, isColdReset: false };
    } catch (e: any) {
      console.warn(`[WarmupService] Error calculating active days for account #${accountId}:`, e.message);
      return { activeSendDays: 0, daysSinceLastSend: null, isColdReset: false }; // Fail closed to Day 0 ramp
    }
  }

  /**
   * Computes comprehensive warmup status for UI and scheduling decisions.
   */
  public async getAccountWarmupStatus(
    accountId: number,
    googleAccountId?: string | null,
    baseLimit: number = 25
  ): Promise<AccountWarmupStatus> {
    const details = await this.getStreakDetails(accountId, googleAccountId);
    const effectiveDailyLimit = await this.getEffectiveDailyLimit(accountId, baseLimit, googleAccountId);
    const stageTarget = WarmupService.getStageTarget(details.activeSendDays);
    const isWarmedUp = details.activeSendDays >= 6;
    const currentDay = Math.min(6, details.activeSendDays);

    return {
      activeSendDays: details.activeSendDays,
      currentDay,
      stageTarget,
      effectiveDailyLimit,
      isWarmedUp,
      daysSinceLastSend: details.daysSinceLastSend,
      isColdReset: details.isColdReset,
    };
  }

  /**
   * Computes today's effective limit applying warmup ramp and day-stable jitter.
   */
  public async getEffectiveDailyLimit(
    accountId: number,
    baseLimit: number = 25,
    googleAccountId?: string | null
  ): Promise<number> {
    const activeDays = await this.getActiveSendDays(accountId, googleAccountId);
    const schedule = WarmupService.getWarmupSchedule(activeDays);

    const max = Math.min(baseLimit || 25, schedule.max);
    const min = Math.min(schedule.min, max);
    const range = max - min + 1;

    const ptDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    let hash = 0;
    const str = `${ptDateStr}_warmup_${accountId}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    const jitter = Math.abs(hash) % range;
    return min + jitter;
  }
}

export const warmupService = new WarmupService();
