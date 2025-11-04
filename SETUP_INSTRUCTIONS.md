
# 🚀 Audnix AI - Setup Instructions

## ⚠️ CRITICAL: Database Setup Required

Your app won't persist data without a database. Follow these steps:

### Option 1: Replit PostgreSQL (Recommended - 30 seconds)
1. Click "Add Service" in the left sidebar
2. Select "PostgreSQL"
3. Click "Add"
4. Done! Database URL is auto-configured

### Option 2: Supabase (Full Features - 5 minutes)
1. Go to https://supabase.com and create account
2. Create new project (choose a region close to you)
3. Go to Project Settings → Database
4. Copy the connection string (URI format)
5. In Replit Secrets, add:
   - `DATABASE_URL` = your connection string
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key

### Enable Google OAuth (Required for Login)
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add authorized redirect: `https://your-repl-url.repl.co/api/auth/callback`
4. In Replit Secrets, add:
   - `GOOGLE_CLIENT_ID` = your client ID
   - `GOOGLE_CLIENT_SECRET` = your client secret

### Enable Stripe Payments
1. Go to https://stripe.com/dashboard
2. Get API keys from Developers → API Keys
3. In Replit Secrets, add:
   - `STRIPE_SECRET_KEY` = your secret key
   - `STRIPE_WEBHOOK_SECRET` = from webhook setup
4. Create payment links:
   - Starter plan ($49.99/mo)
   - Pro plan ($99.99/mo)
   - Enterprise plan ($199.99/mo)
   - Voice top-ups: 100min ($7), 300min ($20), 600min ($40), 1200min ($80)
5. Add payment link URLs to Secrets:
   - `STRIPE_PAYMENT_LINK_STARTER`
   - `STRIPE_PAYMENT_LINK_PRO`
   - `STRIPE_PAYMENT_LINK_ENTERPRISE`
   - `STRIPE_PAYMENT_LINK_VOICE_100`
   - `STRIPE_PAYMENT_LINK_VOICE_300`
   - `STRIPE_PAYMENT_LINK_VOICE_600`
   - `STRIPE_PAYMENT_LINK_VOICE_1200`

### OpenAI API (For AI Features)
1. Get key from https://platform.openai.com/api-keys
2. In Replit Secrets, add:
   - `OPENAI_API_KEY` = your key

---

## ✅ What's Already Configured

### Voice Minutes System
- ✅ Auto-locks when balance hits 0
- ✅ Real-time updates (10-second polling)
- ✅ Top-up system with 90%+ profit margins
- ✅ Tracks usage per generation

### Plan Limits
- ✅ Starter: 2,500 leads, 100 voice minutes
- ✅ Pro: 7,000 leads, 400 voice minutes
- ✅ Enterprise: 20,000 leads, 1,000 voice minutes

### Messaging
- ✅ **Unlimited** messages (users connect own WhatsApp/Instagram)
- ✅ Zero platform cost (users pay Meta directly)
- ✅ 90%+ profit margin on subscriptions

---

## 🔧 After Setup

1. Click "Run" button
2. Check console for "✅ All migrations complete!"
3. Open your app URL
4. Sign in with Google
5. Start using features!

---

## 🚨 Troubleshooting

**"Migrations failing"**
→ Add PostgreSQL service or configure DATABASE_URL

**"OAuth not working"**
→ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

**"Payments not processing"**
→ Configure Stripe payment links in Secrets

**"AI responses not working"**
→ Add OPENAI_API_KEY to Secrets
