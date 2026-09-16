-- Add DISCONNECTED to account_status enum
ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'DISCONNECTED';
