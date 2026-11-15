-- Migration 0020: Campaign Leads Decoupling and Multi-Source Independence (v1.5)

-- 1. Create campaign_lead_status enum
DO $$ BEGIN
    CREATE TYPE campaign_lead_status AS ENUM (
      'ENROLLED',
      'SCHEDULED',
      'CONTACTED',
      'REPLIED',
      'COMPLETED',
      'PAUSED',
      'DISQUALIFIED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Generalize leads table for non-YouTube sources (CSV, Excel, etc.)
ALTER TABLE leads ALTER COLUMN channel_id DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN channel_url DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN channel_title DROP NOT NULL;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_provider VARCHAR(50) NOT NULL DEFAULT 'YOUTUBE';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS normalized_domain VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_normalized_domain ON leads (normalized_domain) WHERE normalized_domain IS NOT NULL AND normalized_domain != '';
CREATE INDEX IF NOT EXISTS idx_leads_source_provider ON leads (source_provider);

-- 3. Create campaign_leads join table (Campaign-Lead decoupling)
CREATE TABLE IF NOT EXISTS campaign_leads (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  primary_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  status campaign_lead_status NOT NULL DEFAULT 'ENROLLED',
  current_step_number INT NOT NULL DEFAULT 1,
  custom_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  disqualified_reason VARCHAR(255),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_campaign_leads_campaign_lead UNIQUE (campaign_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_status ON campaign_leads (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_id ON campaign_leads (lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_primary_contact ON campaign_leads (primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_contacted ON campaign_leads (lead_id, last_contacted_at);

-- 4. Enable Row Level Security
ALTER TABLE IF EXISTS campaign_leads ENABLE ROW LEVEL SECURITY;
