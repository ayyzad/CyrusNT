-- Insert new Iran-specific RSS sources into rss_feeds table
-- Run this in your Supabase SQL Editor

-- Clear existing feeds first (optional)
-- DELETE FROM rss_feeds;

-- Insert all RSS sources including Iran-specific ones
INSERT INTO rss_feeds (name, url, category, description, is_active) VALUES
-- Major International News
('BBC News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'Major International News', 'Comprehensive international news coverage.', true),
('Reuters World News', 'https://feeds.reuters.com/Reuters/worldNews', 'Major International News', 'Breaking news and analysis from around the world.', true),
('The Guardian World', 'https://www.theguardian.com/world/rss', 'Major International News', 'In-depth reporting on global affairs.', true),
('Al Jazeera English', 'https://www.aljazeera.com/xml/rss/all.xml', 'Major International News', 'Middle East and international news perspective.', true),
('CNN World', 'http://rss.cnn.com/rss/edition.rss', 'Major International News', 'Breaking news and analysis from around the world.', true),
('NPR World', 'https://feeds.npr.org/1004/rss.xml', 'Major International News', 'High-quality reporting on international affairs.', true),

-- Think Tanks & Research
('Foreign Affairs', 'https://www.foreignaffairs.com/rss.xml', 'Think Tanks & Research', 'Leading publication on international relations and foreign policy.', true),

-- Specialized & Regional
('The Diplomat', 'https://thediplomat.com/feed/', 'Specialized & Regional', 'Asia-Pacific political and security analysis.', true),
('Middle East Eye', 'https://www.middleeasteye.net/rss.xml', 'Specialized & Regional', 'Independent news and analysis on the Middle East.', true),

-- Iran-Specific Sources
('Iran International', 'https://www.iranintl.com/en/rss.xml', 'Iran-Specific', 'Persian-language news channel covering Iran.', true),
('Radio Farda (RFE/RL)', 'https://www.radiofarda.com/rss/', 'Iran-Specific', 'In-depth political and social coverage from a diaspora perspective.', true),
('Voice of America (VOA) - Iran', 'https://www.voanews.com/rss/iran', 'Iran-Specific', 'U.S. government-funded broadcaster''s news on Iran.', true),
('IranWire', 'https://iranwire.com/en/rss', 'Iran-Specific', 'News, features, and analysis from professional Iranian journalists.', true),
('Tehran Times', 'https://www.tehrantimes.com/rss', 'Iran-Specific', 'English-language daily newspaper based in Tehran.', true),
('Mehr News Agency (MNA)', 'https://en.mehrnews.com/rss', 'Iran-Specific', 'Private news agency based in Iran.', true),
('Islamic Republic News Agency (IRNA)', 'https://en.irna.ir/rss', 'Iran-Specific', 'The official news agency of the Islamic Republic of Iran.', true),
('Financial Tribune', 'https://financialtribune.com/feed', 'Iran-Specific', 'Iran''s first English-language economic daily newspaper.', true),
('Tasnim News Agency', 'https://www.tasnimnews.com/en/rss/feed/0/8/0', 'Iran-Specific', 'Iranian news agency with English coverage.', true),
('Iran News Daily', 'https://www.irannewsdaily.com/feed', 'Iran-Specific', 'Daily news coverage on Iran.', true),
('Iran Front Page', 'https://ifpnews.com/feed', 'Iran-Specific', 'Iranian news and analysis.', true),
('Iran Herald', 'https://www.iranherald.com/rss.xml', 'Iran-Specific', 'Iranian news coverage.', true),
('Iran Times', 'https://www.iran-times.com/feed/', 'Iran-Specific', 'Iranian-American community newspaper.', true),
('The Iran Primer', 'https://iranprimer.usip.org/rss.xml', 'Iran-Specific', 'Analysis and resources on Iran from USIP.', true),
('Iran Daily', 'https://www.irandaily.ir/rss', 'Iran-Specific', 'Iranian English-language daily newspaper.', true),
('Iran Focus', 'https://www.iranfocus.com/en/feed/', 'Iran-Specific', 'News and analysis on Iran.', true),

-- Other Resources
('r/geopolitics', 'https://www.reddit.com/r/geopolitics/.rss', 'Other Resources', 'An informal but useful aggregator of articles and discussions.', true)

ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
