# Audnix AI - Production SaaS Platform

> **Enterprise-ready SaaS platform for autonomous AI follow-up automation across Instagram, WhatsApp, and Email with voice messaging, analytics, and Stripe billing.**

## 🚀 Features

### Core Platform
- **Multi-channel Communication**: Instagram DM, WhatsApp, Gmail integration
- **AI-Powered Replies**: OpenAI GPT-4 for intelligent message generation
- **Voice Messaging**: ElevenLabs voice cloning and synthesis
- **Real-time Analytics**: Comprehensive insights and performance tracking
- **Stripe Billing**: Subscriptions, usage tracking, and top-ups
- **Supabase Auth**: Google and Apple OAuth integration
- **Production Security**: AES-256-GCM encryption, RLS policies, secure token storage

### Complete Dashboard
- **Home**: Animated KPI cards, activity feed, quick actions
- **Inbox**: Table/card views, search, filters, bulk actions, trial limits
- **Conversations**: Unified chat, AI composer, timeline, voice messages
- **Deals**: Conversion board with value tracking
- **Calendar**: Google/Outlook sync, meeting management
- **Integrations**: OAuth setup for all channels, voice clone
- **Insights**: AI-generated summaries, charts, conversion funnel
- **Pricing**: Three tiers ($49/$99/$199), top-ups, FAQ
- **Settings**: Profile, security, team, webhooks, API keys
- **Admin**: Metrics, user stats, recent signups

## 📦 Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Wouter routing
- TanStack Query for state management
- Shadcn UI + Tailwind CSS
- Framer Motion animations
- Supabase for auth and realtime

### Backend
- Express.js + TypeScript
- Supabase PostgreSQL with pgvector
- OpenAI GPT-4 + embeddings
- Stripe billing and subscriptions
- ElevenLabs voice synthesis
- AES-256-GCM encryption

### Infrastructure
- Replit hosting and deployment
- Supabase database and auth
- Stripe payment processing
- Provider APIs: Instagram Graph API, WhatsApp Cloud API, Gmail API

## 🛠️ Setup Instructions

### 1. Install Dependencies

Replit handles this automatically when you run the project.

### 2. Configure Environment Variables

Set these in Replit Secrets (🔒 icon):

**Required:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_your-key
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Security
ENCRYPTION_KEY=your-64-char-hex-key
SESSION_SECRET=your-session-secret
```

**Optional (for full functionality):**
```env
# Voice
ELEVENLABS_API_KEY=your-elevenlabs-key

# WhatsApp
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_ID=your-phone-number-id

# Instagram
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

# Gmail/Outlook OAuth
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# Stripe Price IDs
STRIPE_PRICE_ID_MONTHLY_49=price_starter
STRIPE_PRICE_ID_MONTHLY_99=price_pro
STRIPE_PRICE_ID_MONTHLY_199=price_enterprise
STRIPE_PRICE_TOPUP_LEADS_1000=price_leads_1000
STRIPE_PRICE_TOPUP_LEADS_2500=price_leads_2500
STRIPE_PRICE_TOPUP_VOICE_100=price_voice_100
STRIPE_PRICE_TOPUP_VOICE_500=price_voice_500
```

### 3. Set Up Supabase Database

1. Go to your Supabase project SQL Editor
2. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run the complete migration from `migrations/002_audnix_schema.sql`
4. Verify all 18 tables were created successfully

### 4. Configure Stripe Products

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create subscription products:
   - **Starter**: $49/month → Copy Price ID to `STRIPE_PRICE_ID_MONTHLY_49`
   - **Pro**: $99/month → Copy Price ID to `STRIPE_PRICE_ID_MONTHLY_99`
   - **Enterprise**: $199/month → Copy Price ID to `STRIPE_PRICE_ID_MONTHLY_199`
3. Create top-up products (one-time payments):
   - 1000 leads @ $25
   - 2500 leads @ $50
   - 100 voice seconds @ $15
   - 500 voice seconds @ $60
4. Set up webhook endpoint in Stripe Dashboard:
   - URL: `https://your-app.replit.app/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. Configure OAuth Providers

**Supabase (Google & Apple):**
1. Go to Supabase Authentication → Providers
2. Enable Google and Apple OAuth
3. Add redirect URL: `https://your-app.replit.app/api/auth/callback`

**Instagram:**
1. Create Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Graph API product
3. Get Page access token and Page ID
4. Store credentials via Dashboard → Integrations

**WhatsApp:**
1. Create WhatsApp Business Account in Meta Business Suite
2. Get API token and phone number ID
3. Configure webhook URL: `https://your-app.replit.app/api/webhooks/whatsapp`

**Gmail:**
1. Create project in Google Cloud Console
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `https://your-app.replit.app/api/integrations/gmail/callback`

### 6. Run the Application

```bash
npm run dev
```

Server will start on port 5000. Visit `https://your-replit-url.replit.app`

## 📊 Database Schema

**18 Production Tables:**

| Table | Purpose |
|-------|---------|
| `users` | User accounts with Stripe subscription data |
| `admin_whitelist` | Admin access control |
| `integrations` | Encrypted provider credentials (Instagram, WhatsApp, Gmail) |
| `leads` | Contact/lead management with scoring |
| `messages` | Multi-channel conversation history |
| `followup_jobs` | Scheduled AI follow-up tasks |
| `automations` | User-defined automation rules |
| `uploads` | PDF/voice/CSV file ingestion tracking |
| `brand_embeddings` | pgvector brand knowledge base |
| `semantic_memory` | pgvector conversation context |
| `memory` | Key-value cache store |
| `usage_metrics` | Monthly aggregated usage stats |
| `usage_topups` | Top-up purchase records |
| `usage_purchases` | Stripe payment event log |
| `usage_logs` | Granular usage tracking |
| `auth_events` | Authentication audit trail |
| `api_keys` | API key management |
| `admin_metrics` | Platform-wide metrics |

All tables include:
- RLS (Row Level Security) policies
- Proper indexes for performance
- Foreign key relationships
- Timestamps for auditing

## 🔐 Security Features

- **Encryption**: AES-256-GCM for all provider tokens and sensitive data
- **RLS Policies**: Row-level security ensures users only access their own data
- **OAuth**: Secure authentication via Supabase with Google and Apple
- **Webhook Verification**: Stripe signature validation
- **API Keys**: Hashed storage with revocation support
- **Secret Management**: Replit Secrets for environment variables
- **HTTPS**: All API calls over secure connections

## 🎨 Design System

- **Theme**: Dark gradient (`#0a0f1f` → `#020409`)
- **Primary**: Electric Blue (`#00aaff`) - No purple allowed per requirements
- **Alternative**: Emerald Green (`#00c896`)
- **Typography**: Inter font family from Google Fonts
- **Effects**: Glassmorphism, subtle glow, smooth Framer Motion animations
- **Components**: Shadcn UI with custom theme overrides
- **Icons**: Lucide React + React Icons for company logos

## 📚 API Documentation

### Authentication
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/users` - Create or update user after auth
- `GET /api/health` - Health check

### Leads & Messages
- `GET /api/leads` - List leads with filtering (status, channel, search)
- `GET /api/leads/:id` - Get single lead details
- `PATCH /api/leads/:id` - Update lead information
- `GET /api/leads/:leadId/messages` - Get conversation history
- `POST /api/leads/:leadId/messages` - Send new message

### Integrations
- `GET /api/integrations` - List connected accounts
- `POST /api/integrations/:provider/connect` - Connect provider (encrypted storage)
- `POST /api/integrations/:provider/disconnect` - Disconnect provider

### Insights & Analytics
- `GET /api/insights/summary` - AI-generated performance insights
- `GET /api/insights/metrics` - Dashboard KPI data

### Billing (Stripe)
- `GET /api/billing/plans` - Available subscription plans
- `POST /api/billing/subscribe` - Create subscription (returns client secret)
- `POST /api/billing/topup` - Create top-up checkout session
- `POST /api/billing/webhook` - Stripe webhook handler (signature verified)

### Settings & Admin
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update user settings
- `GET /api/admin/metrics` - Platform metrics (admin only)

## 🧪 Demo Mode

Enable demo mode to test without external API calls:

```env
NEXT_PUBLIC_DEMO=true
DISABLE_EXTERNAL_API=true
```

This provides:
- Mock OpenAI responses
- Mock Stripe payments
- Simulated provider integrations
- No real charges or API consumption

## 🚀 Deployment

### Replit Deployment
1. Click "Publish" button in Replit
2. Configure custom domain (optional)
3. Set all production environment variables in Secrets
4. Enable auto-deployment from main branch

### Production Checklist
- [ ] All Supabase migrations run successfully
- [ ] Stripe products created and price IDs configured
- [ ] OAuth providers enabled and redirect URLs set
- [ ] Webhook endpoints configured in Stripe
- [ ] Environment variables set in production
- [ ] Database backups enabled in Supabase
- [ ] SSL/TLS certificates active
- [ ] Error monitoring configured

## 📖 Additional Documentation

- `design_guidelines.md` - Complete design specifications and component guidelines
- `migrations/002_audnix_schema.sql` - Full database schema with RLS policies
- `.env.example` - Environment variable reference with all options
- `replit.md` - Project overview, architecture, and user preferences

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server (starts Express + Vite)
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

## 📝 Project Structure

```
├── client/                     # Frontend React app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Shadcn UI primitives
│   │   │   └── dashboard/     # Dashboard-specific components
│   │   ├── pages/             # Page components
│   │   │   ├── landing.tsx    # Marketing landing page
│   │   │   ├── auth.tsx       # Authentication page
│   │   │   └── dashboard/     # Dashboard pages (10 pages)
│   │   ├── data/              # Demo data (leads, messages)
│   │   ├── lib/               # Utilities and configurations
│   │   ├── hooks/             # Custom React hooks
│   │   ├── index.css          # Global styles and design tokens
│   │   └── App.tsx            # Root application component
│   └── index.html
├── server/                     # Backend Express app
│   ├── lib/                   # Backend libraries
│   │   ├── ai/               # OpenAI integration
│   │   ├── billing/          # Stripe integration
│   │   ├── crypto/           # Encryption utilities
│   │   └── providers/        # Provider wrappers (Instagram, WhatsApp, etc.)
│   ├── routes.ts              # API route definitions
│   ├── storage.ts             # Storage interface (MemStorage/Supabase)
│   └── index.ts               # Server entry point
├── shared/                     # Shared TypeScript types
│   └── schema.ts              # Data models and Zod schemas
├── migrations/                 # Database migrations
│   └── 002_audnix_schema.sql
├── scripts/                    # Utility scripts
└── README.md
```

## 🐛 Troubleshooting

**OAuth not working?**
- Verify redirect URLs match in Supabase and your deployment URL
- Check OAuth providers are enabled in Supabase dashboard
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

**Stripe webhooks failing?**
- Verify webhook secret is correct
- Check webhook endpoint is publicly accessible
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:5000/api/billing/webhook`

**Provider integrations not connecting?**
- Check `ENCRYPTION_KEY` is set (used for token storage)
- Verify provider credentials are valid
- Check provider API rate limits

**Database errors?**
- Verify all migrations ran successfully in Supabase SQL Editor
- Check RLS policies are enabled
- Ensure service role key has proper permissions

## 📞 Support

For issues or questions:
1. Review documentation in `design_guidelines.md`
2. Check environment variables match `.env.example`
3. Verify database migrations completed
4. Check browser console and server logs
5. Test with demo mode enabled first

## 📄 License

Proprietary - All rights reserved © 2025 Audnix AI

---

**Built with ❤️ using Replit, Supabase, OpenAI, Stripe, and ElevenLabs**
