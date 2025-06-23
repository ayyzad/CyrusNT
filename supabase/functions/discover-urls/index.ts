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

// Load all active and enabled websites from the database
async function loadWebsites(supabaseUrl: string, supabaseKey: string): Promise<Website[]> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/websites?is_active=eq.true&scraping_enabled=eq.true&select=id,url,name,category`,
    {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Error loading websites:', error)
    throw new Error(`Failed to load websites: ${error}`)
  }

  const data = await response.json()
  return data || []
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
  const response: FirecrawlMapResponse = await fetch(`https://api.firecrawl.dev/v1/map`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, crawlerOptions: { includeSubdomains: false, maxDepth: 1, limit: 2000 } }), // Limit crawl depth and total pages
  }).then(res => res.json())

  if (!response.success || !response.links) {
    console.error(`[Firecrawl Map Error] Failed for ${url}:`, response.error || 'No links returned')
    return []
  }
  return response.links
}

// Filter out URLs that already exist in the articles table or the scraping queue
async function filterForNewUrls(supabaseUrl: string, supabaseKey: string, urls: string[]): Promise<string[]> {
  if (urls.length === 0) return []

  // Fetch existing links from both tables in parallel
  const [articlesRes, queueRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/articles?select=link&link=in.(${urls.join(',')})`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/scraping_queue?select=url_to_scrape&url_to_scrape=in.(${urls.join(',')})`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    )
  ])

  const articlesData = await articlesRes.json()
  const queueData = await queueRes.json()

  if (!articlesRes.ok) console.error('Error fetching existing articles:', articlesData.error)
  if (!queueRes.ok) console.error('Error fetching existing queue items:', queueData.error)

  const existingLinks = new Set([
    ...(articlesData.map((a: any) => a.link) || []),
    ...(queueData.map((q: any) => q.url_to_scrape) || [])
  ])

  const newUrls = urls.filter(url => !existingLinks.has(url))
  console.log(`[Filter] Discovered ${urls.length} URLs, filtered down to ${newUrls.length} new URLs.`)
  return newUrls
}

// --- Main Function Handler ---

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // This function is designed to be "fire-and-forget" from the cron job.
  // The actual processing happens in the background.
  (async () => {
    try {
      console.log('[Info] Starting website mapping process...')

      // Initialize clients
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!
      if (!firecrawlApiKey) throw new Error('Missing Firecrawl API key')

      const websites = await loadWebsites(supabaseUrl, supabaseKey)
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Fatal Error] The mapping process failed:', errorMessage)
    }
  })();

  // Return an immediate response to the cron job
  return new Response(JSON.stringify({ message: "Website mapping process initiated." }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 202, // Accepted
  });
});
