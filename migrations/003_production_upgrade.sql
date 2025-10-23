-- Production upgrade migration for Audnix AI v4.0
-- Adds OAuth tokens, payment tracking, queue system, and semantic memory

-- Update users table with new fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';
ALTER TABLE users ADD COLUMN IF NOT EXISTS leads_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS voice_minutes_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_token_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'inactive';

-- Create oauth_tokens table for managing OAuth tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create follow_up_queue table for AI worker
CREATE TABLE IF NOT EXISTS follow_up_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  channel TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  context JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table for tracking subscriptions
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  plan TEXT NOT NULL,
  payment_link TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create semantic_memory table for RAG
CREATE TABLE IF NOT EXISTS semantic_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brand_embeddings table for brand knowledge
CREATE TABLE IF NOT EXISTS brand_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  source_file TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update leads table with additional fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversion_value INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_status ON follow_up_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_user ON follow_up_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_semantic_memory_user ON semantic_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_embeddings_user ON brand_embeddings(user_id);

-- Enable RLS on new tables
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS policies for oauth_tokens
CREATE POLICY "Users can view own OAuth tokens" ON oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own OAuth tokens" ON oauth_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for follow_up_queue
CREATE POLICY "Users can view own queue items" ON follow_up_queue
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for semantic_memory
CREATE POLICY "Users can manage own memories" ON semantic_memory
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for brand_embeddings
CREATE POLICY "Users can manage own embeddings" ON brand_embeddings
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update user plan after payment
CREATE OR REPLACE FUNCTION update_user_plan_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'succeeded' THEN
    UPDATE users 
    SET 
      plan = NEW.plan,
      payment_status = 'active'
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment updates
DROP TRIGGER IF EXISTS trigger_update_user_plan ON payments;
CREATE TRIGGER trigger_update_user_plan
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_plan_after_payment();

-- Function to calculate leads limit based on plan
CREATE OR REPLACE FUNCTION get_leads_limit(user_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE user_plan
    WHEN 'starter' THEN RETURN 100;
    WHEN 'growth' THEN RETURN 500;
    WHEN 'pro' THEN RETURN 2000;
    WHEN 'trial' THEN RETURN 100;
    ELSE RETURN 100;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate voice minutes limit based on plan
CREATE OR REPLACE FUNCTION get_voice_minutes_limit(user_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE user_plan
    WHEN 'starter' THEN RETURN 10;
    WHEN 'growth' THEN RETURN 30;
    WHEN 'pro' THEN RETURN 150;
    WHEN 'trial' THEN RETURN 10;
    ELSE RETURN 10;
  END CASE;
END;
$$ LANGUAGE plpgsql;