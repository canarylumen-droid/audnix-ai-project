-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Create users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  supabase_id text unique,
  email text not null,
  name text,
  username text,
  plan text default 'trial',
  trial_expires_at timestamptz,
  created_at timestamptz default now(),
  last_login timestamptz
);

-- Create index for quick email lookup
create index if not exists idx_users_email on users(email);

-- Create index for quick supabase_id lookup
create index if not exists idx_users_supabase_id on users(supabase_id);

-- Enable Realtime for this table (for live counter updates)
alter publication supabase_realtime add table users;

-- Optional: Create a function to automatically set trial_expires_at
create or replace function set_trial_expiry()
returns trigger as $$
begin
  if new.trial_expires_at is null and new.plan = 'trial' then
    new.trial_expires_at := now() + interval '3 days';
  end if;
  return new;
end;
$$ language plpgsql;

-- Create trigger to set trial expiry automatically
drop trigger if exists set_trial_expiry_trigger on users;
create trigger set_trial_expiry_trigger
  before insert on users
  for each row
  execute function set_trial_expiry();
