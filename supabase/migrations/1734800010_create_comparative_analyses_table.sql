-- Create table for storing comparative analyses
CREATE TABLE IF NOT EXISTS comparative_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id TEXT NOT NULL,
    topic_summary TEXT NOT NULL,
    aggregate_summary TEXT NOT NULL,
    source_perspectives JSONB NOT NULL,
    similarity_threshold FLOAT NOT NULL,
    total_articles INTEGER NOT NULL,
    article_ids TEXT[] NOT NULL,
    analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_comparative_analyses_topic_id ON comparative_analyses(topic_id);
CREATE INDEX IF NOT EXISTS idx_comparative_analyses_timestamp ON comparative_analyses(analysis_timestamp);
CREATE INDEX IF NOT EXISTS idx_comparative_analyses_created_at ON comparative_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_comparative_analyses_article_ids ON comparative_analyses USING GIN(article_ids);

-- Add RLS policies
ALTER TABLE comparative_analyses ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role can manage comparative analyses" ON comparative_analyses
    FOR ALL USING (auth.role() = 'service_role');

-- Policy for authenticated users (read-only)
CREATE POLICY "Authenticated users can read comparative analyses" ON comparative_analyses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE comparative_analyses IS 'Stores comparative news analysis results with source perspectives and topic clustering';
