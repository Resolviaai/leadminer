import dotenv from 'dotenv';
import { z } from 'zod';
import crypto from 'crypto';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:3000/api'),
  DRY_RUN: z
    .preprocess((val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        if (lower === 'false' || lower === '0') return false;
        if (lower === 'true' || lower === '1') return true;
      }
      return process.env.NODE_ENV === 'production' ? false : true;
    }, z.boolean())
    .default(process.env.NODE_ENV === 'production' ? false : true),

  // Database
  DATABASE_URL: z.string().optional().default('postgresql://postgres:postgres@localhost:5432/leadminer'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // YouTube Data API
  YOUTUBE_API_KEY: z.string().optional().default(''),
  YOUTUBE_DAILY_SEARCH_LIMIT: z.coerce.number().default(100),
  YOUTUBE_DAILY_GENERAL_LIMIT: z.coerce.number().default(10000),
  YOUTUBE_BATCH_SIZE: z.coerce.number().default(10),
  YOUTUBE_MAX_RESULTS_PER_SEARCH: z.coerce.number().default(15),
  YOUTUBE_TARGET_REGION: z.string().default('TIER_1'),
  YOUTUBE_TARGET_LANGUAGE: z.string().default('en'),

  // Gemini API
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_CHAT_ID: z.string().optional().default(''),

  // Email Verification
  EMAIL_VERIFICATION_PROVIDER: z.enum(['local', 'hunter', 'zerobounce', 'neverbounce']).default('local'),
  EMAIL_VERIFICATION_API_KEY: z.string().optional().default(''),
  ALLOW_DOMAIN_VALID_OUTREACH: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' || val === '1' : Boolean(val)),
      z.boolean()
    )
    .default(true),

  // Google OAuth / Gmail
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3000/api/auth/google/callback'),

  // Security
  SESSION_SECRET: z.string().default('default-session-secret-change-in-production'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  CRON_SECRET: z.string().optional(),

  // Discovery Quality Filter Thresholds (n8n Reintegration)
  MIN_DISCOVERY_SUBSCRIBERS: z.coerce.number().default(10),
  MIN_DISCOVERY_VIDEOS: z.coerce.number().default(10),

  // Worker Config
  WORKER_BATCH_SIZE: z.coerce.number().default(10),
  WORKER_MAX_RETRIES: z.coerce.number().default(3),
  WORKER_HEARTBEAT_SECONDS: z.coerce.number().default(30),
  WORKER_STALE_TIMEOUT_MINUTES: z.coerce.number().default(30),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error: any) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[FATAL] Invalid environment variables in production: ${error.message}`);
  }
  console.warn('⚠️ Warning: Some environment variables are not set. Using safe defaults for dry run mode.');
  parsedEnv = envSchema.parse({});
}

// Production security guard: fail fast in production, safely generate fallbacks in dev/test
if (parsedEnv.NODE_ENV === 'production') {
  if (!parsedEnv.SESSION_SECRET || parsedEnv.SESSION_SECRET === 'default-session-secret-change-in-production') {
    throw new Error('[FATAL] SESSION_SECRET is required and must not use the default fallback in production.');
  }
  if (!parsedEnv.ENCRYPTION_KEY || parsedEnv.ENCRYPTION_KEY === '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
    throw new Error('[FATAL] ENCRYPTION_KEY is required and must not use the default fallback in production.');
  }
  if (!parsedEnv.DATABASE_URL || parsedEnv.DATABASE_URL.includes('localhost') || parsedEnv.DATABASE_URL.includes('127.0.0.1')) {
    throw new Error('[FATAL] A non-localhost production DATABASE_URL is required in production.');
  }
  if (parsedEnv.DRY_RUN === true) {
    throw new Error('[FATAL] Production cannot run with DRY_RUN=true! Live outreach mode is required. Explicitly set DRY_RUN=false in production.');
  }
} else {
  if (!parsedEnv.SESSION_SECRET || parsedEnv.SESSION_SECRET === 'default-session-secret-change-in-production') {
    parsedEnv.SESSION_SECRET = crypto.randomBytes(32).toString('base64');
  }
  if (!parsedEnv.ENCRYPTION_KEY || parsedEnv.ENCRYPTION_KEY === '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
    parsedEnv.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  }
}

export const env = parsedEnv;
