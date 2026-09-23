-- Migration 0014: Add refreshed_at to leads table for YouTube 25-day compliance refresh
ALTER TABLE leads ADD COLUMN IF NOT EXISTS refreshed_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_leads_refreshed_at ON leads(refreshed_at);
