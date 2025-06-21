-- Migration: Create websites table
-- Created: 2024-12-23
-- Purpose: Store website URLs for content scraping and monitoring

CREATE TABLE IF NOT EXISTS websites (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    name TEXT,
    description TEXT,
    category TEXT DEFAULT 'General',
    is_active BOOLEAN DEFAULT true,
    scraping_enabled BOOLEAN DEFAULT true,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_url ON websites(url);
CREATE INDEX IF NOT EXISTS idx_websites_is_active ON websites(is_active);
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category);
CREATE INDEX IF NOT EXISTS idx_websites_last_scraped ON websites(last_scraped_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access
CREATE POLICY "Allow read access to websites" ON websites
    FOR SELECT USING (true);

-- Create policy to allow insert/update for authenticated users
CREATE POLICY "Allow insert/update for authenticated users" ON websites
    FOR ALL USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_websites_updated_at 
    BEFORE UPDATE ON websites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
