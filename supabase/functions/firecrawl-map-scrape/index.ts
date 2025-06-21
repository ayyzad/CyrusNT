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
    json?: {
      title?: string;
      author?: string;
      publishedDate?: string;
      summary?: string;
      content?: string;
      tags?: string[];
    };
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
      publishedTime?: string;
      'article:published_time'?: string;
      modifiedTime?: string;
      'article:modified_time'?: string;
    };
    links?: string[];
  };
  error?: string;
}

// URL filtering function based on website category and keywords
function shouldProcessUrl(url: string, websiteCategory: string): boolean {
  // Iran-Specific websites: Accept all articles (no filtering)
  if (websiteCategory === 'Iran-Specific') {
    return true;
  }
  
  // International websites: Apply Iran-related filtering
  if (websiteCategory === 'International') {
    const iranKeywords = [
      // Core Iran terms
      'iran', 'iranian', 'tehran', 'persian', 'persia',
      // Leaders and officials
      'khamenei', 'raisi', 'rouhani', 'zarif', 'ayatollah',
      // Military and security
      'irgc', 'revolutionary-guard', 'quds', 'basij', 'sepah',
      // Nuclear program
      'nuclear', 'uranium', 'enrichment', 'centrifuge', 'natanz', 'fordow',
      // Sanctions and diplomacy
      'sanctions', 'jcpoa', 'nuclear-deal', 'nuclear-talks',
      // Regional conflicts involving Iran
      'israel-iran', 'iran-israel', 'iran-war', 'iran-conflict',
      'houthis', 'hezbollah', 'proxy', 'axis-resistance',
      // Iranian cities and regions
      'isfahan', 'mashhad', 'shiraz', 'tabriz', 'qom', 'karaj',
      // Iranian organizations
      'mois', 'ministry-intelligence', 'iriaf', 'irin'
    ];
    
    const urlLower = url.toLowerCase();
    const hasIranKeyword = iranKeywords.some(keyword => urlLower.includes(keyword));
    
    if (hasIranKeyword) {
      console.log(`[Info] URL passed Iran filter: ${url}`);
      return true;
    } else {
      console.log(`[Info] URL filtered out (no Iran keywords): ${url}`);
      return false;
    }
  }
  
  // Default: Accept all URLs for unknown categories
  console.log(`[Info] Unknown category '${websiteCategory}', accepting URL: ${url}`);
  return true;
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
              
              // Apply URL filtering based on website category and keywords
              const filteredUrls = newUrls.filter((url: string) => shouldProcessUrl(url, website.category));
              
              console.log(`[Info] Filtered ${newUrls.length} URLs to ${filteredUrls.length} URLs based on category and keywords`);
              
              // Limit to first 5 URLs to avoid timeouts and rate limits
              const limitedLinks = filteredUrls.slice(0, 5);
              
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
                    formats: ['markdown', 'json'],
                    jsonOptions: {
                      schema: {
                        type: 'object',
                        properties: {
                          title: { type: 'string', description: 'Article title' },
                          author: { type: 'string', description: 'Article author or byline' },
                          publishedDate: { type: 'string', description: 'Article publication date in ISO format' },
                          summary: { type: 'string', description: 'Article summary or description' },
                          content: { type: 'string', description: 'Main article content' },
                          tags: { type: 'array', items: { type: 'string' }, description: 'An array of relevant keywords or tags for the article' }
                        }
                      }
                    }
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
                  const jsonData = scrapeResponse.data.json || {};
                  
                  // Use extracted structured data first, fallback to metadata
                  const title = jsonData.title || metadata.title || metadata.ogTitle || 'Untitled';
                  const description = jsonData.summary || metadata.description || metadata.ogDescription || '';
                  const author = jsonData.author || metadata.author || '';
                  
                  // Extract publication date from metadata fields (where it actually exists)
                  let pubDate = new Date().toISOString(); // Default fallback
                  const possibleDateFields = [
                    metadata.publishedTime,
                    metadata['article:published_time'], 
                    metadata.modifiedTime,
                    metadata['article:modified_time'],
                    jsonData.publishedDate
                  ];
                  
                  for (const dateField of possibleDateFields) {
                    if (dateField) {
                      try {
                        pubDate = new Date(dateField).toISOString();
                        console.log(`[Info] Using publication date: ${dateField} for ${link}`);
                        break; // Use the first valid date found
                      } catch (error) {
                        console.log(`[Warning] Invalid date format for ${link}: ${dateField}`);
                      }
                    }
                  }
                  
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
                      pub_date: pubDate,
                      guid: link,
                      tags: jsonData.tags || [],
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
