-- Migration 0018: Follow-up Engine Threading, References Chain, and Deferral Observability

-- 1. Add references_chain to messages table (stores RFC 822 parent message ID chain for O(1) header resolution)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS references_chain text;

-- 2. Add references_chain to lead_sequence_progress table
ALTER TABLE lead_sequence_progress ADD COLUMN IF NOT EXISTS references_chain text;

-- 3. Add defer_reason to scheduled_emails table (for explicit observability: DAILY_QUOTA_EXHAUSTED, RATE_LIMITED, etc.)
ALTER TABLE scheduled_emails ADD COLUMN IF NOT EXISTS defer_reason text;

-- 4. Add last_history_id to gmail_accounts table (for fast incremental history.list sync)
ALTER TABLE gmail_accounts ADD COLUMN IF NOT EXISTS last_history_id varchar(255);
