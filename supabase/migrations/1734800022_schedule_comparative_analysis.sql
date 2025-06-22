-- supabase/migrations/1734800022_schedule_comparative_analysis.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 1. Create the cron job to run every 6 hours
SELECT cron.schedule(
    'invoke-comparative-analysis',
    '*/60 * * * *', -- Every 60 minutes
    $$
    SELECT net.http_post(
        url:= (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/comparative-analysis?action=analyze&hours_back=12',
        headers:= jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
        )
        -- No body is needed as params are in the URL
    );
    $$
);

-- 2. Grant the postgres user permission to use the cron extension
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Grant the postgres user permission to call the http extension
GRANT USAGE ON SCHEMA net TO postgres;

-- 4. Note: Extension creation is now handled at the top of this script.

-- 5. To view scheduled jobs:
-- SELECT * FROM cron.job;

-- 6. To unschedule the job:
-- SELECT cron.unschedule('invoke-comparative-analysis');
