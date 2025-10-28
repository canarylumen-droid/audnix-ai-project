# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`
3. **PostgreSQL Database**: Set up a Neon or Vercel Postgres database

## Environment Variables

Set these in your Vercel Project Settings → Environment Variables:

### Required
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secure-random-session-secret-here
```

### Optional (for full functionality)
```bash
# Supabase (for authentication)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

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

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure the following:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`
5. Add all required environment variables
6. Click "Deploy"

### Option 2: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

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
