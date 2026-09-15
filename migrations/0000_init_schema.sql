-- 0000_init_schema.sql
-- LeadMiner Core Database Schema

-- Enums
DO $$ BEGIN
    CREATE TYPE keyword_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lead_qualification_status AS ENUM ('UNQUALIFIED', 'QUALIFIED', 'DISQUALIFIED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lead_outreach_status AS ENUM ('UNPROCESSED', 'QUEUED', 'CONTACTED', 'REPLIED', 'BOUNCED', 'UNSUBSCRIBED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE email_verification_status AS ENUM ('UNKNOWN', 'VALID', 'INVALID', 'RISKY', 'DISPOSABLE', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'STOPPED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE message_send_status AS ENUM ('PENDING', 'GENERATING', 'READY', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE personalization_status AS ENUM ('NONE', 'PENDING', 'CUSTOMIZED', 'FALLBACK', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'PAUSED', 'QUOTA_EXCEEDED', 'AUTH_ERROR', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'STOPPED_QUOTA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE log_level AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. keywords
CREATE TABLE IF NOT EXISTS keywords (
    id BIGSERIAL PRIMARY KEY,
    keyword VARCHAR(500) NOT NULL,
    normalized_keyword VARCHAR(500) NOT NULL,
    category VARCHAR(255) NOT NULL,
    entity VARCHAR(255) NOT NULL,
    modifier VARCHAR(255) NOT NULL,
    status keyword_status NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    channels_found INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_keywords_normalized UNIQUE (normalized_keyword)
);

CREATE INDEX IF NOT EXISTS idx_keywords_status_attempts ON keywords (status, attempt_count) WHERE status IN ('PENDING', 'RETRY');
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords (category);
CREATE INDEX IF NOT EXISTS idx_keywords_last_attempt ON keywords (last_attempt_at);

-- 2. leads
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(100) NOT NULL,
    channel_url VARCHAR(500) NOT NULL,
    channel_title VARCHAR(500) NOT NULL,
    custom_url VARCHAR(255),
    description TEXT,
    website VARCHAR(500),
    thumbnail_url VARCHAR(1000),
    subscriber_count BIGINT DEFAULT 0,
    video_count INT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    published_at TIMESTAMPTZ,
    source_keyword_id BIGINT REFERENCES keywords(id) ON DELETE SET NULL,
    qualification_status lead_qualification_status NOT NULL DEFAULT 'UNQUALIFIED',
    outreach_status lead_outreach_status NOT NULL DEFAULT 'UNPROCESSED',
    suppression_status BOOLEAN NOT NULL DEFAULT FALSE,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_payload JSONB,
    CONSTRAINT uq_leads_channel_id UNIQUE (channel_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_qualification ON leads (qualification_status, outreach_status) WHERE suppression_status = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_subscriber_count ON leads (subscriber_count DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source_keyword ON leads (source_keyword_id);

-- 3. contacts
CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    email VARCHAR(255),
    email_status email_verification_status NOT NULL DEFAULT 'UNKNOWN',
    verification_provider VARCHAR(100),
    verification_timestamp TIMESTAMPTZ,
    verification_reason TEXT,
    instagram VARCHAR(255),
    twitter VARCHAR(255),
    discord VARCHAR(255),
    tiktok VARCHAR(255),
    linkedin VARCHAR(255),
    other_social JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_contacts_lead_id UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_email_status ON contacts (email_status) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);

-- 4. templates
CREATE TABLE IF NOT EXISTS templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '["first_name", "channel_name", "channel_url", "subscriber_count", "custom_line"]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status campaign_status NOT NULL DEFAULT 'DRAFT',
    template_id BIGINT REFERENCES templates(id) ON DELETE RESTRICT,
    daily_limit INT NOT NULL DEFAULT 50,
    min_subscribers BIGINT DEFAULT 1000,
    max_subscribers BIGINT DEFAULT 1000000,
    target_categories JSONB DEFAULT '[]'::jsonb,
    enable_gemini_personalization BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);

-- 6. gmail_accounts
CREATE TABLE IF NOT EXISTS gmail_accounts (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    status account_status NOT NULL DEFAULT 'ACTIVE',
    daily_limit INT NOT NULL DEFAULT 40,
    sent_today INT NOT NULL DEFAULT 0,
    last_send_at TIMESTAMPTZ,
    credential_reference VARCHAR(500) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    token_expires_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gmail_accounts_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_gmail_accounts_status_limit ON gmail_accounts (status, sent_today, daily_limit);

-- 7. messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    gmail_account_id BIGINT REFERENCES gmail_accounts(id) ON DELETE SET NULL,
    template_id BIGINT REFERENCES templates(id) ON DELETE RESTRICT,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    personalization_status personalization_status NOT NULL DEFAULT 'NONE',
    personalization_model VARCHAR(100),
    personalization_error TEXT,
    send_status message_send_status NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    message_id VARCHAR(255),
    thread_id VARCHAR(255),
    error TEXT,
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_messages_lead_campaign UNIQUE (lead_id, campaign_id),
    CONSTRAINT uq_messages_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_messages_send_status ON messages (send_status);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages (thread_id);

-- 8. replies
CREATE TABLE IF NOT EXISTS replies (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    gmail_account_id BIGINT NOT NULL REFERENCES gmail_accounts(id) ON DELETE CASCADE,
    thread_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    snippet TEXT,
    received_at TIMESTAMPTZ NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    telegram_notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_replies_message_id UNIQUE (message_id)
);

CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON replies (thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_unprocessed ON replies (processed) WHERE processed = FALSE;

-- 9. jobs
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    job_type VARCHAR(100) NOT NULL,
    status job_status NOT NULL DEFAULT 'QUEUED',
    parameters JSONB DEFAULT '{}'::jsonb,
    items_total INT DEFAULT 0,
    items_processed INT DEFAULT 0,
    items_failed INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_heartbeat TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);

-- 10. logs
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    level log_level NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_event_level ON logs (event_type, level);

-- 11. suppressions
CREATE TABLE IF NOT EXISTS suppressions (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),
    channel_id VARCHAR(100),
    reason VARCHAR(255) NOT NULL DEFAULT 'UNSUBSCRIBED',
    source VARCHAR(100) NOT NULL DEFAULT 'OPT_OUT_LINK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_suppressions_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_suppressions_channel ON suppressions (channel_id);

-- 12. system_settings
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed critical default settings
INSERT INTO system_settings (key, value, description) VALUES
('kill_switch', '{"enabled": false}'::jsonb, 'Global outreach kill switch. Set enabled=true to immediately halt sending.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
('youtube_quota', '{"search_calls_daily_limit": 100, "search_calls_used_today": 0, "general_quota_daily_limit": 10000, "general_quota_used_today": 0, "last_reset_pt": "2026-09-15T00:00:00-07:00"}'::jsonb, 'YouTube API dual-bucket quota tracking (search.list 100 calls/day; general 10,000 units/day; resets midnight PT).')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
('batch_config', '{"keyword_batch_size": 10, "max_attempts": 3, "channel_limit_per_keyword": 15}'::jsonb, 'Discovery engine batch processing configuration.')
ON CONFLICT (key) DO NOTHING;
