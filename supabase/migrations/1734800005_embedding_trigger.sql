-- Create trigger function to automatically generate embeddings for new articles
CREATE OR REPLACE FUNCTION trigger_generate_embedding()
RETURNS TRIGGER AS $$
DECLARE
  project_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get project URL and anon key from Supabase Vault for environment-agnostic configuration
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name = 'anon_key';

  -- If secrets are not found, log a warning and exit gracefully.
  -- This prevents the trigger from failing if the Vault is not set up.
  IF project_url IS NULL OR anon_key IS NULL THEN
    RAISE LOG 'trigger_generate_embedding: Could not find project_url or anon_key in Vault. Skipping trigger.';
    RETURN NEW;
  END IF;

  -- Call the generate-embeddings Edge Function using the retrieved credentials
  PERFORM net.http_post(
    url := project_url || '/functions/v1/generate-embeddings?action=generate_single',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'apikey', anon_key
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
