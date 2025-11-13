# Database & Authentication Setup - Audnix AI

## Current Architecture ✅

Your project uses a **dual-database architecture** that separates concerns:

### 1. **Primary Database: Neon PostgreSQL** (Required)
- **Purpose**: Stores ALL your application data
  - Users, leads, messages, integrations
  - Deals, notifications, voice settings
  - Usage tracking, calendar events
- **Configuration**: `DATABASE_URL` environment variable
- **Status**: ✅ Connected and working
- **Database Name**: `helium` (from logs)

### 2. **Authentication: Supabase** (Optional - for OAuth)
- **Purpose**: Handles user authentication ONLY
  - Google Sign-In
  - OAuth redirect management
  - Session management
- **Configuration**: 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Status**: ⚠️ Not configured (using in-memory auth for dev)

## Why This Setup?

✅ **Best Practice Architecture**:
- Supabase excels at OAuth/authentication
- Neon excels at PostgreSQL database hosting
- Separation of concerns = better reliability

## What You Need

### Production Deployment Checklist:

1. **Database (Required)**:
   ```
   DATABASE_URL=postgresql://user:pass@host/database
   ```
   Currently using Neon - keep it! ✅

2. **Authentication (Required for Google Sign-In)**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **OAuth Redirect URLs** (Must match your domain):
   - For Google OAuth: `https://audnixai.com/api/auth/callback/google`
   - For Supabase: `https://audnixai.com/api/auth/callback`

## Current Status

✅ **Working**:
- PostgreSQL database (Neon)
- Database migrations
- All tables created
- Backend server running

⚠️ **Needs Configuration**:
- Supabase authentication
- Google OAuth redirect URLs
- Stripe webhook verification

## Recommendation

**Keep using Neon PostgreSQL** - it's working perfectly!  
Your DATABASE_URL is correctly configured and all tables are set up.

For authentication, you need to:
1. Set up Supabase project (for OAuth)
2. Add Supabase env variables to Vercel
3. Configure Google OAuth redirect URLs to use `audnixai.com`

---

*Generated: November 13, 2025*
