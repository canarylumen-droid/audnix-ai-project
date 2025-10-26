# Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Audnix AI CRM application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose an organization and region
5. Set a secure database password (save it!)
6. Wait for the project to be created (takes ~2 minutes)

## Step 2: Run the Database Migration

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `migrations/000_SETUP_SUPABASE.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for it to complete - you should see "Success" messages

This will create:
- 18 tables (users, leads, messages, integrations, etc.)
- All necessary indexes for performance
- Row Level Security (RLS) policies for data protection
- Helper functions and triggers

## Step 3: Get Your Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. You'll need three values:

### Project URL
- Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
- This is your `NEXT_PUBLIC_SUPABASE_URL`

### API Keys
- Copy the **anon public** key
  - This is your `SUPABASE_ANON_KEY`
- Copy the **service_role** key (click "Reveal" first)
  - This is your `SUPABASE_SERVICE_ROLE_KEY`
  - **Keep this secret!** Never commit it to git or share it

## Step 4: Set Environment Variables in Replit

1. In Replit, open the **Secrets** tool (🔒 icon in left sidebar)
2. Add these three secrets:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
```

## Step 5: Add Additional Required Secrets

While you're in Secrets, add these additional keys:

### OpenAI (for AI message generation)
```
OPENAI_API_KEY = sk-xxxxx
```
Get this from: https://platform.openai.com/api-keys

### Stripe (for payments)
```
STRIPE_SECRET_KEY = sk_test_xxxxx  (or sk_live_ for production)
STRIPE_WEBHOOK_SECRET = whsec_xxxxx  (from Stripe dashboard webhooks)
```
Get these from: https://dashboard.stripe.com/apikeys

### Encryption Key (for OAuth tokens)
```
ENCRYPTION_KEY = <generate-a-random-32-byte-hex-string>
```
Generate one by running in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Session Secret (already set)
```
SESSION_SECRET = <already-configured>
```
This should already be set. If not, generate one the same way as ENCRYPTION_KEY.

## Step 6: Enable Supabase Auth Providers (Optional)

If you want Google/Apple OAuth login:

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Google** and/or **Apple**
3. Follow the setup instructions for each provider
4. Add the callback URL: `https://your-repl-url.repl.co/api/auth/callback`

## Step 7: Verify the Setup

1. Restart your Replit application
2. Check the logs - you should see:
   ```
   ✓ Using Supabase storage (production mode)
   ```
   Instead of:
   ```
   ⚠ Using MemStorage (development mode - data will be lost on restart)
   ```

3. Try creating a user by signing up
4. Check your Supabase **Table Editor** to see the data appearing

## Troubleshooting

### "relation 'users' does not exist"
- The migration didn't run successfully
- Go back to Step 2 and run the SQL migration again

### "Supabase credentials not set"
- Check that all three environment variables are set correctly
- Make sure there are no extra spaces in the values
- Restart your Replit after adding secrets

### RLS Policy Errors
- Make sure you're using the service role key on the backend
- The anon key should only be used on the frontend

### Connection Issues
- Verify your Supabase project is not paused
- Check the Project URL is correct (no trailing slash)
- Ensure your Replit IP is not blocked (usually not an issue)

## What's Next?

Once your database is set up:
- Your application will automatically use Supabase instead of in-memory storage
- All data will persist across restarts
- You can view and edit data in the Supabase Table Editor
- You can set up real-time subscriptions (already configured in the frontend)

## Database Schema Overview

Your database includes:
- **users** - User accounts and profiles
- **leads** - Lead/contact information
- **messages** - Conversation history
- **integrations** - Connected platforms (Instagram, WhatsApp, etc.)
- **oauth_tokens** - OAuth credentials (encrypted)
- **deals** - Sales opportunities
- **voice_settings** - AI voice configuration
- **automations** - Automated workflows
- **follow_up_queue** - Scheduled follow-ups
- **calendar_events** - Meeting bookings
- **notifications** - User notifications
- **webhooks** - Webhook configurations
- **insights** - Analytics and insights
- **payments** - Billing records
- **brand_embeddings** - AI knowledge base (pgvector)
- **semantic_memory** - Conversation context (pgvector)

All tables have Row Level Security enabled to protect user data.
