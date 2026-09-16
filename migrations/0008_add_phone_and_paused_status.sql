-- 0008_add_phone_and_paused_status.sql
-- Add PAUSED status to keyword_status enum
ALTER TYPE keyword_status ADD VALUE IF NOT EXISTS 'PAUSED';

-- Add PHONE and WHATSAPP to contact_type enum
ALTER TYPE contact_type ADD VALUE IF NOT EXISTS 'PHONE';
ALTER TYPE contact_type ADD VALUE IF NOT EXISTS 'WHATSAPP';

-- Add phone and contact_page_url to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone varchar(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_page_url varchar(500);
