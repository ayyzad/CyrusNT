ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS website_id BIGINT REFERENCES public.websites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_articles_website_id ON public.articles(website_id);

COMMENT ON COLUMN public.articles.website_id IS 'Foreign key to the source website in the websites table.';
