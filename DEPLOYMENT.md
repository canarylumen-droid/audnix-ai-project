# 🚀 Audnix AI - Deployment Guide

## Quick Start: Deploy to Render.com (Recommended)

**Why Render?** Free tier handles 500+ users, auto-SSL, easy setup, and great performance.

### Option 1: One-Click Deploy (Easiest)

1. Click the button below:
   
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

2. Render will auto-detect `render.yaml` and set up everything
3. Add your environment variables (see below)
4. Click "Apply" and wait ~5 minutes
5. Done! Your app is live at `https://your-app.onrender.com`

### Option 2: Manual Setup

1. **Create Render Account**
   - Go to https://render.com
   - Sign up (free)

2. **Connect Repository**
   - Dashboard → New + → Web Service
   - Connect your GitHub/GitLab repo
   - Render auto-detects settings from `render.yaml`

3. **Add Environment Variables**
   Go to Dashboard → Your Service → Environment and add:
   
   **CRITICAL (App won't work without these):**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   OPENAI_API_KEY=sk-your_openai_key
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   ```
   
   SESSION_SECRET and ENCRYPTION_KEY are auto-generated ✓

4. **Deploy**
   - Click "Create Web Service"
   - First deploy takes ~5 minutes
   - Watch logs for any errors

5. **Update OAuth Redirect URIs**
   After deployment, update ALL provider redirect URIs:
   
   **Google (Calendar & Gmail):**
   - https://console.cloud.google.com
   - OAuth 2.0 credentials → Edit
   - Authorized redirect URIs → Add:
     ```
     https://your-app.onrender.com/api/oauth/google-calendar/callback
     https://your-app.onrender.com/api/oauth/gmail/callback
     ```
   
   **Instagram:**
   - https://developers.facebook.com/apps/
   - Instagram Basic Display → OAuth Redirect URIs:
     ```
     https://your-app.onrender.com/api/oauth/instagram/callback
     ```
   
   **WhatsApp:**
   - Same Meta dashboard
   - WhatsApp → Configuration:
     ```
     https://your-app.onrender.com/api/oauth/whatsapp/callback
     ```
   
   **Outlook:**
   - https://portal.azure.com
   - App registrations → Authentication:
     ```
     https://your-app.onrender.com/api/oauth/outlook/callback
     ```

6. **Configure Stripe Webhook**
   - https://dashboard.stripe.com/webhooks
   - Add endpoint:
     ```
     https://your-app.onrender.com/api/billing/webhook
     ```
   - Select events: `checkout.session.completed`, `customer.subscription.updated`
   - Copy webhook secret → Add as `STRIPE_WEBHOOK_SECRET` env var

7. **Test Everything**
   - Visit `https://your-app.onrender.com/api/health` (should return `{"ok":true}`)
   - Test user registration
   - Test at least one OAuth integration
   - Monitor logs for errors

---

## Alternative: Deploy to Railway.app

Railway offers $5 free credit (good for ~1 month of testing).

### Setup

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy**
   - Dashboard → New Project → Deploy from GitHub
   - Select your repo
   - Railway auto-detects `railway.json`

3. **Add PostgreSQL**
   - Project → New → Database → PostgreSQL
   - Railway auto-sets `DATABASE_URL`

4. **Add Environment Variables**
   - Settings → Variables
   - Add all vars from `.env.example`

5. **Generate Domain**
   - Settings → Domains → Generate Domain
   - Update OAuth redirect URIs (same as Render instructions above)

6. **Deploy**
   - Automatic! Deploys on every push to main

---

## Setting Up Supabase (Required)

1. **Create Project**
   - Go to https://supabase.com
   - Create new project
   - Wait ~2 minutes for setup

2. **Run Database Migrations**
   - Go to SQL Editor
   - Copy contents of `migrations/002_audnix_schema.sql`
   - Paste and run

3. **Get API Keys**
   - Settings → API
   - Copy:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

4. **Configure Authentication**
   - Authentication → Providers
   - Enable Google (for OAuth login)
   - Add OAuth redirect URL:
     ```
     https://your-app.onrender.com/api/auth/callback
     ```

---

## Environment Variables Checklist

### Tier 1: CRITICAL (Required for Basic Functionality)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SESSION_SECRET` (auto-generated on Render)
- [ ] `ENCRYPTION_KEY` (auto-generated on Render)
- [ ] `DATABASE_URL` (auto-provided by hosting)

### Tier 2: IMPORTANT (Enable Core Features)

- [ ] `OPENAI_API_KEY` - AI message generation, insights
- [ ] `STRIPE_SECRET_KEY` - Billing and payments
- [ ] `VITE_STRIPE_PUBLIC_KEY` - Frontend payment forms

### Tier 3: INTEGRATIONS (Add as Needed)

**Google Services:**
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALENDAR_CLIENT_ID`
- [ ] `GOOGLE_CALENDAR_CLIENT_SECRET`

**Social Media:**
- [ ] `INSTAGRAM_APP_ID`
- [ ] `INSTAGRAM_APP_SECRET`
- [ ] `WHATSAPP_APP_ID`
- [ ] `WHATSAPP_APP_SECRET`
- [ ] `WHATSAPP_TOKEN`

**Email:**
- [ ] `GMAIL_CLIENT_ID`
- [ ] `GMAIL_CLIENT_SECRET`
- [ ] `OUTLOOK_CLIENT_ID`
- [ ] `OUTLOOK_CLIENT_SECRET`

### Tier 4: OPTIONAL (Enhanced Features)

- [ ] `ELEVENLABS_API_KEY` - Voice cloning
- [ ] `RESEND_API_KEY` - Email notifications
- [ ] `REDIS_URL` - Background job queues (production)

---

## Cost Breakdown

### Render.com (Recommended for Starting)

**Free Tier:**
- Web Service: $0/month (512MB RAM, sleeps after 15 min inactivity)
- PostgreSQL: $0/month (1GB storage)
- **Total: $0/month**
- **Good for:** 500+ users, testing, MVP

**Starter Tier** (when you outgrow free):
- Web Service: $7/month (512MB RAM, always-on)
- PostgreSQL: $7/month (1GB storage)
- **Total: $14/month**
- **Good for:** 1000-2000 active users

**Standard Tier** (scaling up):
- Web Service: $25/month (2GB RAM)
- PostgreSQL: $20/month (10GB)
- **Total: $45/month**
- **Good for:** 5000+ users

### Railway.app

**Free Tier:**
- $5 credit (lasts ~1 month)
- **Good for:** Testing only

**Hobby Plan:**
- $5/month base + usage
- ~$10-20/month typical
- **Good for:** Small production apps

### When to Upgrade

**Free → Starter ($14/mo):**
- App sleeps too often (users complain)
- More than 500 active users
- Need always-on reliability

**Starter → Standard ($45/mo):**
- Database >1GB (check usage in dashboard)
- More than 2000 active users
- Slow response times

---

## Monitoring & Maintenance

### Check Health

```bash
curl https://your-app.onrender.com/api/health
# Should return: {"ok":true,"timestamp":"..."}
```

### View Logs

**Render:**
- Dashboard → Your Service → Logs

**Railway:**
- Project → Deployments → View Logs

### Common Issues

**"App not responding"**
- Free tier sleeps after 15 min
- First request after sleep takes ~30 sec
- Solution: Upgrade to Starter ($7/mo) for always-on

**"Database connection error"**
- Check `DATABASE_URL` is set correctly
- Verify Supabase project is running
- Check database connection limits

**"OAuth callback failed"**
- Verify redirect URIs match exactly
- Check provider credentials are correct
- Ensure app domain is correct in provider settings

**"Stripe webhook not working"**
- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` is set
- View webhook logs in Stripe dashboard

---

## Security Checklist

Before going live:

- [ ] All secrets use production keys (no `test_` or `sk_test_`)
- [ ] `NODE_ENV=production` is set
- [ ] `SESSION_SECRET` and `ENCRYPTION_KEY` are strong random values
- [ ] OAuth redirect URIs only allow your domain
- [ ] Stripe webhook signature verification enabled
- [ ] Database has RLS (Row Level Security) policies enabled
- [ ] Rate limiting configured (if needed)
- [ ] SSL certificate is active (auto on Render/Railway)

---

## Custom Domain Setup

### Render

1. Dashboard → Settings → Custom Domain
2. Add your domain (e.g., `app.yourdomain.com`)
3. Add DNS records (Render provides exact values)
4. Wait for SSL certificate (~15 min)
5. Update all OAuth redirect URIs to new domain

### Railway

1. Project → Settings → Domains
2. Add custom domain
3. Configure DNS as instructed
4. Update OAuth redirect URIs

---

## Scaling Strategy

**Stage 1: Free Tier (0-500 users)**
- Use Render free tier
- Monitor usage in dashboard
- Perfect for MVP and testing

**Stage 2: Starter ($14/mo, 500-2000 users)**
- Upgrade web service for always-on
- Keep free database if <1GB
- Add monitoring (e.g., Sentry)

**Stage 3: Standard ($45/mo, 2000-10000 users)**
- Upgrade database to 10GB
- Upgrade web service to 2GB RAM
- Consider Redis for caching

**Stage 4: Scale Out (10000+ users)**
- Multiple web service instances
- Database read replicas
- CDN for static assets
- Consider moving to dedicated infrastructure

---

## Need Help?

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **Check logs first** - 90% of issues show up in logs

---

**Ready to deploy? Start with Render.com free tier and scale up as you grow!** 🚀
