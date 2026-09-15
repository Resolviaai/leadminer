ALTER TABLE leads ADD COLUMN IF NOT EXISTS country varchar(10);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_country varchar(10) DEFAULT 'US';
