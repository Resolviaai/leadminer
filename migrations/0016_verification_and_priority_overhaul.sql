-- 0016_verification_and_priority_overhaul.sql
-- Decoupled Verification, 6-Tier Gradient Opportunity Ladder (A1-A6), and Domain Intelligence

-- 1. Add explainable confidence, opportunity tier, and priority scoring fields to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3, 2);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS opportunity_tier VARCHAR(10);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS priority_score INT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS priority_factors JSONB;

-- 2. Domain Cache table for domain intelligence, MX provider classification, and health
CREATE TABLE IF NOT EXISTS domain_cache (
    id BIGSERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    mx_host VARCHAR(255),
    mx_provider VARCHAR(50),
    has_mx BOOLEAN NOT NULL DEFAULT FALSE,
    is_catch_all BOOLEAN DEFAULT FALSE,
    is_disposable BOOLEAN NOT NULL DEFAULT FALSE,
    bounce_count INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    reply_count INT NOT NULL DEFAULT 0,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_domain_cache_domain UNIQUE (domain)
);

-- 3. Indexes for fast candidate filtering and priority retrieval
CREATE INDEX IF NOT EXISTS idx_contacts_opportunity_tier ON contacts (opportunity_tier);
CREATE INDEX IF NOT EXISTS idx_contacts_priority_score ON contacts (priority_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_contacts_confidence_score ON contacts (confidence_score);
CREATE INDEX IF NOT EXISTS idx_domain_cache_domain ON domain_cache (domain);
CREATE INDEX IF NOT EXISTS idx_domain_cache_expires_at ON domain_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_domain_cache_mx_provider ON domain_cache (mx_provider);
