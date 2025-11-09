
-- WhatsApp session storage table (safe migration)

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_sessions') THEN
    CREATE TABLE whatsapp_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_data TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    CREATE INDEX idx_whatsapp_sessions_user ON whatsapp_sessions(user_id);
    
    -- Add trigger for updated_at
    CREATE TRIGGER update_whatsapp_sessions_updated_at
      BEFORE UPDATE ON whatsapp_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
