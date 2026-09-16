-- 0004_multi_email_outreach.sql
-- Enable multi-email outreach per lead and add contact_id to messages

ALTER TABLE messages ADD COLUMN IF NOT EXISTS contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);

-- Drop old single-email-per-lead constraint if exists
ALTER TABLE messages DROP CONSTRAINT IF EXISTS uq_messages_lead_campaign;
DROP INDEX IF EXISTS uq_messages_lead_campaign;

-- Create composite unique index on (lead_id, campaign_id, contact_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_lead_campaign_contact 
ON messages (lead_id, campaign_id, COALESCE(contact_id, 0));
