-- supabase/migrations/1734800023_schedule_firecrawl.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 1. Create the cron job to run every 30 minutes
SELECT cron.schedule(
    'invoke-firecrawl-map-scrape', -- Job name
    '*/15 * * * *', -- Every 15 minutes
    $$
    SELECT net.http_post(
        url:= (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/firecrawl-map-scrape?action=fetch',
        headers:= jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
        ),
        body:= concat('{"scheduled_at": "', now(), '"}')::jsonb
    );
    $$
);

-- 2. Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT USAGE ON SCHEMA net TO postgres;

-- 3. To view scheduled jobs:
-- SELECT * FROM cron.job;

-- 4. To unschedule the job:
-- SELECT cron.unschedule('invoke-firecrawl-map-scrape');
