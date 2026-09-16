-- Add UNCONFIRMED to message_send_status enum
ALTER TYPE message_send_status ADD VALUE IF NOT EXISTS 'UNCONFIRMED';
