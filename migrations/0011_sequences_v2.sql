-- 0011_sequences_v2.sql
-- Sequence v2 Architecture: Multi-Step Sequences, Step-Aware Constraints, and State Machine

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE sequence_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_sequence_status AS ENUM (
      'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED_REPLY', 'CANCELLED_OPT_OUT', 'CANCELLED_BOUNCED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create sequences table
CREATE TABLE IF NOT EXISTS sequences (
  id               BIGSERIAL PRIMARY KEY,
  campaign_id      BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  weekend_policy   VARCHAR(30) NOT NULL DEFAULT 'SKIP_WEEKENDS',
  capacity_bias    NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  priority_weights JSONB DEFAULT '{"overdue": 10, "step": 1, "subs": 2}'::jsonb,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sequences_campaign_id ON sequences (campaign_id);
CREATE INDEX IF NOT EXISTS idx_sequences_is_active ON sequences (is_active);

-- 3. Create sequence_steps table
CREATE TABLE IF NOT EXISTS sequence_steps (
  id           BIGSERIAL PRIMARY KEY,
  sequence_id  BIGINT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_number  INTEGER NOT NULL,
  template_id  BIGINT NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
  delay_days   INTEGER NOT NULL DEFAULT 2,
  delay_hours  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sequence_steps_seq_num
  ON sequence_steps (sequence_id, step_number);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_template_id
  ON sequence_steps (template_id);

-- 4. Create lead_sequence_progress table (State Machine)
CREATE TABLE IF NOT EXISTS lead_sequence_progress (
  id                     BIGSERIAL PRIMARY KEY,
  lead_id                BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id            BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id             BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_id            BIGINT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  current_step           INTEGER NOT NULL DEFAULT 1,
  status                 lead_sequence_status NOT NULL DEFAULT 'ACTIVE',
  pinned_gmail_account_id BIGINT REFERENCES gmail_accounts(id) ON DELETE SET NULL,
  last_sent_at           TIMESTAMP WITH TIME ZONE,
  next_step_due_at       TIMESTAMP WITH TIME ZONE,
  thread_id              VARCHAR(255),
  last_rfc822_message_id VARCHAR(255),
  created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_seq_progress_contact_seq
  ON lead_sequence_progress (contact_id, sequence_id);
CREATE INDEX IF NOT EXISTS idx_lead_seq_progress_status_due
  ON lead_sequence_progress (status, next_step_due_at)
  WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_lead_seq_progress_lead_status
  ON lead_sequence_progress (lead_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_seq_progress_account_due
  ON lead_sequence_progress (pinned_gmail_account_id, status, next_step_due_at);

-- 5. Alter messages table for Step-Aware Uniqueness and RFC822 IDs
ALTER TABLE messages ADD COLUMN IF NOT EXISTS step_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS rfc822_message_id VARCHAR(255);

-- Replace single-step unique constraint with step-aware constraint
DROP INDEX IF EXISTS uq_messages_lead_campaign_contact;
CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_lead_campaign_contact_step 
  ON messages (lead_id, campaign_id, contact_id, step_number);

CREATE INDEX IF NOT EXISTS idx_messages_rfc822_id 
  ON messages (rfc822_message_id);

-- 6. Alter scheduled_emails table for Step-Aware Scheduling
ALTER TABLE scheduled_emails ADD COLUMN IF NOT EXISTS step_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scheduled_emails ADD COLUMN IF NOT EXISTS in_reply_to_rfc_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_scheduled_emails_contact_step 
  ON scheduled_emails (contact_id, campaign_id, step_number);

-- Enable RLS on new tables
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sequence_progress ENABLE ROW LEVEL SECURITY;
