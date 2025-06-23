// Supabase Edge Function: discover-urls
// This function is triggered by a cron job.
// Its purpose is to map websites, find new article URLs, and add them to a scraping queue.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Deno runtime type declarations for Supabase Edge Functions
declare global {
  namespace Deno {
    function serve(
      handler: (request: Request) => Response | Promise<Response>,
      options?: { port?: number; hostname?: string }
    ): void;

    namespace env {
      function get(key: string): string | undefined;
    }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Interfaces ---
interface Website {
  id: number;
  url: string;
  name: string;
  category: string;
}

interface FirecrawlMapResponse {
  success: boolean;
  links?: string[];
  error?: string;
}

// --- Helper Functions ---

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

// Filter URLs to only include those relevant to Iran for non-specific sources
function shouldProcessUrl(url: string, websiteCategory: string): boolean {
  if (websiteCategory === 'Iran-Specific') {
    return true
  }
  const iranKeywords = [
    'iran', 'iranian', 'tehran', 'persian', 'khamenei', 'raisi', 'irgc', 'jcpoa', 'nuclear', 'sanctions', 'israel-iran', 'hezbollah', 'houthis'
    // A minimal list for URL filtering; more comprehensive filtering happens at the content level.
  ]
  const urlLower = url.toLowerCase()
  return iranKeywords.some(keyword => urlLower.includes(keyword))
}

// Use Firecrawl's /map endpoint to discover all links on a site
async function getLinksFromFirecrawlMap(url: string, apiKey: string): Promise<string[]> {
  try {
    console.log(`[Debug] Calling Firecrawl map for: ${url}`)
    
    const response = await fetch(`https://api.firecrawl.dev/v1/map`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ 
        url, 
        includeSubdomains: true,
        limit: 100,
        ignoreSitemap: true
      }),
    })

    console.log(`[Debug] Firecrawl response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Firecrawl Map Error] HTTP ${response.status} for ${url}: ${errorText}`)
      return []
    }

    const jsonResponse: FirecrawlMapResponse = await response.json()
    
    if (!jsonResponse.success || !jsonResponse.links) {
      console.error(`[Firecrawl Map Error] Failed for ${url}:`, jsonResponse.error || 'No links returned')
      return []
    }
    
    console.log(`[Debug] Found ${jsonResponse.links.length} links for ${url}`)
    return jsonResponse.links
  } catch (error) {
    console.error(`[Firecrawl Map Error] Exception for ${url}:`, error)
    return []
  }
}

// Filter out URLs that already exist in the articles table or the scraping queue
async function filterForNewUrls(supabaseUrl: string, supabaseKey: string, urls: string[]): Promise<string[]> {
  if (urls.length === 0) return []

  // Batch URLs to avoid URI too long errors
  const batchSize = 50
  const allExistingUrls = new Set<string>()

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    
    // Escape and quote URLs for PostgreSQL IN clause
    const quotedUrls = batch.map(url => `"${url.replace(/"/g, '""')}"`).join(',')

    try {
      // Fetch existing links from both tables in parallel
      const [articlesRes, queueRes] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/articles?select=link&link=in.(${quotedUrls})`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          }
        ),
        fetch(
          `${supabaseUrl}/rest/v1/scraping_queue?select=url_to_scrape&url_to_scrape=in.(${quotedUrls})`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          }
        )
      ])

      if (!articlesRes.ok || !queueRes.ok) {
        console.error(`[DB Error] Failed to check existing URLs for batch ${i}-${i + batchSize}`)
        continue
      }

      const [articlesData, queueData] = await Promise.all([
        articlesRes.json(),
        queueRes.json()
      ])

      // Add existing URLs to the set
      articlesData.forEach((article: any) => allExistingUrls.add(article.link))
      queueData.forEach((item: any) => allExistingUrls.add(item.url_to_scrape))
      
    } catch (error) {
      console.error(`[DB Error] Exception checking batch ${i}-${i + batchSize}:`, error)
    }
  }

  // Return only URLs that don't exist in either table
  return urls.filter(url => !allExistingUrls.has(url))
}

// --- Main Function Handler ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[Info] Starting website mapping process...')

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')

    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL environment variable')
    if (!supabaseKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    if (!firecrawlApiKey) throw new Error('Missing FIRECRAWL_API_KEY environment variable')

    const websites = await loadWebsites()
    console.log(`[Info] Found ${websites.length} active websites to process.`)

    for (const website of websites) {
      console.log(`\n--- Processing Website: ${website.name} ---`)
      
      // 1. Map the site to get all links
      const discoveredLinks = await getLinksFromFirecrawlMap(website.url, firecrawlApiKey)
      
      // 2. Filter out the base domain URL itself and other non-article links
      const articleLinks = discoveredLinks.filter(link => {
          try {
              const url = new URL(link);
              // Basic filter: not the homepage, not a mailto link, not a social media link, etc.
              return url.pathname !== '/' && !['mailto:', 'tel:'].some(p => url.protocol.includes(p)) && !['twitter.com', 'facebook.com', 'linkedin.com'].some(d => url.hostname.includes(d));
          } catch (e) {
              return false; // Invalid URL
          }
      });
      
      // 3. Filter out URLs that already exist in our system
      const newUrls = await filterForNewUrls(supabaseUrl, supabaseKey, articleLinks)
      
      // 4. Apply keyword filtering for non-specific sources
      const relevantUrls = newUrls.filter(url => shouldProcessUrl(url, website.category))
      console.log(`[Filter] Found ${relevantUrls.length} relevant new URLs for '${website.name}'.`)

      // 5. Batch insert new URLs into the scraping queue
      if (relevantUrls.length > 0) {
        const queueItems = relevantUrls.map(url => ({
          website_id: website.id,
          url_to_scrape: url,
          status: 'pending',
        }))

        const response = await fetch(`${supabaseUrl}/rest/v1/scraping_queue`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(queueItems)
        })

        if (!response.ok) {
          const error = await response.text()
          console.error(`[DB Error] Failed to insert into queue for ${website.name}:`, error)
        } else {
          console.log(`[Success] Added ${queueItems.length} new URLs to the scraping queue for ${website.name}.`)
        }
      }
    }

    console.log('\n[Info] Website mapping process completed.')
    
    return new Response(
      JSON.stringify({ 
        message: "Website mapping process completed successfully",
        websites_processed: websites.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[Error] Function failed:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
