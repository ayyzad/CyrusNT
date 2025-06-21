// Supabase Edge Function for Firecrawl Feed Processing
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

// Website interface for database
interface Website {
  id: number;
  url: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  scraping_enabled: boolean;
}

// Firecrawl response interface
interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    json?: any;
    metadata?: {
      title?: string;
      description?: string;
      author?: string;
      robots?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogUrl?: string;
      ogImage?: string;
      ogLocaleAlternate?: string[];
      ogSiteName?: string;
      sourceURL?: string;
    };
    links?: string[];
  };
  error?: string;
}

// Load websites from database
async function loadWebsites(): Promise<Website[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/websites?is_active=eq.true&scraping_enabled=eq.true`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load websites: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading websites:', error);
    throw error;
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
        console.log('Starting Firecrawl scraping process...');
        const websites = await loadWebsites();
        const results = [];
        
        for (const website of websites) {
          console.log(`Processing website: ${website.name}`);
          let processed = 0;
          let total = 0;
          let error = '';
          
          try {
            const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
            if (!firecrawlApiKey) {
              throw new Error('Missing Firecrawl API key');
            }
            
            // Step 1: Map the website to discover all URLs
            const mapResponse = await fetch(`https://api.firecrawl.dev/v1/map`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firecrawlApiKey}`,
              },
              body: JSON.stringify({
                url: website.url,
                includeSubdomains: true
              }),
            }).then(async response => {
              const text = await response.text();
              try {
                return JSON.parse(text);
              } catch (error) {
                console.log(`[Error] Failed to parse Firecrawl map response as JSON. Status: ${response.status}, Response: ${text.substring(0, 200)}...`);
                throw new Error(`Invalid JSON response from Firecrawl map API: ${text.substring(0, 100)}`);
              }
            });
            
            if (mapResponse.success && mapResponse.links) {
              const discoveredLinks = mapResponse.links;
              
              // Filter out base URLs (exact match with the website URL)
              const filteredLinks = discoveredLinks.filter((link: string) => link !== website.url);
              
              console.log(`[Info] Discovered ${discoveredLinks.length} total URLs, filtered to ${filteredLinks.length} URLs (excluded base URL)`);
              
              // Query existing article URLs from database to avoid reprocessing
              const existingUrlsResponse = await fetch(`${supabaseUrl}/rest/v1/articles?select=link`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'apikey': supabaseKey,
                }
              });
              
              const existingArticles = await existingUrlsResponse.json();
              const existingUrls = new Set(existingArticles.map((article: any) => article.link));
              
              // Filter out URLs that already exist in database
              const newUrls = filteredLinks.filter((link: string) => !existingUrls.has(link));
              
              console.log(`[Info] Found ${existingUrls.size} existing articles, ${newUrls.length} new URLs to process`);
              
              // Limit to first 5 URLs to avoid timeouts and rate limits
              const limitedLinks = newUrls.slice(0, 5);
              
              // Step 2: Scrape each individual article URL
              for (const link of limitedLinks) {
                total++;
                console.log(`[Info] Processing URL ${total}/${limitedLinks.length}: ${link}`);
                
                const scrapeResponse: FirecrawlResponse = await fetch(`https://api.firecrawl.dev/v1/scrape`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firecrawlApiKey}`,
                  },
                  body: JSON.stringify({
                    url: link,
                  }),
                }).then(async response => {
                  const text = await response.text();
                  try {
                    return JSON.parse(text);
                  } catch (error) {
                    console.log(`[Error] Failed to parse Firecrawl scrape response as JSON. Status: ${response.status}, Response: ${text.substring(0, 200)}...`);
                    throw new Error(`Invalid JSON response from Firecrawl scrape API: ${text.substring(0, 100)}`);
                  }
                });
                
                if (scrapeResponse.success && scrapeResponse.data) {
                  const metadata = scrapeResponse.data.metadata || {};
                  const content = scrapeResponse.data.markdown || '';
                  
                  // Use scraped article metadata for title and description
                  const title = metadata.title || metadata.ogTitle || 'Untitled';
                  const description = metadata.description || metadata.ogDescription || '';
                  const author = metadata.author || '';
                  
                  // Insert article using direct Supabase REST API with upsert
                  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/articles?on_conflict=link`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${supabaseKey}`,
                      'Content-Type': 'application/json',
                      'apikey': supabaseKey,
                      'Prefer': 'return=minimal, resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                      title: title,
                      description: description,
                      content: content,
                      link: link,
                      source: website.name,
                      category: website.category,
                      author: author,
                      pub_date: new Date().toISOString(),
                      guid: link,
                    })
                  });
                  
                  if (insertResponse.ok || insertResponse.status === 409) {
                    processed++;
                    if (insertResponse.status === 409) {
                      console.log(`[Info] Duplicate article skipped: ${link}`);
                    } else {
                      console.log(`[Info] New article inserted: ${link}`);
                    }
                  } else {
                    console.log(`[Error] Failed to insert article: ${link}, Status: ${insertResponse.status}`);
                    error = await insertResponse.text();
                  }
                } else {
                  console.log(`[Warning] Failed to scrape content for: ${link}, Response: ${JSON.stringify(scrapeResponse)}`);
                }
              }
            } else {
              error = mapResponse.error || 'Failed to map website URLs';
            }
            
          } catch (error) {
            console.error(`Error processing website ${website.name}:`, error);
            error = (error as Error).message;
          }
          
          results.push({
            source: website.name,
            processed,
            total,
            error
          });
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Firecrawl scraping completed',
            results
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      case 'status': {
        const websites = await loadWebsites();
        return new Response(
          JSON.stringify({
            success: true,
            totalWebsites: websites.length,
            activeWebsites: websites.filter((w: Website) => w.scraping_enabled).length,
            message: 'Firecrawl scraping service is running'
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
