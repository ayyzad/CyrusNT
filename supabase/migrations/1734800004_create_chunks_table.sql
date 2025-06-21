-- Create chunks table for storing article chunks with embeddings
CREATE TABLE IF NOT EXISTS article_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL, -- Order of chunk within article (0, 1, 2, ...)
  chunk_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  embedding vector(1536),
  embedding_generated boolean DEFAULT false,
  embedding_generated_at timestamp with time zone,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast chunk retrieval and vector search
CREATE INDEX IF NOT EXISTS idx_chunks_article_id ON article_chunks(article_id);
CREATE INDEX IF NOT EXISTS idx_chunks_article_index ON article_chunks(article_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON article_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_generated ON article_chunks(embedding_generated);

-- Ensure unique chunk per article
CREATE UNIQUE INDEX IF NOT EXISTS idx_chunks_unique_article_chunk 
ON article_chunks(article_id, chunk_index);
