-- Seed data for websites table
-- Insert Iran International website
INSERT INTO websites (url, name, description, category, is_active, scraping_enabled) 
VALUES (
    'https://www.iranintl.com/en',
    'Iran International',
    'Iran International English - Independent news and analysis about Iran',
    'Iran-Specific',
    true,
    true
) ON CONFLICT (url) DO NOTHING;