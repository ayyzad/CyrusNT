-- Insert sample RSS feeds for news tracking
INSERT INTO rss_feeds (name, url, category, description, fetch_interval) VALUES
('BBC World News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'World News', 'BBC World News RSS feed', 30),
('Reuters World News', 'https://feeds.reuters.com/reuters/worldNews', 'World News', 'Reuters international news', 30),
('CNN World', 'http://rss.cnn.com/rss/edition.rss', 'World News', 'CNN international news feed', 30),
('TechCrunch', 'https://techcrunch.com/feed/', 'Technology', 'Latest technology news and startup coverage', 15),
('Hacker News', 'https://hnrss.org/frontpage', 'Technology', 'Hacker News front page stories', 60),
('The Verge', 'https://www.theverge.com/rss/index.xml', 'Technology', 'Technology, science, art, and culture', 30),
('Financial Times', 'https://www.ft.com/rss/home', 'Business', 'Financial and business news', 30),
('Bloomberg', 'https://feeds.bloomberg.com/markets/news.rss', 'Business', 'Financial markets and business news', 15),
('Associated Press', 'https://feeds.apnews.com/rss/apf-topnews', 'General', 'AP top news stories', 30),
('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'General', 'NPR latest news', 30)
ON CONFLICT (url) DO NOTHING;
