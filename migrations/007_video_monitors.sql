
-- Video Monitors for comment automation
CREATE TABLE IF NOT EXISTS video_monitors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  product_link TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Processed comments to avoid duplicate responses
CREATE TABLE IF NOT EXISTS processed_comments (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_monitors_user_id ON video_monitors(user_id);
CREATE INDEX IF NOT EXISTS idx_video_monitors_active ON video_monitors(is_active);
CREATE INDEX IF NOT EXISTS idx_processed_comments_comment_id ON processed_comments(comment_id);
