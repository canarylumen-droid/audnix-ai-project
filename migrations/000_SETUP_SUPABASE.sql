-- ============================================================================
-- AUDNIX AI - COMPLETE SUPABASE SETUP
-- ============================================================================
-- Run this entire file in your Supabase SQL Editor
-- This creates all tables, indexes, policies, and functions needed
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  username TEXT,
  avatar TEXT,
  company TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
  trial_expires_at TIMESTAMPTZ,
  reply_tone TEXT DEFAULT 'professional' CHECK (reply_tone IN ('friendly', 'professional', 'short')),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ============================================================================
-- 2. LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('instagram', 'whatsapp', 'email')),
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'open', 'replied', 'converted', 'not_interested', 'cold')),
  score NUMERIC DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  warm BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('instagram', 'whatsapp', 'gmail')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INTEGRATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('instagram', 'whatsapp', 'gmail', 'outlook', 'manychat')),
  encrypted_meta TEXT NOT NULL,
  connected BOOLEAN DEFAULT false,
  account_type TEXT CHECK (account_type IN ('personal', 'creator', 'business')),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ============================================================================
-- 5. OAUTH TOKENS TABLE
-- ============================================================================
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

-- ============================================================================
-- 6. DEALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('instagram', 'whatsapp', 'email')),
  value NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('converted', 'lost', 'pending')),
  notes TEXT,
  converted_at TIMESTAMPTZ,
  meeting_scheduled BOOLEAN DEFAULT false,
  meeting_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. VOICE SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS voice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT false,
  voice_sample_url TEXT,
  voice_clone_id TEXT,
  consent_given BOOLEAN DEFAULT false,
  minutes_used NUMERIC DEFAULT 0,
  minutes_allowed NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. AUTOMATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('friendly', 'professional', 'short')),
  schedule JSONB DEFAULT '[]',
  triggers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. FOLLOW-UP QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS follow_up_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'sent', 'failed', 'cancelled')),
  channel TEXT NOT NULL CHECK (channel IN ('instagram', 'whatsapp', 'email')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  context JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. CALENDAR EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  external_id TEXT NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  is_ai_booked BOOLEAN DEFAULT false,
  pre_call_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('webhook_error', 'billing_issue', 'conversion', 'lead_reply', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. TEAM MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- ============================================================================
-- 13. WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. INSIGHTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period JSONB NOT NULL,
  summary TEXT NOT NULL,
  metrics JSONB NOT NULL,
  channel_breakdown JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 15. API KEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 16. PAYMENTS TABLE
-- ============================================================================
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

-- ============================================================================
-- 17. BRAND EMBEDDINGS TABLE (pgvector for RAG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  embedding vector(1536),
  snippet TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 18. SEMANTIC MEMORY TABLE (pgvector for RAG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID,
  source TEXT NOT NULL,
  embedding vector(1536),
  snippet TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel);
CREATE INDEX IF NOT EXISTS idx_leads_last_message_at ON leads(last_message_at);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_leads_external_id ON leads(external_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Integrations
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

-- OAuth Tokens
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON oauth_tokens(expires_at);

-- Deals
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- Follow-up Queue
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_status ON follow_up_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_user ON follow_up_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_scheduled ON follow_up_queue(scheduled_at, status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_id);

-- Embeddings
CREATE INDEX IF NOT EXISTS idx_brand_embeddings_user ON brand_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_semantic_memory_user ON semantic_memory(user_id);

-- Vector similarity search indexes (HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_brand_embeddings_vector ON brand_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  
CREATE INDEX IF NOT EXISTS idx_semantic_memory_vector ON semantic_memory 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_memory ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid() OR supabase_id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid() OR supabase_id = auth.uid()::text);

-- Leads policies
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

CREATE POLICY "Users can update own leads" ON leads
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Integrations policies
CREATE POLICY "Users can manage own integrations" ON integrations
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- OAuth tokens policies
CREATE POLICY "Users can view own OAuth tokens" ON oauth_tokens
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

CREATE POLICY "Users can update own OAuth tokens" ON oauth_tokens
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Deals policies
CREATE POLICY "Users can manage own deals" ON deals
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Voice settings policies
CREATE POLICY "Users can manage own voice settings" ON voice_settings
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Automations policies
CREATE POLICY "Users can manage own automations" ON automations
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Follow-up queue policies
CREATE POLICY "Users can view own queue items" ON follow_up_queue
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Calendar events policies
CREATE POLICY "Users can manage own calendar events" ON calendar_events
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Team members policies
CREATE POLICY "Users can view own team" ON team_members
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Webhooks policies
CREATE POLICY "Users can manage own webhooks" ON webhooks
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Insights policies
CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- API keys policies
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- Embeddings policies
CREATE POLICY "Users can manage own brand embeddings" ON brand_embeddings
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

CREATE POLICY "Users can manage own semantic memory" ON semantic_memory
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update user plan after payment
CREATE OR REPLACE FUNCTION update_user_plan_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'succeeded' THEN
    UPDATE users 
    SET 
      plan = NEW.plan
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_settings_updated_at ON voice_settings;
CREATE TRIGGER update_voice_settings_updated_at
  BEFORE UPDATE ON voice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automations_updated_at ON automations;
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All tables, indexes, policies, and functions have been created!
-- You can now use this database with your application.
-- 
-- Next steps:
-- 1. Add your Supabase credentials to .env:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - SUPABASE_SERVICE_ROLE_KEY  
--    - SUPABASE_ANON_KEY
-- 2. Add other API keys (OPENAI_API_KEY, STRIPE_SECRET_KEY, ENCRYPTION_KEY)
-- 3. Restart your application
-- ============================================================================
