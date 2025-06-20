// Supabase Edge Function for RSS Feed Processing
// This replaces the Next.js RSS API routes

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Deno runtime type declarations for Supabase Edge Functions
declare global {
  namespace Deno {
    function serve(
      handler: (request: Request) => Response | Promise<Response>,
      options?: { port?: number; hostname?: string }
    ): void;
    
    const env: {
      get(key: string): string | undefined;
    };
  }
}

// RSS Feed Source interface (copied from lib/sources.ts)
interface RSSFeedSource {
  category: string;
  source: string;
  notes: string;
  rssFeedUrl: string;
  filters?: {
    enabled: boolean;
    includeKeywords?: string[];
    excludeKeywords?: string[];
    titleOnly?: boolean;
  };
}

// RSS Feed Sources - now loaded from database
async function loadRSSFeeds(): Promise<RSSFeedSource[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rss_feeds?is_active=eq.true`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feeds: ${response.statusText}`);
    }

    const dbFeeds = await response.json();
    
    // Convert database format to RSSFeedSource format
    return dbFeeds.map((feed: any) => ({
      category: feed.category || "General",
      source: feed.name,
      notes: feed.description || "",
      rssFeedUrl: feed.url,
      filters: {
        enabled: feed.category === "Iran-Specific", // Enable filters for Iran sources
        includeKeywords: feed.category === "Iran-Specific" 
          ? ["iran", "tehran", "politics", "government", "diplomacy", "sanctions", "nuclear", "regime", "protest", "economy"]
          : [],
        excludeKeywords: ["sports", "entertainment"],
        titleOnly: false
      }
    }));
  } catch (error) {
    console.error('Error loading RSS feeds from database:', error);
    // Fallback to a minimal set if database fails
    return [
      {
        category: "Major International News",
        source: "BBC News",
        notes: "Comprehensive international news coverage.",
        rssFeedUrl: "http://feeds.bbci.co.uk/news/world/rss.xml",
        filters: { enabled: false }
      }
    ];
  }
}

// Helper function to check if an article passes the filters
function shouldIncludeArticle(
  article: { title: string; description?: string },
  filters?: RSSFeedSource['filters']
): boolean {
  if (!filters || !filters.enabled) {
    return true;
  }

  const textToCheck = filters.titleOnly 
    ? article.title.toLowerCase()
    : `${article.title} ${article.description || ''}`.toLowerCase();

  // Check exclude keywords first
  if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
    const hasExcludedKeyword = filters.excludeKeywords.some(keyword => 
      textToCheck.includes(keyword.toLowerCase())
    );
    if (hasExcludedKeyword) {
      return false;
    }
  }

  // Check include keywords
  if (filters.includeKeywords && filters.includeKeywords.length > 0) {
    const hasIncludedKeyword = filters.includeKeywords.some(keyword => 
      textToCheck.includes(keyword.toLowerCase())
    );
    return hasIncludedKeyword;
  }

  return true;
}

// Simple RSS parser for Deno
async function parseRSSFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsTracker/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Basic XML parsing for RSS feeds
    const items: any[] = [];
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    
    if (itemMatches) {
      for (const itemMatch of itemMatches) {
        const item: any = {};
        
        // Extract title
        const titleMatch = itemMatch.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          item.title = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
        }
        
        // Extract description
        const descMatch = itemMatch.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
        if (descMatch) {
          item.description = descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
        }
        
        // Extract link
        const linkMatch = itemMatch.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
        if (linkMatch) {
          item.link = linkMatch[1].trim();
        }
        
        // Extract publication date
        const pubDateMatch = itemMatch.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
        if (pubDateMatch) {
          item.pubDate = pubDateMatch[1].trim();
        }
        
        items.push(item);
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'fetch';

    switch (action) {
      case 'fetch': {
        console.log('Starting RSS feed fetch process...');
        const feeds = await loadRSSFeeds();
        const results = [];
        
        for (const feedSource of feeds) {
          console.log(`Processing feed: ${feedSource.source}`);
          
          try {
            const items = await parseRSSFeed(feedSource.rssFeedUrl);
            let processedCount = 0;
            
            for (const item of items.slice(0, 5)) { // Limit to 5 items per feed for testing
              if (!item.title || !item.link) continue;
              
              // Apply filters
              if (!shouldIncludeArticle(item, feedSource.filters)) {
                continue;
              }
              
              // Insert article using direct Supabase REST API
              const insertResponse = await fetch(`${supabaseUrl}/rest/v1/articles`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                  title: item.title,
                  description: item.description || '',
                  url: item.link,
                  source: feedSource.source,
                  category: feedSource.category,
                  published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                  content: item.description || '',
                })
              });
              
              if (insertResponse.ok) {
                processedCount++;
              } else {
                const errorText = await insertResponse.text();
                console.error(`Error inserting article: ${errorText}`);
              }
            }
            
            results.push({
              source: feedSource.source,
              processed: processedCount,
              total: items.length
            });
            
          } catch (error) {
            console.error(`Error processing feed ${feedSource.source}:`, error);
            results.push({
              source: feedSource.source,
              error: (error as Error).message
            });
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'RSS feeds processed',
            results
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      case 'status': {
        const feeds = await loadRSSFeeds();
        return new Response(
          JSON.stringify({
            success: true,
            totalFeeds: feeds.length,
            activeFeeds: feeds.filter((f: RSSFeedSource) => f.filters?.enabled !== false).length,
            message: 'RSS service is running'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      default: {
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use ?action=fetch or ?action=status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
