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

interface Article {
  id: number;
  title: string;
  content: string;
  description: string;
  link: string;
  source: string;
  word_count: number;
}

interface ArticleChunk {
  chunk_index: number;
  chunk_text: string;
  word_count: number;
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
  usage: {
    total_tokens: number;
  };
}

// Intelligent chunking function with sentence boundary awareness
function createChunks(content: string, chunkSize: number = 150, overlapPercent: number = 0.2): ArticleChunk[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const words = content.split(/\s+/);
  const totalWords = words.length;
  
  // If content is short enough, return as single chunk
  if (totalWords <= chunkSize) {
    return [{
      chunk_index: 0,
      chunk_text: content.trim(),
      word_count: totalWords
    }];
  }

  const chunks: ArticleChunk[] = [];
  const overlapWords = Math.floor(chunkSize * overlapPercent);
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < totalWords) {
    const endIndex = Math.min(startIndex + chunkSize, totalWords);
    let chunkWords = words.slice(startIndex, endIndex);
    let chunkText = chunkWords.join(' ');

    // Try to end at sentence boundary (look for period, !, ? followed by space or end)
    if (endIndex < totalWords) {
      const lastPart = chunkText.slice(-100); // Check last 100 chars for sentence ending
      const sentenceEndMatch = lastPart.match(/[.!?]\s+/g);
      
      if (sentenceEndMatch) {
        const lastSentenceEnd = lastPart.lastIndexOf(sentenceEndMatch[sentenceEndMatch.length - 1]);
        if (lastSentenceEnd > 50) { // Only adjust if we're not cutting too much
          const adjustedLength = chunkText.length - (lastPart.length - lastSentenceEnd - sentenceEndMatch[sentenceEndMatch.length - 1].length);
          chunkText = chunkText.substring(0, adjustedLength);
          chunkWords = chunkText.split(/\s+/);
        }
      }
    }

    chunks.push({
      chunk_index: chunkIndex,
      chunk_text: chunkText.trim(),
      word_count: chunkWords.length
    });

    chunkIndex++;
    
    // Move start index forward, accounting for overlap
    if (endIndex >= totalWords) break;
    startIndex = endIndex - overlapWords;
  }

  return chunks;
}

Deno.serve(async (req) => {
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
    const action = url.searchParams.get('action') || 'generate';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    switch (action) {
      case 'generate_single': {
        // Handle single article embedding generation (called by trigger)
        const body = await req.json();
        const articleId = body.article_id;
        
        if (!articleId) {
          throw new Error('Missing article_id in request body');
        }

        console.log(`Generating embedding for article ID: ${articleId}`);
        
        // Get the specific article
        const articleResponse = await fetch(
          `${supabaseUrl}/rest/v1/articles?id=eq.${articleId}&select=id,title,content,description,link,source,word_count`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
            }
          }
        );

        if (!articleResponse.ok) {
          throw new Error(`Failed to fetch article ${articleId}: ${articleResponse.statusText}`);
        }

        const articles: Article[] = await articleResponse.json();
        
        if (articles.length === 0) {
          throw new Error(`Article ${articleId} not found`);
        }

        const article = articles[0];
        
        try {
          // Combine source, title, description, and content for embedding
          // Including source helps distinguish content from different news outlets
          const fullText = [
            `Source: ${article.source}`,
            `Title: ${article.title}`,
            article.description ? `Description: ${article.description}` : '',
            article.content || ''
          ].filter(Boolean).join('\n\n');

          console.log(`Article ${articleId} has ${article.word_count} words, creating chunks...`);
          
          // Create intelligent chunks
          const chunks = createChunks(fullText);
          console.log(`Created ${chunks.length} chunks for article ${articleId}`);

          // Delete existing chunks for this article (in case of re-processing)
          await fetch(
            `${supabaseUrl}/rest/v1/article_chunks?article_id=eq.${articleId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
              }
            }
          );

          // Process each chunk
          for (const chunk of chunks) {
            try {
              // Generate embedding for this chunk
              const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openaiApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  input: chunk.chunk_text,
                  model: 'text-embedding-3-small',
                  dimensions: 1536
                }),
              });

              if (!embeddingResponse.ok) {
                const errorText = await embeddingResponse.text();
                console.error(`OpenAI API error for article ${articleId}, chunk ${chunk.chunk_index}: ${errorText}`);
                continue;
              }

              const embeddingData: OpenAIEmbeddingResponse = await embeddingResponse.json();
              const embedding = embeddingData.data[0].embedding;

              // Insert chunk with embedding
              const chunkInsertResponse = await fetch(
                `${supabaseUrl}/rest/v1/article_chunks`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    article_id: articleId,
                    chunk_index: chunk.chunk_index,
                    chunk_text: chunk.chunk_text,
                    word_count: chunk.word_count,
                    embedding: embedding,
                    embedding_generated: true,
                    embedding_generated_at: new Date().toISOString()
                  }),
                }
              );

              if (!chunkInsertResponse.ok) {
                console.error(`Failed to insert chunk ${chunk.chunk_index} for article ${articleId}: ${chunkInsertResponse.statusText}`);
                continue;
              }

              console.log(`✅ Generated embedding for article ${articleId}, chunk ${chunk.chunk_index} (${chunk.word_count} words)`);

              // Small delay to avoid rate limits
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              console.error(`Error processing chunk ${chunk.chunk_index} for article ${articleId}:`, error);
            }
          }

          // Mark article as having embeddings generated
          await fetch(
            `${supabaseUrl}/rest/v1/articles?id=eq.${articleId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                embedding_generated: true,
                embedding_generated_at: new Date().toISOString()
              }),
            }
          );

          console.log(`✅ Completed embedding generation for article ${articleId}: ${article.title.substring(0, 50)}...`);

          return new Response(
            JSON.stringify({
              success: true,
              message: `Embeddings generated for article ${articleId}`,
              article_id: articleId,
              chunks_created: chunks.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error(`Error generating embeddings for article ${articleId}:`, error);
          throw error;
        }
      }

      case 'generate': {
        console.log(`Starting embedding generation for up to ${limit} articles...`);
        
        // Get articles without embeddings
        const articlesResponse = await fetch(
          `${supabaseUrl}/rest/v1/articles?embedding_generated=eq.false&select=id,title,content,description,link,source,word_count&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
            }
          }
        );

        if (!articlesResponse.ok) {
          throw new Error(`Failed to fetch articles: ${articlesResponse.statusText}`);
        }

        const articles: Article[] = await articlesResponse.json();
        console.log(`Found ${articles.length} articles without embeddings`);

        if (articles.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'No articles need embedding generation',
              processed: 0 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let processed = 0;
        let errors = 0;
        let totalChunks = 0;

        for (const article of articles) {
          try {
            console.log(`Processing article ${article.id}: ${article.title.substring(0, 50)}... (${article.word_count} words)`);
            
            // Combine source, title, description, and content for embedding
            // Including source helps distinguish content from different news outlets
            const fullText = [
              `Source: ${article.source}`,
              `Title: ${article.title}`,
              article.description ? `Description: ${article.description}` : '',
              article.content || ''
            ].filter(Boolean).join('\n\n');

            // Create intelligent chunks
            const chunks = createChunks(fullText);
            console.log(`Created ${chunks.length} chunks for article ${article.id}`);

            // Delete existing chunks for this article (in case of re-processing)
            await fetch(
              `${supabaseUrl}/rest/v1/article_chunks?article_id=eq.${article.id}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'apikey': supabaseKey,
                }
              }
            );

            let articleChunksProcessed = 0;

            // Process each chunk
            for (const chunk of chunks) {
              try {
                // Generate embedding for this chunk
                const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    input: chunk.chunk_text,
                    model: 'text-embedding-3-small',
                    dimensions: 1536
                  }),
                });

                if (!embeddingResponse.ok) {
                  const errorText = await embeddingResponse.text();
                  console.error(`OpenAI API error for article ${article.id}, chunk ${chunk.chunk_index}: ${errorText}`);
                  continue;
                }

                const embeddingData: OpenAIEmbeddingResponse = await embeddingResponse.json();
                const embedding = embeddingData.data[0].embedding;

                // Insert chunk with embedding
                const chunkInsertResponse = await fetch(
                  `${supabaseUrl}/rest/v1/article_chunks`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${supabaseKey}`,
                      'apikey': supabaseKey,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      article_id: article.id,
                      chunk_index: chunk.chunk_index,
                      chunk_text: chunk.chunk_text,
                      word_count: chunk.word_count,
                      embedding: embedding,
                      embedding_generated: true,
                      embedding_generated_at: new Date().toISOString()
                    }),
                  }
                );

                if (!chunkInsertResponse.ok) {
                  console.error(`Failed to insert chunk ${chunk.chunk_index} for article ${article.id}: ${chunkInsertResponse.statusText}`);
                  continue;
                }

                articleChunksProcessed++;
                totalChunks++;

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));

              } catch (error) {
                console.error(`Error processing chunk ${chunk.chunk_index} for article ${article.id}:`, error);
              }
            }

            // Mark article as having embeddings generated if at least one chunk was processed
            if (articleChunksProcessed > 0) {
              await fetch(
                `${supabaseUrl}/rest/v1/articles?id=eq.${article.id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    embedding_generated: true,
                    embedding_generated_at: new Date().toISOString()
                  }),
                }
              );

              processed++;
              console.log(`✅ Generated ${articleChunksProcessed} chunk embeddings for article ${article.id} (${processed}/${articles.length})`);
            } else {
              errors++;
              console.error(`❌ Failed to process any chunks for article ${article.id}`);
            }

          } catch (error) {
            console.error(`Error processing article ${article.id}:`, error);
            errors++;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Embedding generation completed`,
            processed,
            errors,
            total: articles.length,
            total_chunks: totalChunks
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        // Get embedding generation status
        const statusResponse = await fetch(
          `${supabaseUrl}/rest/v1/articles?select=embedding_generated&embedding_generated=eq.true`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
            }
          }
        );

        const totalResponse = await fetch(
          `${supabaseUrl}/rest/v1/articles?select=id`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
            }
          }
        );

        const withEmbeddings = await statusResponse.json();
        const total = await totalResponse.json();

        return new Response(
          JSON.stringify({
            success: true,
            total_articles: total.length,
            articles_with_embeddings: withEmbeddings.length,
            articles_without_embeddings: total.length - withEmbeddings.length,
            completion_percentage: Math.round((withEmbeddings.length / total.length) * 100)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use ?action=generate or ?action=status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in generate-embeddings function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
