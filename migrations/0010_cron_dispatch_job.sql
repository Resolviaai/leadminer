-- 0010_cron_dispatch_job.sql
-- Enable pg_net and pg_cron extensions if available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Schedule autonomous 15-minute outreach dispatch ticker
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') AND
     EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    
    -- Unschedule previous job if exists
    PERFORM cron.unschedule('dispatch-scheduled-outreach')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dispatch-scheduled-outreach');

    -- Schedule every 15 minutes
    PERFORM cron.schedule(
      'dispatch-scheduled-outreach',
      '*/15 * * * *',
      $cmd$
      SELECT net.http_get(
        url := 'https://leadminer-app.vercel.app/api/workers/dispatch',
        headers := '{"Authorization": "Bearer 7d3a8f1e5c2b9a4d6f8e0b1c3a5d7e9f"}'::jsonb
      );
      $cmd$
    );
  END IF;
END $$;
