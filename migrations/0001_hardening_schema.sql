-- 0001_hardening_schema.sql
-- LeadMiner Hardening & n8n Reintegration Migration

-- 1. Extend email_verification_status enum with DOMAIN_VALID and MAILBOX_VERIFIED
ALTER TYPE email_verification_status ADD VALUE IF NOT EXISTS 'DOMAIN_VALID';
ALTER TYPE email_verification_status ADD VALUE IF NOT EXISTS 'MAILBOX_VERIFIED';

-- 2. Create contact_type enum
DO $$ BEGIN
    CREATE TYPE contact_type AS ENUM (
        'EMAIL',
        'WEBSITE',
        'INSTAGRAM',
        'TWITTER_X',
        'TIKTOK',
        'DISCORD',
        'LINKEDIN',
        'LINKTREE',
        'BEACONS',
        'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Update keywords table with performance and yield feedback metrics
ALTER TABLE keywords
    ADD COLUMN IF NOT EXISTS new_channels_found INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS qualified_leads_found INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS emails_found INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified_emails INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS priority_score INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_keywords_priority_status ON keywords(priority_score DESC, status, attempt_count);

-- 4. Create lead_keyword_sources table for multi-keyword provenance tracking
CREATE TABLE IF NOT EXISTS lead_keyword_sources (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    keyword_id BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_lead_keyword_source UNIQUE (lead_id, keyword_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_keyword_lead_id ON lead_keyword_sources(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_keyword_keyword_id ON lead_keyword_sources(keyword_id);

-- 5. Backfill existing lead-to-keyword provenance
INSERT INTO lead_keyword_sources (lead_id, keyword_id, first_seen_at, last_seen_at)
SELECT id, source_keyword_id, discovered_at, updated_at
FROM leads
WHERE source_keyword_id IS NOT NULL
ON CONFLICT (lead_id, keyword_id) DO NOTHING;

-- 6. Enhance contacts table:
-- Add contact_type, value, normalized_value, source, is_primary columns to support 1:N contacts
ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS contact_type contact_type NOT NULL DEFAULT 'EMAIL',
    ADD COLUMN IF NOT EXISTS value TEXT,
    ADD COLUMN IF NOT EXISTS normalized_value TEXT,
    ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'description',
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing rows value and normalized_value from email if null
UPDATE contacts
SET value = email, normalized_value = LOWER(TRIM(email))
WHERE value IS NULL AND email IS NOT NULL;

-- Drop the old 1:1 unique constraint on lead_id so multiple contacts can be stored per lead
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS uq_contacts_lead_id CASCADE;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_lead_id_key CASCADE;
DROP INDEX IF EXISTS uq_contacts_lead_id CASCADE;

-- Create new compound index on (lead_id, contact_type, normalized_value)
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_lead_type_value ON contacts (lead_id, contact_type, normalized_value);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_type ON contacts (lead_id, contact_type);