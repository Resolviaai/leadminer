import { checkDatabaseConnection, db } from '../db/client';
import { quotaManager } from '../services/youtube/quota';
import { gmailAccounts } from '../db/schema';
import { env } from '../config/env';

export interface HealthCheckResult {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'ERROR';
  components: {
    database: { status: 'OK' | 'ERROR'; message: string };
    youtube: { status: 'OK' | 'WARNING'; message: string; remainingSearches: number };
    gemini: { status: 'OK' | 'WARNING'; message: string };
    telegram: { status: 'OK' | 'WARNING'; configured: boolean; message: string };
    gmail: { status: 'OK' | 'WARNING'; configured: boolean; connectedInboxes: number; message: string };
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
  const hasYoutubeKey = isValidCredential(env.YOUTUBE_API_KEY);
  const ytStatus = {
    status: (hasYoutubeKey ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    message: hasYoutubeKey ? 'YouTube API Key configured' : 'No YOUTUBE_API_KEY set (running in Mock/Dry-Run mode)',
    remainingSearches,
  };

  // 3. Gemini AI
  const hasGeminiKey = isValidCredential(env.GEMINI_API_KEY);
  const geminiStatus = {
    status: (hasGeminiKey ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    message: hasGeminiKey ? `Gemini configured (model: ${env.GEMINI_MODEL})` : 'No GEMINI_API_KEY set (using fallback templates)',
  };

  // 4. Telegram
  const hasTelegram = isValidCredential(env.TELEGRAM_BOT_TOKEN) && isValidCredential(env.TELEGRAM_CHAT_ID);
  const telegramStatus = {
    status: (hasTelegram ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    configured: hasTelegram,
    message: hasTelegram ? 'Telegram Bot configured' : 'Not configured (Add BOT_TOKEN in .env)',
  };

  // 5. Gmail OAuth & Connected Inboxes
  let connectedGmailCount = 0;
  if (dbConnected) {
    try {
      const accs = await db.select().from(gmailAccounts);
      connectedGmailCount = accs.length;
    } catch (e) {
      connectedGmailCount = 0;
    }
  }

  const hasGmailOauth = isValidCredential(env.GOOGLE_CLIENT_ID) && isValidCredential(env.GOOGLE_CLIENT_SECRET);
  const gmailStatus = {
    status: (connectedGmailCount > 0 ? 'OK' : 'WARNING') as 'OK' | 'WARNING',
    configured: hasGmailOauth,
    connectedInboxes: connectedGmailCount,
    message: connectedGmailCount > 0
      ? `${connectedGmailCount} connected inbox${connectedGmailCount > 1 ? 'es' : ''}`
      : hasGmailOauth
      ? 'OAuth set up, 0 inboxes connected'
      : 'Not connected (No Gmail inboxes linked)',
  };

  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'ERROR' = 'HEALTHY';
  if (!dbConnected) {
    overallStatus = 'ERROR';
  } else if (!hasYoutubeKey) {
    overallStatus = 'DEGRADED';
  }

  console.log(`[Database]       ${dbStatus.status === 'OK' ? '✅' : '❌'} ${dbStatus.message}`);
  console.log(`[YouTube API]     ${ytStatus.status === 'OK' ? '✅' : '⚠️'} ${ytStatus.message} (${remainingSearches} searches left today)`);
  console.log(`[Gemini AI]       ${geminiStatus.status === 'OK' ? '✅' : '⚠️'} ${geminiStatus.message}`);
  console.log(`[Gmail OAuth]     ${gmailStatus.status === 'OK' ? '✅' : '⚠️'} ${gmailStatus.message}`);
  console.log(`[Telegram Alert]  ${telegramStatus.status === 'OK' ? '✅' : '⚠️'} ${telegramStatus.message}`);
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
