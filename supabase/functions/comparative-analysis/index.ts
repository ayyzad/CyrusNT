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
}

interface ArticleChunk {
  id: string;
  article_id: string;
  chunk_index: number;
  chunk_text: string;
  word_count: number;
  embedding: number[];
  articles: {
    id: string;
    title: string;
    link: string;
    source: string;
    author: string;
    pub_date: string;
    content: string;
  };
}

interface TopicCluster {
  topic_id: string;
  topic_summary: string;
  articles: ArticleChunk[];
  similarity_threshold: number;
  created_at: string;
}

interface SourcePerspective {
  source_name: string;
  source_category: string;
  source_country: string;
  article_count: number;
  perspective_summary: string;
  key_themes: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface ComparativeAnalysis {
  topic_cluster: TopicCluster;
  aggregate_summary: string;
  source_perspectives: SourcePerspective[];
  analysis_timestamp: string;
  total_articles: number;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }
    
    if (!supabaseKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
    
    if (!openaiApiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'analyze';
    const hoursBack = parseInt(url.searchParams.get('hours_back') || '12');
    const similarityThreshold = parseFloat(url.searchParams.get('similarity_threshold') || '0.5');

    switch (action) {
      case 'analyze': {
        console.log(`[Info] Starting comparative analysis for articles from last ${hoursBack} hours`);
        
        // Step 1: Get recent articles with embeddings using SQL function (RPC)
        const chunksResponse = await fetch(
          `${supabaseUrl}/rest/v1/rpc/get_recent_chunks_with_embeddings`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hours_back: hoursBack })
          }
        );

        if (!chunksResponse.ok) {
          throw new Error(`Failed to fetch article chunks: ${chunksResponse.status} ${chunksResponse.statusText}`);
        }

        const rawChunks = await chunksResponse.json();

        // Transform the flattened RPC response to match our ArticleChunk interface
        const chunks: ArticleChunk[] = rawChunks.map((row: any) => ({
          id: row.id,
          article_id: row.article_id,
          chunk_index: row.chunk_index,
          chunk_text: row.chunk_text,
          word_count: row.word_count,
          embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
          articles: {
            id: row.article_id,
            title: row.article_title,
            link: row.article_link,
            source: row.article_source,
            author: row.article_author,
            pub_date: row.article_pub_date,
            content: row.article_content
          }
        }));

        if (!chunks || chunks.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'No recent articles found for analysis',
            analyses: [],
            total_clusters: 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`[Info] Found ${chunks.length} chunks from ${new Set(chunks.map(c => c.article_id)).size} articles`);

        // Step 2: Find similar article clusters using vector similarity
        const clusters = await findSimilarClusters(chunks, similarityThreshold);
        console.log(`[Info] Identified ${clusters.length} topic clusters`);

        // Step 2.5: Filter out clusters that already have analyses
        const filteredClusters = [];
        for (const cluster of clusters) {
          if (cluster.articles.length < 2) continue; // Skip single-article clusters
          
          // Get unique article IDs for this cluster
          const articleIds = Array.from(new Set(cluster.articles.map(c => c.article_id))).sort();
          
          // Check if an analysis already exists for this exact set of articles
          const existingAnalysisResponse = await fetch(
            `${supabaseUrl}/rest/v1/comparative_analyses?select=id,article_ids&article_ids=cs.{${articleIds.map(id => `"${id}"`).join(',')}}`,
            {
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (existingAnalysisResponse.ok) {
            const existingAnalyses = await existingAnalysisResponse.json();
            
            // Check if any existing analysis has the exact same article set
            const hasExactMatch = existingAnalyses.some((analysis: any) => {
              const existingIds = analysis.article_ids.sort();
              return existingIds.length === articleIds.length && 
                     existingIds.every((id: string, index: number) => id === articleIds[index]);
            });
            
            if (hasExactMatch) {
              console.log(`[Info] Skipping cluster with ${articleIds.length} articles - analysis already exists`);
              continue;
            }
          }
          
          filteredClusters.push(cluster);
        }
        
        console.log(`[Info] Processing ${filteredClusters.length} new clusters (${clusters.length - filteredClusters.length} skipped as duplicates)`);

        // Step 3: Generate comparative analysis for each cluster
        const analyses: ComparativeAnalysis[] = [];
        
        for (const cluster of filteredClusters) {
          console.log(`[Info] Analyzing cluster with ${cluster.articles.length} articles`);
          
          const analysis = await generateComparativeAnalysis(cluster, openaiApiKey);
          analyses.push(analysis);

          // Save analysis to database
          try {
            const saveResponse = await fetch(
              `${supabaseUrl}/rest/v1/comparative_analyses`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'apikey': supabaseKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  topic_id: analysis.topic_cluster.topic_id,
                  topic_summary: analysis.topic_cluster.topic_summary,
                  aggregate_summary: analysis.aggregate_summary,
                  source_perspectives: analysis.source_perspectives,
                  similarity_threshold: analysis.topic_cluster.similarity_threshold,
                  total_articles: analysis.total_articles,
                  article_ids: Array.from(new Set(analysis.topic_cluster.articles.map(c => c.article_id))),
                  analysis_timestamp: analysis.analysis_timestamp
                })
              }
            );

            if (saveResponse.ok) {
              console.log(`[Info] Saved analysis for topic: ${analysis.topic_cluster.topic_id}`);
            } else {
              console.error(`[Warning] Failed to save analysis: ${saveResponse.status} ${saveResponse.statusText}`);
            }
          } catch (saveError) {
            console.error(`[Warning] Error saving analysis:`, saveError);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Generated ${analyses.length} comparative analyses`,
          analyses: analyses,
          total_clusters: clusters.length,
          total_articles: new Set(chunks.map(c => c.article_id)).size
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_saved': {
        // Get saved comparative analyses from database
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const hoursBack = parseInt(url.searchParams.get('hours_back') || '168'); // Default 7 days
        
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
        
        const savedResponse = await fetch(
          `${supabaseUrl}/rest/v1/comparative_analyses?analysis_timestamp=gte.${cutoffTime}&order=analysis_timestamp.desc&limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!savedResponse.ok) {
          throw new Error(`Failed to fetch saved analyses: ${savedResponse.status} ${savedResponse.statusText}`);
        }

        const savedAnalyses = await savedResponse.json();

        return new Response(JSON.stringify({
          success: true,
          message: `Retrieved ${savedAnalyses.length} saved analyses`,
          analyses: savedAnalyses,
          pagination: {
            limit,
            offset,
            has_more: savedAnalyses.length === limit
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'test_similarity': {
        // Test endpoint to check similarity between specific articles
        const body = await req.json();
        const { article_id_1, article_id_2 } = body;

        const chunksResponse = await fetch(
          `${supabaseUrl}/rest/v1/article_chunks?article_id=in.(${article_id_1},${article_id_2})&embedding_generated=eq.true&select=embedding,article_id,chunk_text`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!chunksResponse.ok) {
          throw new Error(`Failed to fetch chunks: ${chunksResponse.status} ${chunksResponse.statusText}`);
        }

        const chunks = await chunksResponse.json();
        const article1Chunks = chunks.filter((c: any) => c.article_id === article_id_1);
        const article2Chunks = chunks.filter((c: any) => c.article_id === article_id_2);

        if (article1Chunks.length === 0 || article2Chunks.length === 0) {
          throw new Error('One or both articles have no embeddings');
        }

        // Calculate average similarity between all chunk pairs
        let totalSimilarity = 0;
        let comparisons = 0;

        for (const chunk1 of article1Chunks) {
          for (const chunk2 of article2Chunks) {
            const similarity = cosineSimilarity(chunk1.embedding, chunk2.embedding);
            totalSimilarity += similarity;
            comparisons++;
          }
        }

        const averageSimilarity = totalSimilarity / comparisons;

        return new Response(JSON.stringify({
          success: true,
          article_1: article_id_1,
          article_2: article_id_2,
          average_similarity: averageSimilarity,
          total_comparisons: comparisons,
          chunks_1: article1Chunks.length,
          chunks_2: article2Chunks.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[Error]', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Helper function to find clusters of similar articles
async function findSimilarClusters(chunks: ArticleChunk[], threshold: number): Promise<TopicCluster[]> {
  const clusters: TopicCluster[] = [];
  const processedArticles = new Set<string>();

  // Group chunks by article
  const articleChunks = new Map<string, ArticleChunk[]>();
  for (const chunk of chunks) {
    if (!articleChunks.has(chunk.article_id)) {
      articleChunks.set(chunk.article_id, []);
    }
    articleChunks.get(chunk.article_id)!.push(chunk);
  }

  const articles = Array.from(articleChunks.keys());

  for (let i = 0; i < articles.length; i++) {
    const articleId = articles[i];
    
    if (processedArticles.has(articleId)) continue;

    const similarArticles: ArticleChunk[] = [];
    const baseChunks = articleChunks.get(articleId)!;
    
    // Add base article chunks
    similarArticles.push(...baseChunks);
    processedArticles.add(articleId);

    // Find similar articles
    for (let j = i + 1; j < articles.length; j++) {
      const compareArticleId = articles[j];
      
      if (processedArticles.has(compareArticleId)) continue;

      const compareChunks = articleChunks.get(compareArticleId)!;
      
      // Calculate maximum similarity between any chunks of the two articles
      let maxSimilarity = 0;
      for (const baseChunk of baseChunks) {
        for (const compareChunk of compareChunks) {
          const similarity = cosineSimilarity(baseChunk.embedding, compareChunk.embedding);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }

      if (maxSimilarity >= threshold) {
        similarArticles.push(...compareChunks);
        processedArticles.add(compareArticleId);
      }
    }

    // Only create cluster if we have multiple articles
    if (new Set(similarArticles.map(c => c.article_id)).size > 1) {
      const cluster: TopicCluster = {
        topic_id: `cluster_${Date.now()}_${i}`,
        topic_summary: '', // Will be generated later
        articles: similarArticles,
        similarity_threshold: threshold,
        created_at: new Date().toISOString()
      };
      
      clusters.push(cluster);
    }
  }

  return clusters;
}

// Helper function to generate comparative analysis using OpenAI
async function generateComparativeAnalysis(cluster: TopicCluster, openaiApiKey: string): Promise<ComparativeAnalysis> {
  // Group articles by source
  const sourceGroups = new Map<string, ArticleChunk[]>();
  
  for (const chunk of cluster.articles) {
    const sourceKey = `${chunk.articles.source}`;
    if (!sourceGroups.has(sourceKey)) {
      sourceGroups.set(sourceKey, []);
    }
    sourceGroups.get(sourceKey)!.push(chunk);
  }

  // Prepare content for OpenAI analysis
  const articlesContent = Array.from(new Set(cluster.articles.map(c => c.article_id)))
    .map(articleId => {
      const articleChunks = cluster.articles.filter(c => c.article_id === articleId);
      const article = articleChunks[0].articles;
      const fullContent = articleChunks.map(c => c.chunk_text).join(' ');
      
      return {
        title: article.title,
        source: article.source,
        content: fullContent.substring(0, 2000) // Limit content length
      };
    });

  const prompt = `
You are a geopolitical news analyst. Analyze the following articles about the same topic from different news sources and provide a comparative analysis.

Articles:
${articlesContent.map((article, i) => `
${i + 1}. **${article.title}**
   Source: ${article.source}
   Content: ${article.content}
`).join('\n')}

Please provide your analysis in the following JSON format:
{
  "topic_title": "A concise 3-6 word topic title/tag",
  "aggregate_summary": "A comprehensive 2-3 sentence summary of the overall topic/event",
  "source_perspectives": [
    {
      "source_name": "Source name",
      "source_category": "Category (e.g., 'Iran-Specific', 'General')",
      "source_country": "Country",
      "perspective_summary": "How this source presents the topic (2-3 sentences)",
      "key_themes": ["theme1", "theme2", "theme3"],
      "sentiment": "positive/negative/neutral"
    }
  ]
}

Focus on identifying different perspectives, biases, emphasis, and framing between sources, especially between Iranian state media vs Western/international sources.
`;

  try {
    console.log(`[Debug] OpenAI API Key present: ${openaiApiKey ? 'Yes' : 'No'}`);
    console.log(`[Debug] OpenAI API Key length: ${openaiApiKey?.length || 0}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a geopolitical news analyst specializing in comparative media analysis. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    console.log(`[Debug] OpenAI Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Error] OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let analysisText = data.choices[0].message.content;
    
    console.log(`[Debug] OpenAI Response: ${analysisText.substring(0, 200)}...`);
    
    // Strip markdown code blocks if present
    if (analysisText.startsWith('```json')) {
      analysisText = analysisText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (analysisText.startsWith('```')) {
      analysisText = analysisText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse the JSON response
    const analysisData = JSON.parse(analysisText);

    const analysis: ComparativeAnalysis = {
      topic_cluster: {
        ...cluster,
        topic_summary: analysisData.topic_title
      },
      aggregate_summary: analysisData.aggregate_summary,
      source_perspectives: analysisData.source_perspectives,
      analysis_timestamp: new Date().toISOString(),
      total_articles: new Set(cluster.articles.map(c => c.article_id)).size
    };

    return analysis;

  } catch (error) {
    console.error('[Error] Failed to generate OpenAI analysis:', error);
    
    // Fallback analysis if OpenAI fails
    const fallbackAnalysis: ComparativeAnalysis = {
      topic_cluster: {
        ...cluster,
        topic_summary: `Topic cluster with ${new Set(cluster.articles.map(c => c.article_id)).size} articles`
      },
      aggregate_summary: `Analysis of ${new Set(cluster.articles.map(c => c.article_id)).size} related articles from multiple sources`,
      source_perspectives: Array.from(sourceGroups.entries()).map(([sourceName, chunks]) => ({
        source_name: sourceName,
        source_category: '',
        source_country: '',
        article_count: new Set(chunks.map(c => c.article_id)).size,
        perspective_summary: `${new Set(chunks.map(c => c.article_id)).size} articles from this source`,
        key_themes: ['Analysis failed'],
        sentiment: 'neutral' as const
      })),
      analysis_timestamp: new Date().toISOString(),
      total_articles: new Set(cluster.articles.map(c => c.article_id)).size
    };

    return fallbackAnalysis;
  }
}

Deno.serve(handler);
