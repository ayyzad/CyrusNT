-- Schedule RSS Fetch Edge Function
-- Run this SQL in your Supabase SQL Editor to set up automatic RSS fetching

-- 1. Store your project URL and anon key securely in Supabase Vault
select vault.create_secret('https://your-project-ref.supabase.co', 'project_url');
select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');

-- 2. Schedule the RSS fetch function to run every 1 minute
select cron.schedule(
  'fetch-rss-articles',
  '* * * * *', -- Every 1 minute
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/fetch-rss?action=fetch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
    ),
    body := concat('{"scheduled_at": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- 3. Optional: Check scheduled jobs
select * from cron.job;

-- 4. Optional: View job run history
select * from cron.job_run_details order by start_time desc limit 10;

-- 5. Optional: To remove the scheduled job later
-- select cron.unschedule('fetch-rss-articles');
