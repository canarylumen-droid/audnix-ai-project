-- Fix schema mismatches for notifications and onboarding_profiles

-- 1. Fix notifications table
ALTER TABLE notifications RENAME COLUMN body TO message;
ALTER TABLE notifications RENAME COLUMN read TO is_read;

-- 2. Recreate onboarding_profiles table to match current schema
DROP TABLE IF EXISTS onboarding_profiles CASCADE;

CREATE TABLE onboarding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  user_role text,
  source text,
  use_case text,
  business_size text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
