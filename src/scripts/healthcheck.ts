import { checkDatabaseConnection, db } from '../db/client';
import { quotaManager } from '../services/youtube/quota';
import { gmailAccounts, jobs, dailyApiUsage, systemSettings } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { env } from '../config/env';

export interface HealthCheckResult {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'ERROR';
  components: {
    database: { status: 'OK' | 'ERROR'; message: string };
    youtube: { status: 'OK' | 'WARNING'; message: string; remainingSearches: number };
    gemini: {
      status: 'OK' | 'WARNING';
      message: string;
      limit: number;
      usedToday: number;
      remainingToday: number;
    };
    jev: {
      status: 'OK' | 'WARNING';
      configured: boolean;
      callsToday: number;
      cacheHitsToday: number;
      cacheHitRate: number;
    };
    telegram: { status: 'OK' | 'WARNING'; configured: boolean; message: string };
    gmail: {
      status: 'OK' | 'NO_USABLE_ACCOUNT' | 'WARNING';
      configured: boolean;
      connectedInboxes: number;
      activeInboxes: number;
      message: string;
    };
    workers: {
      status: 'OK' | 'STALE' | 'IDLE';
      lastActivityAt: string | null;
      lastJobType: string | null;
      message: string;
    };
    killSwitch: {
      active: boolean;
      message: string;
    };
    mode: { dryRun: boolean };
  };
}

function isValidCredential(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false;
  if (trimmed.includes('YOUR-') || trimmed.includes('YOUR_') || trimmed.includes('change_me')) return false;
  return true;
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  // 1. Database connection check
  const dbConnected = await checkDatabaseConnection();
  const dbStatus = {
    status: (dbConnected ? 'OK' : 'ERROR') as 'OK' | 'ERROR',
    message: dbConnected ? 'PostgreSQL connection active' : 'Could not connect to PostgreSQL (check DATABASE_URL)',
  };

  // 2. YouTube Quota & API
  const remainingSearches = await quotaManager.getRemainingSearchCalls();
  const hasYoutubeKey = isValidCredential(env.YOUTUBE_API_KEY);
  const ytStatus = {
    status: (hasYoutubeKey ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    message: hasYoutubeKey ? 'YouTube API Key configured' : 'No YOUTUBE_API_KEY set (running in Mock/Dry-Run mode)',
    remainingSearches,
  };

  // 3. Dynamic Gemini API Quota Tracking
  let geminiCallsToday = 0;
  let jevCallsToday = 0;
  let jevCacheHitsToday = 0;

  if (dbConnected) {
    try {
      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
      }).format(new Date());

      const usages = await db
        .select()
        .from(dailyApiUsage)
        .where(eq(dailyApiUsage.usageDate, todayStr));

      for (const u of usages) {
        if (u.service === 'gemini') {
          geminiCallsToday = u.callCount || 0;
        } else if (u.service === 'jev') {
          jevCallsToday = u.callCount || 0;
          jevCacheHitsToday = u.cacheHits || 0;
        }
      }
    } catch {
      // Non-fatal if table not yet populated
    }
  }

  const hasGeminiKey = isValidCredential(env.GEMINI_API_KEY);
  const geminiLimit = env.GEMINI_DAILY_LIMIT || 500;
  const geminiRemaining = Math.max(0, geminiLimit - geminiCallsToday);

  const geminiStatus = {
    status: (hasGeminiKey ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    message: hasGeminiKey
      ? `Gemini ${env.GEMINI_MODEL} (${geminiCallsToday} / ${geminiLimit} RPD used, 15 RPM guard)`
      : 'No GEMINI_API_KEY set (AI personalization disabled)',
    limit: geminiLimit,
    usedToday: geminiCallsToday,
    remainingToday: geminiRemaining,
  };

  // 4. TypeSafe Jev System One
  const hasJevKey = isValidCredential(env.TYPESAFE_API_KEY || process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY);
  const jevTotalRequests = jevCallsToday + jevCacheHitsToday;
  const jevCacheRate = jevTotalRequests > 0 ? Math.round((jevCacheHitsToday / jevTotalRequests) * 100) : 0;

  const jevStatus = {
    status: (hasJevKey ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    configured: hasJevKey,
    callsToday: jevCallsToday,
    cacheHitsToday: jevCacheHitsToday,
    cacheHitRate: jevCacheRate,
  };

  // 5. Telegram
  const hasTelegram = isValidCredential(env.TELEGRAM_BOT_TOKEN) && isValidCredential(env.TELEGRAM_CHAT_ID);
  const telegramStatus = {
    status: (hasTelegram ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    configured: hasTelegram,
    message: hasTelegram ? 'Telegram alerts configured' : 'Not configured (Add BOT_TOKEN in .env)',
  };

  // 6. Gmail Accounts (Differentiating connected vs active vs error)
  let connectedGmailCount = 0;
  let activeGmailCount = 0;

  if (dbConnected) {
    try {
      const accs = await db.select().from(gmailAccounts);
      connectedGmailCount = accs.length;
      activeGmailCount = accs.filter((a) => a.status === 'ACTIVE').length;
    } catch {
      connectedGmailCount = 0;
      activeGmailCount = 0;
    }
  }

  const hasGmailOauth = isValidCredential(env.GOOGLE_CLIENT_ID) && isValidCredential(env.GOOGLE_CLIENT_SECRET);
  let gmailState: 'OK' | 'NO_USABLE_ACCOUNT' | 'WARNING' = 'OK';
  let gmailMessage = `${activeGmailCount} active inbox(es) ready for dispatch`;

  if (connectedGmailCount === 0) {
    gmailState = hasGmailOauth ? 'NO_USABLE_ACCOUNT' : 'WARNING';
    gmailMessage = hasGmailOauth ? 'OAuth configured, but 0 inboxes connected' : 'No Gmail inboxes linked';
  } else if (activeGmailCount === 0) {
    gmailState = 'NO_USABLE_ACCOUNT';
    gmailMessage = 'All connected inboxes are paused or have auth/quota errors';
  }

  const gmailStatus = {
    status: gmailState,
    configured: hasGmailOauth,
    connectedInboxes: connectedGmailCount,
    activeInboxes: activeGmailCount,
    message: gmailMessage,
  };

  // 7. Worker Freshness Measured from Real Persisted Timestamps in `jobs` Table
  let lastJobTimestamp: Date | null = null;
  let lastJobType: string | null = null;

  if (dbConnected) {
    try {
      const [latestJob] = await db
        .select()
        .from(jobs)
        .orderBy(desc(jobs.createdAt))
        .limit(1);

      if (latestJob) {
        lastJobTimestamp = latestJob.completedAt || latestJob.createdAt;
        lastJobType = latestJob.jobType;
      }
    } catch {
      // Non-fatal
    }
  }

  let workerStatus: 'OK' | 'STALE' | 'IDLE' = 'IDLE';
  let workerMsg = 'No worker jobs recorded yet';

  if (lastJobTimestamp) {
    const elapsedMinutes = Math.floor((Date.now() - new Date(lastJobTimestamp).getTime()) / (1000 * 60));
    if (elapsedMinutes < 60) {
      workerStatus = 'OK';
      workerMsg = `Active (${lastJobType} completed ${elapsedMinutes}m ago)`;
    } else {
      workerStatus = 'STALE';
      workerMsg = `Last activity ${elapsedMinutes}m ago (${lastJobType})`;
    }
  }

  const workersStatus = {
    status: workerStatus,
    lastActivityAt: lastJobTimestamp ? new Date(lastJobTimestamp).toISOString() : null,
    lastJobType,
    message: workerMsg,
  };

  // 8. Kill Switch Status
  let isKillSwitchActive = false;
  if (dbConnected) {
    try {
      const [record] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'kill_switch'))
        .limit(1);

      if (record && record.value) {
        isKillSwitchActive = Boolean((record.value as any).enabled);
      }
    } catch {
      // Default false
    }
  }

  const killSwitchStatus = {
    active: isKillSwitchActive,
    message: isKillSwitchActive ? 'EMERGENCY STOP ACTIVE (all sends halted)' : 'Disengaged (normal operation)',
  };

  // Overall status calculation
  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'ERROR' = 'HEALTHY';
  if (!dbConnected) {
    overallStatus = 'ERROR';
  } else if (!hasYoutubeKey || gmailState === 'NO_USABLE_ACCOUNT' || isKillSwitchActive) {
    overallStatus = 'DEGRADED';
  }

  return {
    overallStatus,
    components: {
      database: dbStatus,
      youtube: ytStatus,
      gemini: geminiStatus,
      jev: jevStatus,
      telegram: telegramStatus,
      gmail: gmailStatus,
      workers: workersStatus,
      killSwitch: killSwitchStatus,
      mode: { dryRun: env.DRY_RUN },
    },
  };
}

if (require.main === module) {
  runHealthCheck()
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.overallStatus === 'ERROR' ? 1 : 0);
    })
    .catch((err) => {
      console.error('Healthcheck execution error:', err);
      process.exit(1);
    });
}
