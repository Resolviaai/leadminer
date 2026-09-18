-- 0009_scheduled_dispatch.sql
-- Create scheduled_email_status enum if not exists
DO $$ BEGIN
    CREATE TYPE scheduled_email_status AS ENUM (
      'PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create scheduled_emails table
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id               BIGSERIAL PRIMARY KEY,
  campaign_id      BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id          BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id       BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  gmail_account_id BIGINT NOT NULL REFERENCES gmail_accounts(id) ON DELETE CASCADE,
  scheduled_at     TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_date   DATE NOT NULL,
  status           scheduled_email_status NOT NULL DEFAULT 'PENDING',
  attempts         INTEGER NOT NULL DEFAULT 0,
  sent_message_id  VARCHAR(255),
  error            TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Partial index for lightning-fast dispatcher queries (only inspects pending rows)
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_dispatch
  ON scheduled_emails (scheduled_at, status)
  WHERE status = 'PENDING';

-- Fast lookup to cancel scheduled rows when a lead replies
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_lead_status
  ON scheduled_emails (lead_id, status);

-- Index for per-account volume lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_account
  ON scheduled_emails (gmail_account_id, scheduled_at);

-- Prevent scheduling the same contact more than once per day for a campaign
CREATE UNIQUE INDEX IF NOT EXISTS uq_scheduled_emails_contact_date
  ON scheduled_emails (contact_id, campaign_id, scheduled_date);

-- Enable Row Level Security
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
