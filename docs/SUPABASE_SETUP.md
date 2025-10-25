# Supabase Setup Guide

This guide walks you through setting up your Supabase database for Audnix AI in production.

## Prerequisites

- A Supabase account (free tier works great to start)
- Your Supabase project created at [supabase.com](https://supabase.com)

## Step 1: Get Your Credentials

1. Go to your Supabase project dashboard
2. Click the **Settings** icon (gear) in the sidebar
3. Navigate to **API** section
4. Copy these three values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Public/anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # Service role key (keep secure!)
```

5. Add these to your Replit Secrets or `.env` file

## Step 2: Enable Required Extensions

1. In your Supabase dashboard, go to **Database** → **Extensions**
2. Search for and enable:
   - `pgvector` (for AI embeddings)
   - `uuid-ossp` (for UUID generation)

## Step 3: Run Database Migrations

You have two options for running migrations:

### Option A: SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `migrations/002_audnix_schema.sql`
4. Click **Run** to execute the migration
5. Repeat with `migrations/003_production_upgrade.sql`

### Option B: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 4: Verify Installation

After running the migrations, verify everything is set up correctly:

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - ✅ users
   - ✅ leads
   - ✅ messages
   - ✅ integrations
   - ✅ followup_jobs
   - ✅ automations
   - ✅ oauth_tokens
   - ✅ brand_embeddings
   - ✅ semantic_memory
   - ✅ and more...

3. Check that Row Level Security (RLS) is enabled:
   - Click on any table → **...** menu → **View Policies**
   - You should see policies like "Users can view own data"

## Step 5: Test the Connection

1. Add your credentials to Replit Secrets or `.env`
2. Restart your application
3. Check the console logs - you should see:
   ```
   ✓ Using Supabase storage (production mode)
   ```
   Instead of:
   ```
   ⚠ Using MemStorage (development mode)
   ```

## Step 6: Create Your First User

After authentication is working, your first user will be created automatically when they sign in via OAuth. The OAuth callback at `/api/auth/callback` handles:

1. Exchanging the OAuth code for a session
2. Extracting user metadata (name, email, avatar)
3. Creating or updating the user in your `users` table
4. Starting a 3-day trial automatically

## Row Level Security (RLS)

The migrations automatically set up RLS policies so users can only access their own data:

- Users can only see their own profile
- Users can only access their own leads, messages, and integrations
- Admin users have elevated permissions
- Service role key bypasses RLS for backend operations

## Common Issues

### Issue: "relation 'users' does not exist"
**Solution**: You haven't run the migrations yet. Go to Step 3.

### Issue: "permission denied for table users"
**Solution**: You're using the anon key instead of service role key on the backend. Check your `SUPABASE_SERVICE_ROLE_KEY`.

### Issue: "new row violates row-level security policy"
**Solution**: Make sure you're using the service role key for backend operations, not the anon key.

### Issue: Vector extension errors
**Solution**: Enable the `pgvector` extension in Database → Extensions.

## Database Schema Overview

### Core Tables

**users**: User accounts with plan, trial, and billing info
- Linked to Supabase Auth via `supabase_id`
- Tracks plan tier, trial expiry, Stripe IDs
- Stores user preferences (timezone, reply tone)

**leads**: Contacts from Instagram/WhatsApp/Email
- Belongs to a user
- Tracks status, score, channel, tags
- Stores contact info and metadata

**messages**: Conversation history
- Links to both lead and user
- Supports text and voice messages
- Tracks direction (inbound/outbound)

**integrations**: Connected provider accounts
- Stores encrypted OAuth tokens
- Tracks connection status and type
- One integration per provider per user

### Advanced Tables

**followup_jobs**: Automated follow-up queue
- Scheduled messages for leads
- Retry logic and error tracking
- Channel-specific parameters

**brand_embeddings** & **semantic_memory**: AI knowledge base
- Vector embeddings for RAG (Retrieval Augmented Generation)
- Enables AI to remember brand info and past conversations
- Uses pgvector for similarity search

**oauth_tokens**: Provider access/refresh tokens
- Manages token lifecycle
- Automatic refresh handling
- Encrypted storage

## Next Steps

After your database is set up:

1. ✅ Set up Supabase Auth OAuth providers (Google, Apple)
2. ✅ Configure Stripe for billing
3. ✅ Set up OpenAI for AI features
4. ✅ Configure email provider (optional)
5. ✅ Set up provider OAuth (Instagram, WhatsApp, Gmail)

See the main `.env.example` file for all required environment variables.

## Backup and Monitoring

### Automated Backups
Supabase automatically backs up your database daily on all plans. You can:
- View backups in **Database** → **Backups**
- Restore from a backup with one click
- Download backups for local storage

### Monitoring
Monitor your database health in **Database** → **Reports**:
- Query performance
- Connection pool usage  
- Storage usage
- Slow query log

## Production Checklist

Before going live:

- [ ] All migrations run successfully
- [ ] RLS policies tested and working
- [ ] Backup schedule verified
- [ ] Environment variables set in production
- [ ] Service role key kept secure (never exposed to frontend)
- [ ] Connection pooling enabled for high traffic
- [ ] Indexes created for frequently queried fields
- [ ] Vector indexes built for embeddings (automatic with migration)

## Support

If you run into issues:
1. Check the Supabase logs in **Database** → **Logs**
2. Review RLS policies if you get permission errors
3. Verify all extensions are enabled
4. Check the Supabase Discord or documentation

Your Audnix AI database is now production-ready! 🚀
