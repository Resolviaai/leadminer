import { db } from '../../db/client';
import { messages, gmailAccounts } from '../../db/schema';
import { sql } from 'drizzle-orm';

export interface WarmupSchedule {
  min: number;
  max: number;
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

  /**
   * Calculates distinct calendar days where this inbox actually sent emails.
   * If googleAccountId is available, aggregates across past reconnects of the same inbox.
   */
  public async getActiveSendDays(accountId: number, googleAccountId?: string | null): Promise<number> {
    try {
      let activeDaysResult;
      if (googleAccountId) {
        activeDaysResult = await db.execute(sql`
          SELECT count(DISTINCT DATE(m.sent_at))::int as count
          FROM ${messages} m
          INNER JOIN ${gmailAccounts} ga ON m.gmail_account_id = ga.id
          WHERE ga.google_account_id = ${googleAccountId}
            AND m.send_status = 'SENT'
        `);
      } else {
        activeDaysResult = await db.execute(sql`
          SELECT count(DISTINCT DATE(sent_at))::int as count
          FROM ${messages}
          WHERE gmail_account_id = ${accountId}
            AND send_status = 'SENT'
        `);
      }

      return Number(activeDaysResult.rows?.[0]?.count || 0);
    } catch (e: any) {
      console.warn(`[WarmupService] Error calculating active days for account #${accountId}:`, e.message);
      return 7; // Safe fallback to standard capacity on DB error
    }
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
