-- 0005_add_simulated_status.sql
-- Add SIMULATED send status for dry run outreach tracking without polluting real sent history
ALTER TYPE message_send_status ADD VALUE IF NOT EXISTS 'SIMULATED';
