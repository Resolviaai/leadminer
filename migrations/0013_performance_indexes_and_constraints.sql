-- Migration 0013: Performance indexes and campaign sequence uniqueness
-- P2-29: Unique index on sequences.campaign_id to prevent duplicate sequences per campaign
-- P2-30: Performance indexes for high-frequency queries on messages, jobs, and scheduled_emails

CREATE UNIQUE INDEX IF NOT EXISTS "uq_sequences_campaign_id" ON "sequences" ("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_messages_sent_at" ON "messages" ("sent_at");
CREATE INDEX IF NOT EXISTS "idx_jobs_status_type" ON "jobs" ("status", "job_type");
CREATE INDEX IF NOT EXISTS "idx_scheduled_emails_status_scheduled" ON "scheduled_emails" ("status", "scheduled_at");
