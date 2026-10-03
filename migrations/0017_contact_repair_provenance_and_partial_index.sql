-- Migration 0017: Contact Repair Provenance, Raw Context & Unverified Hot-Queue Partial Index

-- 1. Add provenance & raw context columns to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS repaired_from VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS repair_code VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS was_repaired BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS raw_context_snippet TEXT;

-- 2. Create the targeted unverified email hot-queue partial index
CREATE INDEX IF NOT EXISTS idx_contacts_unverified_email 
ON contacts (id) 
WHERE contact_type = 'EMAIL' AND email IS NOT NULL AND email_status = 'UNKNOWN';
