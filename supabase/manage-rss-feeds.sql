-- RSS Feeds Management SQL Script
-- Use these queries to add, remove, and manage RSS feeds in your database

-- ============================================================================
-- VIEW ALL RSS FEEDS
-- ============================================================================
-- List all RSS feeds with their status
SELECT 
    name,
    url,
    category,
    is_active,
    fetch_interval,
    error_count,
    last_fetched,
    created_at
FROM rss_feeds 
ORDER BY category, name;

-- Count feeds by category
SELECT 
    category,
    COUNT(*) as feed_count,
    COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM rss_feeds 
GROUP BY category
ORDER BY category;

-- ============================================================================
-- ADD NEW RSS FEEDS
-- ============================================================================

-- Template for adding a new RSS feed
INSERT INTO rss_feeds (name, url, category, description, fetch_interval, is_active)
VALUES (
    'Feed Name Here',
    'https://example.com/rss.xml',
    'Category Here', -- Options: 'Iran-Specific', 'World News', 'Technology', 'Business', 'General'
    'Description of the feed',
    30, -- Fetch interval in minutes
    true -- Is active
);

-- Example: Add Al Jazeera English
INSERT INTO rss_feeds (name, url, category, description, fetch_interval, is_active)
VALUES (
    'Al Jazeera English',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'World News',
    'International news from Al Jazeera',
    30,
    true
);

-- Example: Add Iran-specific source
INSERT INTO rss_feeds (name, url, category, description, fetch_interval, is_active)
VALUES (
    'Press TV',
    'https://www.presstv.ir/rss',
    'Iran-Specific',
    'Iranian state-run English-language news network',
    30,
    true
);

-- Example: Add multiple Iran sources at once
INSERT INTO rss_feeds (name, url, category, description, fetch_interval, is_active)
VALUES 
    ('IRNA English', 'https://en.irna.ir/rss', 'Iran-Specific', 'Islamic Republic News Agency - English', 30, true),
    ('Tasnim News', 'https://www.tasnimnews.com/en/rss/feed', 'Iran-Specific', 'Tasnim News Agency - English', 30, true),
    ('Financial Tribune', 'https://financialtribune.com/rss', 'Iran-Specific', 'Iran business and economic news', 30, true);

-- ============================================================================
-- UPDATE RSS FEEDS
-- ============================================================================

-- Activate/Deactivate a feed
UPDATE rss_feeds 
SET is_active = false 
WHERE name = 'Feed Name Here';

UPDATE rss_feeds 
SET is_active = true 
WHERE name = 'Feed Name Here';

-- Change fetch interval
UPDATE rss_feeds 
SET fetch_interval = 15 
WHERE name = 'Feed Name Here';

-- Update feed URL
UPDATE rss_feeds 
SET url = 'https://new-url.com/rss.xml' 
WHERE name = 'Feed Name Here';

-- Reset error count
UPDATE rss_feeds 
SET error_count = 0, last_error = NULL 
WHERE name = 'Feed Name Here';

-- ============================================================================
-- REMOVE RSS FEEDS
-- ============================================================================

-- Remove a specific feed by name
DELETE FROM rss_feeds 
WHERE name = 'Feed Name Here';

-- Remove a specific feed by ID
DELETE FROM rss_feeds 
WHERE id = 'feed-id-here';

-- Remove all inactive feeds
DELETE FROM rss_feeds 
WHERE is_active = false;

-- Remove feeds with high error counts (be careful!)
DELETE FROM rss_feeds 
WHERE error_count > 10;

-- ============================================================================
-- BULK OPERATIONS
-- ============================================================================

-- Deactivate all feeds in a category
UPDATE rss_feeds 
SET is_active = false 
WHERE category = 'Technology';

-- Activate all Iran-specific feeds
UPDATE rss_feeds 
SET is_active = true 
WHERE category = 'Iran-Specific';

-- Set all feeds to fetch every 30 minutes
UPDATE rss_feeds 
SET fetch_interval = 30;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Find feeds that haven't been fetched recently
SELECT name, url, last_fetched, error_count
FROM rss_feeds 
WHERE is_active = true 
AND (last_fetched IS NULL OR last_fetched < NOW() - INTERVAL '2 hours')
ORDER BY last_fetched ASC;

-- Find feeds with errors
SELECT name, url, error_count, last_error
FROM rss_feeds 
WHERE error_count > 0
ORDER BY error_count DESC;

-- Clean up old articles (optional - be careful!)
-- DELETE FROM articles 
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================================================
-- COMPREHENSIVE RSS SOURCES TO ADD
-- ============================================================================

-- Add all RSS sources with conflict resolution to prevent duplicates
-- This includes current sources plus additional Iran-specific sources

INSERT INTO rss_feeds (name, url, category, description, fetch_interval, is_active) VALUES

-- CURRENT SOURCES (already in database)
('BBC World News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'World News', 'BBC World News RSS feed', 30, true),
('Reuters World News', 'https://feeds.reuters.com/reuters/worldNews', 'World News', 'Reuters international news', 30, true),
('CNN World', 'http://rss.cnn.com/rss/edition.rss', 'World News', 'CNN international news feed', 30, true),
('TechCrunch', 'https://techcrunch.com/feed/', 'Technology', 'Latest technology news and startup coverage', 15, true),
('Hacker News', 'https://hnrss.org/frontpage', 'Technology', 'Hacker News front page stories', 60, true),
('The Verge', 'https://www.theverge.com/rss/index.xml', 'Technology', 'Technology, science, art, and culture', 30, true),
('Financial Times', 'https://www.ft.com/rss/home', 'Business', 'Financial and business news', 30, true),
('Bloomberg', 'https://feeds.bloomberg.com/markets/news.rss', 'Business', 'Financial markets and business news', 15, true),
('Associated Press', 'https://feeds.apnews.com/rss/apf-topnews', 'General', 'AP top news stories', 30, true),
('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'General', 'NPR latest news', 30, true),
('Tehran Times', 'https://www.tehrantimes.com/rss', 'Iran-Specific', 'English-language daily newspaper based in Tehran', 30, true),
('Radio Farda (RFE/RL)', 'https://www.radiofarda.com/rss/', 'Iran-Specific', 'In-depth political and social coverage from a diaspora perspective', 30, true),
('IranWire', 'https://iranwire.com/en/rss', 'Iran-Specific', 'News, features, and analysis from professional Iranian journalists', 30, true),
('Mehr News Agency (MNA)', 'https://en.mehrnews.com/rss', 'Iran-Specific', 'Private news agency based in Iran', 30, true),
('Iran International', 'https://www.iranintl.com/en/rss.xml', 'Iran-Specific', 'Persian-language news channel covering Iran', 30, true),
('Voice of America (VOA) - Iran', 'https://www.voanews.com/rss/iran', 'Iran-Specific', 'U.S. government-funded broadcaster on Iran', 30, true),

-- ADDITIONAL IRAN-SPECIFIC SOURCES
('Islamic Republic News Agency (IRNA)', 'https://en.irna.ir/rss', 'Iran-Specific', 'The official news agency of the Islamic Republic of Iran', 30, true),
('Financial Tribune', 'https://financialtribune.com/feed', 'Iran-Specific', 'Iran''s first English-language economic daily newspaper', 30, true),
('Tasnim News Agency', 'https://www.tasnimnews.com/en/rss/feed/0/8/0', 'Iran-Specific', 'Iranian news agency with English coverage', 30, true),
('Iran News Daily', 'https://www.irannewsdaily.com/feed', 'Iran-Specific', 'Daily news coverage on Iran', 30, true),
('Iran Front Page', 'https://ifpnews.com/feed', 'Iran-Specific', 'Iranian news and analysis', 30, true),
('Iran Herald', 'https://www.iranherald.com/rss.xml', 'Iran-Specific', 'Iranian news coverage', 30, true),
('Iran Times', 'https://www.iran-times.com/feed/', 'Iran-Specific', 'Iranian-American community newspaper', 30, true),
('The Iran Primer', 'https://iranprimer.usip.org/rss.xml', 'Iran-Specific', 'Analysis and resources on Iran from USIP', 30, true),
('Iran Daily', 'https://www.irandaily.ir/rss', 'Iran-Specific', 'Iranian English-language daily newspaper', 30, true),
('Iran Focus', 'https://www.iranfocus.com/en/feed/', 'Iran-Specific', 'News and analysis on Iran', 30, true),
('Press TV', 'https://www.presstv.ir/rss', 'Iran-Specific', 'Iranian state-run English-language news network', 30, true),
('Fars News Agency', 'https://en.farsnews.ir/rss', 'Iran-Specific', 'Fars News Agency - English', 30, true),

-- ADDITIONAL INTERNATIONAL SOURCES
('Al Jazeera English', 'https://www.aljazeera.com/xml/rss/all.xml', 'World News', 'Middle East and international news perspective', 30, true),
('The Guardian World', 'https://www.theguardian.com/world/rss', 'World News', 'In-depth reporting on global affairs', 30, true),
('NPR World', 'https://feeds.npr.org/1004/rss.xml', 'World News', 'High-quality reporting on international affairs', 30, true),
('Foreign Affairs', 'https://www.foreignaffairs.com/rss.xml', 'Think Tanks & Research', 'Leading publication on international relations and foreign policy', 30, true),
('The Diplomat', 'https://thediplomat.com/feed/', 'Specialized & Regional', 'Asia-Pacific political and security analysis', 30, true),
('Middle East Eye', 'https://www.middleeasteye.net/rss.xml', 'Specialized & Regional', 'Independent news and analysis on the Middle East', 30, true)

ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  fetch_interval = EXCLUDED.fetch_interval,
  is_active = EXCLUDED.is_active;
