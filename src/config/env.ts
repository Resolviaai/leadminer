import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:3000/api'),
  PORT: z.coerce.number().default(3000),
  DRY_RUN: z.string().transform((val) => val === 'true').default('true'),

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

  // Gemini API
  GEMINI_API_KEY: z.string().optional().default('AIzaSyDas-UU7agAjyQeHDag1yOMU6qyXuxIWBE'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_CHAT_ID: z.string().optional().default(''),

  // Email Verification
  EMAIL_VERIFICATION_PROVIDER: z.enum(['local', 'hunter', 'zerobounce', 'neverbounce']).default('local'),
  EMAIL_VERIFICATION_API_KEY: z.string().optional().default(''),

  // Google OAuth / Gmail
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3000/api/auth/google/callback'),

  // Security
  SESSION_SECRET: z.string().default('default-session-secret-change-in-production'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

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
} catch (error) {
  console.warn('⚠️ Warning: Some environment variables are not set. Using safe defaults for dry run mode.');
  parsedEnv = envSchema.parse({});
}

export const env = parsedEnv;
