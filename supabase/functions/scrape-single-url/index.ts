// Supabase Edge Function: scrape-single-url
// This function is triggered by database webhooks when new items are added to the scraping queue.
// It processes a single URL from the queue and scrapes it using Firecrawl.

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
interface QueueJob {
  id: string;
  url: string;
  website_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  retry_count: number;
  error_message?: string;
}

interface Website {
  id: number;
  url: string;
  name: string;
  category: string;
}

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

// Main function handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // We need to get the queue item record from the request body for error handling later
  const requestBody = await req.json()
  const queueJob: QueueJob = requestBody.record

  try {
    console.log(`[Info] Received job ${queueJob.id}: Scraping ${queueJob.url}`)

    // Initialize Supabase connection details
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 1. Mark the job as 'processing'
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/scraping_queue?id=eq.${queueJob.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'processing',
        last_processed_at: new Date().toISOString(),
        retry_count: (queueJob.retry_count || 0) + 1,
      })
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      console.error('Failed to update queue status:', error)
    }

    // 2. Scrape the URL using Firecrawl
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      throw new Error('Missing Firecrawl API key')
    }

    const scrapeResponse: FirecrawlResponse = await fetch(`https://api.firecrawl.dev/v1/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url: queueJob.url,
        pageOptions: { onlyMainContent: true },
      }),
    }).then(res => res.json())

    if (!scrapeResponse.success || !scrapeResponse.data) {
      throw new Error(scrapeResponse.error || `Scraping failed for ${queueJob.url}`)
    }

    // 3. Process and insert the article
    const { data } = scrapeResponse
    const metadata = data.metadata || {}
    const content = data.markdown || ''

    const title = metadata.title || metadata.ogTitle || 'Untitled'
    const description = metadata.description || metadata.ogDescription || ''
    const author = metadata.author || ''

    let pubDate = new Date().toISOString()
    const possibleDateFields = [
      metadata.publishedTime,
      metadata['article:published_time'],
      metadata.modifiedTime,
      metadata['article:modified_time'],
    ]

    for (const dateField of possibleDateFields) {
      if (dateField) {
        try {
          pubDate = new Date(dateField).toISOString()
          break
        } catch (e) { /* ignore invalid dates */ }
      }
    }
    
    const websiteResponse = await fetch(`${supabaseUrl}/rest/v1/websites?id=eq.${queueJob.website_id}&select=name,category`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
    })

    if (!websiteResponse.ok) {
      const error = await websiteResponse.text()
      console.error('Failed to fetch website data:', error)
      throw new Error('Failed to fetch website data')
    }

    const websiteData = await websiteResponse.json()

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/articles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title, description, content,
        link: queueJob.url,
        source: websiteData[0].name,
        category: websiteData[0].category,
        author, pub_date: pubDate,
        guid: queueJob.url,
        website_id: queueJob.website_id,
      })
    })

    if (!insertResponse.ok) {
      const error = await insertResponse.text()
      console.error('Failed to insert article:', error)
      throw new Error('Failed to insert article')
    }

    // 4. Mark the job as 'completed'
    const completeResponse = await fetch(`${supabaseUrl}/rest/v1/scraping_queue?id=eq.${queueJob.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        error_message: null,
      })
    })

    if (!completeResponse.ok) {
      const error = await completeResponse.text()
      console.error('Failed to update queue status:', error)
    }

    console.log(`[Success] Job ${queueJob.id} completed successfully.`)
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Error] Job ${queueJob?.id} failed:`, errorMessage)

    if (queueJob) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      const newAttemptCount = (queueJob.retry_count || 0) // No +1 here, it was already incremented
      const newStatus = newAttemptCount >= 3 ? 'failed' : 'pending' // Retry up to 3 times

      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/scraping_queue?id=eq.${queueJob.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          status: newStatus,
          error_message: errorMessage,
        })
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.text()
        console.error('Failed to update queue status:', error)
      }
    }

    return new Response(JSON.stringify({ success: false, error: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
