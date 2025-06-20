-- Enhance articles table for better RSS content storage
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time INTEGER; -- in minutes
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2); -- -1.0 to 1.0
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'en';

-- Create RSS feeds management table
CREATE TABLE IF NOT EXISTS rss_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  last_fetched TIMESTAMP WITH TIME ZONE,
  fetch_interval INTEGER DEFAULT 30, -- minutes
  is_active BOOLEAN DEFAULT true,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for enhanced articles table
CREATE INDEX IF NOT EXISTS idx_articles_content_search ON articles USING gin(to_tsvector('english', coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_articles_title_search ON articles USING gin(to_tsvector('english', coalesce(title, '')));
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_articles_word_count ON articles(word_count);
CREATE INDEX IF NOT EXISTS idx_articles_is_processed ON articles(is_processed);
CREATE INDEX IF NOT EXISTS idx_articles_sentiment ON articles(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_articles_language ON articles(language_code);

-- Create indexes for RSS feeds table
CREATE INDEX IF NOT EXISTS idx_rss_feeds_category ON rss_feeds(category);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_active ON rss_feeds(is_active);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_last_fetched ON rss_feeds(last_fetched);

-- Add foreign key relationship (optional - links articles to their source feed)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS feed_id UUID REFERENCES rss_feeds(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);

-- Create article statistics table for analytics
CREATE TABLE IF NOT EXISTS article_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_articles INTEGER DEFAULT 0,
  articles_by_category JSONB DEFAULT '{}',
  articles_by_source JSONB DEFAULT '{}',
  avg_sentiment DECIMAL(3,2),
  top_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_article_stats_date ON article_stats(date);

-- Enable RLS on new tables
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for RSS feeds
CREATE POLICY "Allow read access to rss_feeds" ON rss_feeds
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for service role on rss_feeds" ON rss_feeds
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service role on rss_feeds" ON rss_feeds
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete for service role on rss_feeds" ON rss_feeds
    FOR DELETE USING (true);

-- Create policies for article stats
CREATE POLICY "Allow read access to article_stats" ON article_stats
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for service role on article_stats" ON article_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service role on article_stats" ON article_stats
    FOR UPDATE USING (true);

-- Update trigger for rss_feeds
CREATE TRIGGER update_rss_feeds_updated_at 
    BEFORE UPDATE ON rss_feeds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate reading time based on word count
CREATE OR REPLACE FUNCTION calculate_reading_time(word_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Average reading speed: 200 words per minute
    RETURN GREATEST(1, CEIL(word_count::DECIMAL / 200));
END;
$$ LANGUAGE plpgsql;

-- Function to extract and count words from content
CREATE OR REPLACE FUNCTION count_words(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
    IF content_text IS NULL OR LENGTH(TRIM(content_text)) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Remove HTML tags and count words
    RETURN array_length(
        string_to_array(
            regexp_replace(
                regexp_replace(content_text, '<[^>]*>', ' ', 'g'), 
                '\s+', ' ', 'g'
            ), 
            ' '
        ), 
        1
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate word count and reading time
CREATE OR REPLACE FUNCTION update_article_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate word count from content
    IF NEW.content IS NOT NULL THEN
        NEW.word_count = count_words(NEW.content);
        NEW.reading_time = calculate_reading_time(NEW.word_count);
    ELSIF NEW.description IS NOT NULL THEN
        NEW.word_count = count_words(NEW.description);
        NEW.reading_time = calculate_reading_time(NEW.word_count);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_article_metrics
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_metrics();

-- Function for full-text search across articles
CREATE OR REPLACE FUNCTION search_articles(
    search_query TEXT,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    content TEXT,
    link TEXT,
    source TEXT,
    category TEXT,
    pub_date TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.description,
        a.content,
        a.link,
        a.source,
        a.category,
        a.pub_date,
        ts_rank(
            to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a.content, '') || ' ' || coalesce(a.description, '')),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM articles a
    WHERE to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a.content, '') || ' ' || coalesce(a.description, ''))
          @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, a.pub_date DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
