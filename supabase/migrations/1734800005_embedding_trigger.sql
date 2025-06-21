-- Create trigger function to automatically generate embeddings for new articles
CREATE OR REPLACE FUNCTION trigger_generate_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the generate-embeddings Edge Function for this specific article
  -- Note: In production, this should use the production URL and proper authentication
  -- For local development, the service role key should be managed via environment variables
  PERFORM net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/generate-embeddings?action=generate_single',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
      -- TODO: Replace with secure authentication method
      -- In production, use Supabase's internal service authentication
    ),
    body := jsonb_build_object('article_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after new article insertion
CREATE OR REPLACE TRIGGER generate_embedding_on_insert
  AFTER INSERT ON articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_embedding();
