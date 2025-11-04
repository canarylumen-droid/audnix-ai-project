
# 🚀 Replit Deployment Guide - Production Ready

## Why Replit?

- ✅ **Instant deployment** - No build configuration needed
- ✅ **Free SSL certificate** - HTTPS automatic
- ✅ **Database migrations auto-run** - Tables created automatically
- ✅ **Zero DevOps** - Just click Run
- ✅ **Free tier available** - Perfect for testing
- ✅ **Always accessible** - Free domain at `your-repl.username.repl.co`

---

## Step 1: Set Up Supabase (2 minutes)

### Create Supabase Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Enter project name (e.g., "audnix-ai")
4. Create a strong database password
5. Wait ~2 minutes for setup

### Get Your Credentials

**Database URL:**
1. Settings → Database
2. Copy **Connection String** (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password

**API Keys:**
1. Settings → API
2. Copy **Project URL** (`https://xxxxx.supabase.co`)
3. Copy **anon public** key
4. Copy **service_role secret** key

**Enable OAuth Providers:**
1. Authentication → Providers
2. Enable **Google**:
   - Get Client ID/Secret from https://console.cloud.google.com/apis/credentials
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Enable **GitHub**:
   - Get Client ID/Secret from https://github.com/settings/developers
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
4. Enable **Apple** (optional):
   - Requires Apple Developer account
   - Get credentials from https://developer.apple.com

---

## Step 2: Add Secrets to Replit

Click the **Secrets** (🔒) icon in Replit's left sidebar.

### Required Secrets (App won't work without these):

```
DATABASE_URL=postgresql://postgres.xxxxx:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-key
```

### Auto-Generated Secrets (Replit creates these):

These are automatically created by Replit - you don't need to add them:
- `SESSION_SECRET` ✅ Auto-generated
- `ENCRYPTION_KEY` ✅ Auto-generated

### Optional Secrets (Add as needed):

```bash
# AI Features (Recommended)
OPENAI_API_KEY=sk-your_openai_key_here

# Voice Notes (Optional)
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

---

## Step 3: Deploy (Automatic)

### First Deployment

1. Click the **Run** button at the top of Replit
2. Wait ~30 seconds for dependencies to install
3. Database tables are created automatically
4. App starts at `http://0.0.0.0:5000`
5. Access your live app at `https://your-repl.username.repl.co`

### What Happens Automatically:

✅ npm install runs
✅ Database migrations execute
✅ All 7 tables created in Supabase
✅ Server starts on port 5000
✅ SSL certificate generated
✅ Domain assigned

### Verify Deployment:

Visit `https://your-repl.username.repl.co/api/health`

Should return:
```json
{
  "ok": true,
  "timestamp": "2025-01-21T..."
}
```

---

## Step 4: Test Core Features

### 1. Test Landing Page
- Visit `https://your-repl.username.repl.co`
- Should load within 2 seconds
- Click "Start Free Trial"

### 2. Test Authentication
- Click "Start Free Trial"
- Enter email → Redirects to Supabase OAuth
- Log in with email/password
- Should redirect to dashboard

### 3. Test Integrations

**WhatsApp (QR Code):**
- Dashboard → Integrations → WhatsApp
- Click "Connect WhatsApp"
- QR code appears
- Scan with phone → Connected ✅

**Instagram (Private API):**
- Dashboard → Integrations → Instagram
- Enter your Instagram username/password
- Click "Connect"
- Should show "Connected" ✅

---

## Troubleshooting

### Issue: "Database connection failed"

**Fix:**
1. Check `DATABASE_URL` in Secrets is correct
2. Verify password has no special characters that need escaping
3. Test connection in Supabase dashboard

### Issue: "Migrations failed"

**Fix:**
1. Go to Supabase → SQL Editor
2. Run this to check tables:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```
3. If empty, manually run migrations from `migrations/` folder

### Issue: "App keeps sleeping"

**Fix:**
- Free tier sleeps after 5 minutes of inactivity
- Upgrade to **Replit Hacker** ($7/mo) for always-on
- Or use UptimeRobot.com to ping every 5 minutes (free)

### Issue: "WhatsApp QR code not working"

**Fix:**
1. Clear `.wwebjs_auth/` folder
2. Restart Repl
3. Try scanning QR again
4. Make sure WhatsApp is up to date on phone

---

## Custom Domain Setup (Optional)

### Add Your Domain

1. Click **Deployments** tab in Replit
2. Click **Settings** → **Domains**
3. Click **"Link Domain"**
4. Enter your domain (e.g., `app.yourdomain.com`)

### Update DNS Records

Add these records at your domain registrar:

```
Type: A
Name: app (or @ for root domain)
Value: [IP shown by Replit]

Type: TXT
Name: _acme-challenge.app
Value: [Value shown by Replit]
```

### Wait for Verification

- DNS propagation: 5 minutes to 24 hours (usually 5-10 minutes)
- Check status in Replit Deployments tab
- SSL certificate auto-generated when verified

---

## Monitoring & Logs

### View Application Logs

Click **Console** tab at bottom of Replit to see real-time logs:

```
✓ Using DrizzleStorage with PostgreSQL
✅ All migrations complete!
📊 Your database is ready to use
🚀 Server running at http://0.0.0.0:5000
```

### Check Worker Status

Logs show worker health every 5 minutes:
```
✅ Follow-up worker: healthy
✅ Weekly insights worker: healthy
✅ Video comment monitor: healthy
```

---

## Scaling on Replit

### Free Tier
- Good for: Testing, MVP, <100 users
- RAM: 512MB
- Sleeps after 5 min inactivity
- **Cost:** $0/month

### Hacker Plan
- Good for: Production, 100-1000 users
- RAM: 2GB
- Always-on (no sleeping)
- Faster performance
- **Cost:** $7/month

### Teams Plan
- Good for: 1000+ users, team collaboration
- RAM: 4GB+
- Private Repls
- Team collaboration
- **Cost:** $20/month

---

## Security Checklist

Before going live with real users:

- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is in Secrets (not code)
- [ ] `SESSION_SECRET` is random (auto-generated by Replit)
- [ ] `ENCRYPTION_KEY` is random (auto-generated by Replit)
- [ ] All API keys in Secrets (not `.env` file)
- [ ] Test OAuth flows work
- [ ] Test WhatsApp QR code connection
- [ ] Test Instagram Private API connection
- [ ] Verify rate limiting is active

---

## Cost Breakdown (Production)

### Replit Costs
- **Free tier:** $0/month (sleeps after 5 min)
- **Hacker plan:** $7/month (always-on, 2GB RAM)

### Supabase Costs
- **Free tier:** $0/month (500MB database, 2GB bandwidth)
- **Pro tier:** $25/month (8GB database, 250GB bandwidth, better support)

### Total Monthly Cost
- **Development:** $0 (Free tier)
- **Production (100-1000 users):** $7 (Replit Hacker) + $0 (Supabase Free) = **$7/month**
- **Production (1000-10,000 users):** $7 (Replit) + $25 (Supabase Pro) = **$32/month**

### When to Upgrade

**Replit Free → Hacker ($7/mo):**
- App sleeps too often (users complain)
- Need always-on reliability
- More than 100 active users

**Supabase Free → Pro ($25/mo):**
- Database >500MB
- Need >2GB monthly bandwidth
- Want priority support

---

## Need Help?

- **Replit Docs:** https://docs.replit.com
- **Supabase Docs:** https://supabase.com/docs
- **Check Console logs first** - 90% of issues show there
- **Clear browser cache** if UI looks broken

---

**You're ready to launch! Click Run and your app is live.** 🚀
