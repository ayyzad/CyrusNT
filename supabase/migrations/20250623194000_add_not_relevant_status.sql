-- Add 'not-relevant' status to scraping_queue table
-- This status is used when articles are scraped but filtered out due to irrelevant content

-- Drop the existing check constraint
ALTER TABLE public.scraping_queue DROP CONSTRAINT IF EXISTS scraping_queue_status_check;

-- Add the new check constraint with 'not-relevant' status
ALTER TABLE public.scraping_queue ADD CONSTRAINT scraping_queue_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'not-relevant'));

-- Update the comment to reflect the new status
COMMENT ON COLUMN public.scraping_queue.status IS 'The current status of the scraping job: pending, processing, completed, failed, or not-relevant (filtered out due to irrelevant content).';
