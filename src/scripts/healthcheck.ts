import { checkDatabaseConnection } from '../db/client';
import { quotaManager } from '../services/youtube/quota';
import { env } from '../config/env';

export interface HealthCheckResult {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'ERROR';
  components: {
    database: { status: 'OK' | 'ERROR'; message: string };
    youtube: { status: 'OK' | 'WARNING'; message: string; remainingSearches: number };
    gemini: { status: 'OK' | 'WARNING'; message: string };
    telegram: { status: 'OK' | 'INFO'; message: string };
    gmail: { status: 'OK' | 'WARNING'; message: string };
    mode: { dryRun: boolean };
  };
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  console.log(`\n======================================================`);
  console.log(`🩺 Running LeadMiner System Health Check`);
  console.log(`======================================================\n`);

  // 1. Database
  const dbConnected = await checkDatabaseConnection();
  const dbStatus = {
    status: (dbConnected ? 'OK' : 'ERROR') as 'OK' | 'ERROR',
    message: dbConnected ? 'PostgreSQL connection active' : 'Could not connect to PostgreSQL (check DATABASE_URL)',
  };

  // 2. YouTube Quota & API
  const remainingSearches = await quotaManager.getRemainingSearchCalls();
  const hasYoutubeKey = Boolean(env.YOUTUBE_API_KEY);
  const ytStatus = {
    status: (hasYoutubeKey ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    message: hasYoutubeKey ? 'YouTube API Key configured' : 'No YOUTUBE_API_KEY set (running in Mock/Dry-Run mode)',
    remainingSearches,
  };

  // 3. Gemini AI
  const hasGeminiKey = Boolean(env.GEMINI_API_KEY);
  const geminiStatus = {
    status: (hasGeminiKey ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    message: hasGeminiKey ? `Gemini configured (model: ${env.GEMINI_MODEL})` : 'No GEMINI_API_KEY set (using fallback templates)',
  };

  // 4. Telegram
  const hasTelegram = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  const telegramStatus = {
    status: (hasTelegram ? 'OK' : 'INFO') as 'OK' | 'INFO',
    message: hasTelegram ? 'Telegram Bot configured' : 'Telegram not configured (simulated in logs)',
  };

  // 5. Gmail OAuth
  const hasGmailOauth = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const gmailStatus = {
    status: (hasGmailOauth ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    message: hasGmailOauth ? 'Google OAuth configured' : 'Google OAuth credentials not configured (Dry-Run simulated)',
  };

  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'ERROR' = 'HEALTHY';
  if (!dbConnected) {
    overallStatus = 'ERROR';
  } else if (!hasYoutubeKey || !hasGmailOauth) {
    overallStatus = 'DEGRADED';
  }

  console.log(`[Database]       ${dbStatus.status === 'OK' ? '✅' : '❌'} ${dbStatus.message}`);
  console.log(`[YouTube API]     ${ytStatus.status === 'OK' ? '✅' : '⚠️'} ${ytStatus.message} (${remainingSearches} searches left today)`);
  console.log(`[Gemini AI]       ${geminiStatus.status === 'OK' ? '✅' : '⚠️'} ${geminiStatus.message}`);
  console.log(`[Gmail OAuth]     ${gmailStatus.status === 'OK' ? '✅' : '⚠️'} ${gmailStatus.message}`);
  console.log(`[Telegram Alert]  ${telegramStatus.status === 'OK' ? '✅' : 'ℹ️'} ${telegramStatus.message}`);
  console.log(`[Runtime Mode]    ${env.DRY_RUN ? '🔒 DRY RUN ENABLED' : '⚡ LIVE MODE'}`);
  console.log(`\nOverall System Health: ${overallStatus}\n`);

  return {
    overallStatus,
    components: {
      database: dbStatus,
      youtube: ytStatus,
      gemini: geminiStatus,
      telegram: telegramStatus,
      gmail: gmailStatus,
      mode: { dryRun: env.DRY_RUN },
    },
  };
}

if (require.main === module) {
  runHealthCheck()
    .then((res) => {
      process.exit(res.overallStatus === 'ERROR' ? 1 : 0);
    })
    .catch((err) => {
      console.error('Healthcheck execution error:', err);
      process.exit(1);
    });
}
