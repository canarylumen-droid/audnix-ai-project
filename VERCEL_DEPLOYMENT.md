# Vercel Deployment Guide - Audnix AI

## Overview
This app uses **Stripe payment links + poller** (NO webhooks, NO API key exposure).
Payment link is standalone. Poller detects payments on every request.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon PostgreSQL Database** (already set up)
3. **Stripe Secret Key** (from Replit integration or live account)

## Environment Variables for Vercel

Set these in Vercel Project Settings → Environment Variables:

### REQUIRED
```bash
STRIPE_SECRET_KEY=sk_test_XXXX (from Replit integration shown in logs)
DATABASE_URL=postgresql://... (from your Neon database)
```

### OPTIONAL
```bash
# Session & Security
SESSION_SECRET=generate with: openssl rand -hex 32
ENCRYPTION_KEY=generate with: openssl rand -hex 32

# If you want to add these later
# OPENAI_API_KEY=sk-...
# RESEND_API_KEY=re_XXXX...

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# Twilio (for voice messages)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Instagram/Meta (for Instagram integration)
META_APP_ID=...
META_APP_SECRET=...
META_VERIFY_TOKEN=...

# Gmail (for email integration)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=...

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

## How Stripe Payments Work (No Webhook Setup Needed)

```
User clicks Payment Link
    ↓
Pays on Stripe (money goes to Canada account)
    ↓
User returns to your app
    ↓
Request triggers middleware → Poller checks Stripe
    ↓
Poller detects successful payment ✅
    ↓
User auto-upgraded in database
    ↓
Success notification sent
```

**Zero webhook configuration needed.** Poller runs automatically on every request.

## Deployment Steps

### 1. Push Code to GitHub
```bash
git push origin main
```

### 2. Connect to Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Choose these settings:
  - **Framework**: Other
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist/public`
  - **Root Directory**: ./

### 3. Add Environment Variables in Vercel
- **Settings → Environment Variables**
- Add:
  ```
  STRIPE_SECRET_KEY = sk_test_XXXX...
  DATABASE_URL = postgresql://...
  SESSION_SECRET = (generate with: openssl rand -hex 32)
  ```
- **Deploy**

# The CLI will prompt you for environment variables
# or you can add them in the dashboard
```

## Post-Deployment Setup

### 1. Database Migration

After first deployment, run migrations:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to your project
vercel link

# Run migrations
npm run db:push
```

Or use the Vercel dashboard:
- Go to your project → Settings → Functions
- Add a deployment hook to run `npm run db:push` after deployment

### 2. Stripe Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhook/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET` env var

### 3. OAuth Redirect URLs

Update redirect URLs in each service:

**Supabase:**
- Add `https://your-app.vercel.app` to Allowed Redirect URLs

**Instagram/Meta:**
- Add `https://your-app.vercel.app/api/integrations/instagram/callback`

**Gmail:**
- Add `https://your-app.vercel.app/api/integrations/gmail/callback`

## Build Configuration

The project uses:
- **Frontend**: Vite + React + TypeScript
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL (DrizzleORM)

Build process:
1. Frontend builds to `dist/public`
2. Backend compiles to `dist/index.js`
3. Vercel serves frontend as static files
4. API routes proxy to backend function

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure TypeScript compiles without errors: `npm run check`
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Ensure database allows connections from Vercel IPs
- For Neon: Enable "Public access" in dashboard

### API Routes Not Working
- Check that `vercel.json` routes are configured correctly
- Verify environment variables are set in Vercel dashboard
- Check function logs in Vercel dashboard

### Session Issues
- Ensure `SESSION_SECRET` is set and secure
- For production, use a session store (PostgreSQL via connect-pg-simple is already configured)

## Performance Optimization

1. **Edge Regions**: Configure in `vercel.json` → regions
2. **Caching**: Add cache headers for static assets
3. **Database**: Use connection pooling (Neon, Supabase, or pgBouncer)
4. **Serverless Function Timeout**: Increase if needed in vercel.json

## Monitoring

- **Logs**: View in Vercel Dashboard → Deployments → Function Logs
- **Analytics**: Enable Vercel Analytics for performance insights
- **Errors**: Set up error tracking (Sentry, LogRocket, etc.)

## Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update OAuth redirect URLs with new domain

## Environment-Specific Settings

The app automatically detects Vercel environment:
- `process.env.VERCEL_ENV`: `production`, `preview`, or `development`
- Use this to configure different behavior per environment

## Security Checklist

- ✅ All secrets in environment variables (not in code)
- ✅ HTTPS only (Vercel provides SSL automatically)
- ✅ CORS configured correctly
- ✅ Session secret is strong and random
- ✅ Database credentials are secure
- ✅ Stripe webhook signature verification enabled
- ✅ Input validation on all API endpoints

## Support

For issues:
1. Check Vercel deployment logs
2. Check function logs for API errors
3. Verify all environment variables are set
4. Contact Vercel support or check [vercel.com/docs](https://vercel.com/docs)
