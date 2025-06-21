-- Add embedding column to articles table for vector similarity search
ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast vector similarity search
CREATE INDEX IF NOT EXISTS articles_embedding_idx ON articles 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add embedding status tracking
ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding_generated boolean DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding_generated_at timestamp with time zone;
