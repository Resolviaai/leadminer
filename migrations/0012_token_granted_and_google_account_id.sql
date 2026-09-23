-- Migration 0012: Add token_granted_at and google_account_id to gmail_accounts
-- token_granted_at: tracks token grant timestamp to alert 5 days before 7-day Google Testing mode expiry
-- google_account_id: tracks stable Google user ID (sub) so warmup doesn't restart on reconnect

ALTER TABLE "gmail_accounts" ADD COLUMN IF NOT EXISTS "token_granted_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "gmail_accounts" ADD COLUMN IF NOT EXISTS "google_account_id" VARCHAR(255);
