# 🔧 Supabase Redirect URL Setup for audnixai.com

## The Problem
You're seeing "configure Supabase" errors because the Supabase secrets aren't set in your environment.

## The Solution

### Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com
2. Open your Audnix project (or create one)
3. Go to **Settings → API**
4. Copy these 3 values:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal")

### Step 2: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

Add these:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
```

### Step 3: Configure Google OAuth

**In Google Cloud Console:**
1. Go to https://console.cloud.google.com
2. Navigate to "APIs & Services" → "Credentials"
3. Create OAuth 2.0 Client ID
4. **Add these redirect URIs:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://audnixai.com/auth/callback
   https://www.audnixai.com/auth/callback
   https://your-vercel-app.vercel.app/auth/callback
   ```

**In Supabase Dashboard:**
1. Go to **Authentication → Providers**
2. Enable **Google** provider
3. Paste your Google **Client ID** and **Client Secret**
4. In **Redirect URLs**, add:
   ```
   https://audnixai.com/auth/callback
   https://www.audnixai.com/auth/callback
   https://your-vercel-app.vercel.app/auth/callback
   ```
5. Save changes

### Step 4: Configure Custom Domain in Vercel

1. Vercel Project → Settings → Domains
2. Add `audnixai.com` and `www.audnixai.com`
3. Follow Vercel's DNS instructions to point your domain

### Step 5: Update Redirect URL in Code (Already Done!)

The code already uses dynamic redirect URL:
```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

This automatically detects:
- `https://audnixai.com/auth/callback` (production)
- `https://www.audnixai.com/auth/callback` (www subdomain)
- `https://your-app.vercel.app/auth/callback` (Vercel preview)
- `http://localhost:5000/auth/callback` (local dev)

## Which Domain Should You Use?

**For production (audnixai.com):**
- Primary redirect URL: `https://audnixai.com/auth/callback`
- Also add: `https://www.audnixai.com/auth/callback` (for users who type www)

**For testing/preview:**
- Use your Vercel URL: `https://your-app.vercel.app/auth/callback`

## Common Issues

**"Redirect URI mismatch"**
→ Make sure the exact URL is added in BOTH Google Console AND Supabase Dashboard

**"Supabase not configured"**
→ Check that all 3 environment variables are set in Vercel and deployed

**"Auth callback not working"**
→ Verify your custom domain is fully configured in Vercel and DNS is pointing correctly

## Testing Checklist

- [ ] Supabase credentials added to Vercel
- [ ] Google OAuth redirect URLs added
- [ ] Custom domain configured in Vercel
- [ ] DNS records updated
- [ ] Redeploy Vercel to apply env vars
- [ ] Test Google sign-in on live domain

---

## 🚀 Ready to Test

Once you've added the Supabase credentials to Vercel:

1. Redeploy your app
2. Go to https://audnixai.com/auth
3. Click "Sign in with Google"
4. Google popup should appear
5. After authorizing, you should redirect to dashboard

**The code is already correct** - you just need to add the environment variables!
