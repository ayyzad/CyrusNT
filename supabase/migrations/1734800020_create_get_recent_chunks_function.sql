-- Create a SQL function to get recent article chunks with embeddings
-- This avoids complex PostgREST query syntax issues

CREATE OR REPLACE FUNCTION get_recent_chunks_with_embeddings(
  hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  id UUID,
  article_id UUID,
  chunk_index INTEGER,
  chunk_text TEXT,
  word_count INTEGER,
  embedding VECTOR(1536),
  article_title TEXT,
  article_link TEXT,
  article_source TEXT,
  article_author TEXT,
  article_pub_date TIMESTAMPTZ,
  article_content TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    ac.id,
    ac.article_id,
    ac.chunk_index,
    ac.chunk_text,
    ac.word_count,
    ac.embedding,
    a.title as article_title,
    a.link as article_link,
    a.source as article_source,
    a.author as article_author,
    a.pub_date as article_pub_date,
    a.content as article_content
  FROM article_chunks ac
  INNER JOIN articles a ON ac.article_id = a.id
  WHERE 
    ac.embedding_generated = true
    AND a.pub_date >= (NOW() - (hours_back || ' hours')::INTERVAL)
  ORDER BY a.pub_date DESC;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_recent_chunks_with_embeddings(INTEGER) TO authenticated, service_role;
