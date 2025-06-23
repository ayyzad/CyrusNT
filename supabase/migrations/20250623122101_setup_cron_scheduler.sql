-- This script requires the pg_cron extension to be enabled in your Supabase project.
-- IMPORTANT: You must replace the placeholders below with your actual project details.

-- 1. Create a database function to trigger the website mapping process.
-- This function calls the 'discover-urls' Edge Function.
CREATE OR REPLACE FUNCTION trigger_website_mapping()
RETURNS VOID AS $$
BEGIN
  -- Invokes the 'discover-urls' edge function with the 'mapWebsites' action.
  -- IMPORTANT: Replace <YOUR_PROJECT_REF> with your project reference.
  -- IMPORTANT: Replace <YOUR_SUPABASE_SERVICE_ROLE_KEY> with your service role key.
  -- You can find these in your Supabase project settings.
  PERFORM net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/discover-urls',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'mapWebsites')
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Schedule the function to run every 30 minutes.
-- The cron job is named 'half-hourly-website-mapping'.
-- '*/30 * * * *' means it runs at minutes 0, 30 of every hour.
SELECT cron.schedule(
  'half-hourly-website-mapping',
  '*/30 * * * *', -- Every 30 minutes
  'SELECT trigger_website_mapping()'
);

-- COMMENT: To unschedule this job later, run:
-- SELECT cron.unschedule('half-hourly-website-mapping');
