-- Create trigger function to automatically generate embeddings for new articles
CREATE OR REPLACE FUNCTION trigger_generate_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the generate-embeddings Edge Function for this specific article
  -- Use local development URL for testing
  PERFORM net.http_post(
    url := 'http://127.0.0.1:54321/functions/v1/generate-embeddings?action=generate_single',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
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
