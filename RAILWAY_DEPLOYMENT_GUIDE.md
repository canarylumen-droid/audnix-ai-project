# Railway Deployment Guide for Audnix AI

Complete guide to deploy Audnix AI to Railway with all required environment variables and integrations.

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository with your Audnix AI code
3. API keys for external services (Supabase, OpenAI, ElevenLabs, etc.)

## Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your GitHub repo (or use Railway dashboard)
railway link
```

## Step 2: Required Environment Variables

### Core Application
```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=<generate-random-32-char-string>
```

### Supabase (Database & Auth)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### AI Services
```env
# OpenAI (Required for AI conversations)
OPENAI_API_KEY=sk-...

# ElevenLabs (Required for AI voice cloning)
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### Stripe (Payment Processing)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### Email Integrations (OAuth)
```env
# Google OAuth (Gmail Integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth (Outlook Integration)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### WhatsApp Integration
**WhatsApp Web.js (Default - FREE, uses QR code)**
- No environment variables needed
- Users scan QR code to connect their WhatsApp
- Works out of the box

**Twilio WhatsApp (Optional - for OTP-based connections)**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Instagram Integration (Coming Soon)
```env
# Instagram Graph API (when available)
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
```

### Security & Rate Limiting (Optional but Recommended)
```env
# Redis for distributed rate limiting (recommended for production)
REDIS_URL=redis://default:password@host:port

# CSRF Protection (auto-configured via origin validation)
# No additional env vars needed
```

## Step 3: Configure OAuth Redirect URLs

### Google OAuth (Gmail)
1. Go to https://console.cloud.google.com
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://your-domain.railway.app/api/oauth/gmail/callback`
   - `http://localhost:5000/api/oauth/gmail/callback` (for local dev)

### Microsoft OAuth (Outlook)
1. Go to https://portal.azure.com
2. Navigate to "Azure Active Directory" > "App registrations"
3. Select your app
4. Go to "Authentication"
5. Add redirect URIs:
   - `https://your-domain.railway.app/api/oauth/outlook/callback`
   - `http://localhost:5000/api/oauth/outlook/callback` (for local dev)

### Stripe Webhooks
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.railway.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 4: Deploy to Railway

### Option A: Using Railway CLI
```bash
# Deploy current branch
railway up

# Deploy with environment variables
railway run npm start

# View logs
railway logs
```

### Option B: Using Railway Dashboard
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Audnix AI repository
5. Railway will auto-detect the build command from `package.json`
6. Add all environment variables in "Variables" tab
7. Click "Deploy"

## Step 5: Configure Custom Domain (Optional)

1. In Railway dashboard, go to your project
2. Click "Settings" > "Domains"
3. Click "Generate Domain" for free Railway subdomain
4. Or add custom domain:
   - Add your domain (e.g., `app.audnix.ai`)
   - Update DNS records at your domain registrar:
     - Add CNAME: `app` → `your-project.railway.app`
   - Wait for DNS propagation (up to 48 hours)
   - Railway will automatically provision SSL certificate

## Step 6: Database Setup (Supabase)

1. Go to https://supabase.com/dashboard
2. Create new project or use existing
3. Go to "Settings" > "API"
4. Copy:
   - Project URL → `SUPABASE_URL`
   - Anon/Public key → `SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

5. Run database migrations (if not auto-applied):
```bash
# Using Supabase CLI
npx supabase db push

# Or run SQL migrations manually in Supabase SQL Editor
```

## Step 7: Verify Deployment

### Health Check Endpoints
- Frontend: `https://your-domain.railway.app`
- API Health: `https://your-domain.railway.app/health`
- Database Status: Check Supabase dashboard

### Test Integrations
1. **Email (Gmail/Outlook)**: Try connecting in `/dashboard/integrations`
2. **WhatsApp**: Scan QR code to connect WhatsApp Web
3. **Stripe**: Create test subscription (use test mode first)
4. **AI Voice**: Upload voice sample and test generation

## Step 8: Production Checklist

- [ ] All environment variables set correctly
- [ ] OAuth redirect URLs configured
- [ ] Stripe webhook endpoint active
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active
- [ ] Database migrations applied
- [ ] Rate limiting configured (Redis recommended)
- [ ] Error monitoring setup (optional: Sentry, LogRocket)
- [ ] Backup strategy for database (Supabase auto-backups)

## Troubleshooting

### Build Fails
```bash
# Check Railway logs
railway logs

# Common issues:
# 1. Missing environment variables
# 2. Node version mismatch (ensure package.json specifies "engines")
# 3. Build timeout (increase in Railway settings)
```

### OAuth Redirect Errors
- Verify redirect URLs match exactly (no trailing slashes)
- Check OAuth consent screen is configured
- Ensure app is not in testing mode (for production)

### WhatsApp Not Connecting
- Check puppeteer dependencies are installed
- Verify Railway has enough memory (increase if needed)
- For Twilio OTP: verify credentials are correct

### Rate Limiting Issues
- If using Redis: verify `REDIS_URL` is correct
- Without Redis: rate limiting uses memory (resets on restart)

## Environment Variable Generation

### Generate Secure SESSION_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Environment Variables Locally
```bash
# Create .env file (DO NOT commit to Git)
cp .env.example .env

# Edit .env with your values
nano .env

# Test locally
npm run dev
```

## Support & Resources

- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- OpenAI API: https://platform.openai.com/docs
- ElevenLabs API: https://elevenlabs.io/docs

## Summary

Your Audnix AI app will be live at:
- **Free Railway Domain**: `your-project.railway.app`
- **Custom Domain**: `your-domain.com` (if configured)

**WhatsApp Integration:**
- Default: WhatsApp Web.js (QR code, FREE, no env vars)
- Optional: Twilio (OTP, requires TWILIO_* env vars)

**SMTP/Custom Email:**
- Users can connect business emails via Gmail/Outlook OAuth
- Custom SMTP is supported via backend (custom_email_routes.ts)
- No additional env vars needed for SMTP

**Cost Estimate (Monthly):**
- Railway: ~$5-20 (based on usage)
- Supabase: Free tier or ~$25/month
- OpenAI API: ~$10-50 (usage-based)
- ElevenLabs: ~$5-30 (usage-based)
- Stripe: 2.9% + $0.30 per transaction
- **Total: ~$45-145/month** (scales with usage)

All set! 🚀 Your AI Sales Closer is now live and converting leads on autopilot.
