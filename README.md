# 🚀 Audnix AI - AI-Powered CRM for Multi-Channel Lead Management

> **Production-Ready SaaS Platform** - AI follow-up automation across Instagram, WhatsApp, Gmail, and more. Full-stack application with real database integration, authentication, and analytics.

## 💰 Business & Profit Analysis

### Revenue Model

**Subscription Plans (Optimized for 90%+ Margins):**
- **Starter**: $49.99/mo - 2,500 leads, **100 voice minutes** (~1.5 hours)
- **Pro**: $99.99/mo - 7,000 leads, **400 voice minutes** (~6.5 hours)
- **Enterprise**: $199.99/mo - 20,000 leads, **1,000 voice minutes** (~16+ hours)

**Top-ups (85%+ Profit Margin):**
- 100 voice minutes: $7.00
- 300 voice minutes: $20.00
- 600 voice minutes: $40.00
- 1,200 voice minutes: $80.00

### Cost Breakdown Per User (Monthly)

**Voice Costs (ElevenLabs at $0.01/minute):**
- Starter: 100 minutes = **$1.00**
- Pro: 400 minutes = **$4.00**
- Enterprise: 1,000 minutes = **$10.00**

**AI Processing (OpenAI GPT-4):**
- Cost per message: ~$0.001 (using GPT-4o-mini)
- Starter (2,500 messages): $2.50
- Pro (7,000 messages): $7.00
- Enterprise (20,000 messages): $20.00

**Infrastructure (Per User):**
- Database + Storage + API: **$0.50/user**

**Messaging Costs:**
- **WhatsApp via Twilio**: $0 (users connect their own accounts and pay Twilio directly)
- **Instagram**: $0 (free via Graph API)
- **Platform messaging cost**: **$0** 🎉

**Total Cost Per User:**
- Starter: **$4.00** (Voice: $1 + AI: $2.50 + Infra: $0.50 + Messaging: $0)
- Pro: **$11.50** (Voice: $4 + AI: $7 + Infra: $0.50 + Messaging: $0)
- Enterprise: **$30.50** (Voice: $10 + AI: $20 + Infra: $0.50 + Messaging: $0)

### Profit Margins (Industry-Leading)

**Monthly Subscriptions:**
- Starter: $49.99 revenue - $4.00 cost = **$45.99 profit (92% margin)** 🚀
- Pro: $99.99 revenue - $11.50 cost = **$88.49 profit (88% margin)** 🚀
- Enterprise: $199.99 revenue - $30.50 cost = **$169.49 profit (85% margin)** 🚀

**Top-ups (at $0.01/min voice cost):**
- 100 voice minutes: $7 revenue - $1 cost = **$6 profit (86% margin)**
- 300 voice minutes: $20 revenue - $3 cost = **$17 profit (85% margin)**
- 600 voice minutes: $40 revenue - $6 cost = **$34 profit (85% margin)**
- 1,200 voice minutes: $80 revenue - $12 cost = **$68 profit (85% margin)**

### Break-Even & Growth

**Fixed Costs (Monthly):**
- Hosting (Render/Railway): $7-20
- Database (Supabase Pro): $25 (scales to 10,000 users)
- Domain + SSL: $2
- Total fixed: **~$35-50/mo**

**Break-Even Point:**
- 1 Starter subscriber = $38.49 profit > $50 fixed costs
- **2 users = profitable** ✅

**Growth Projections (Conservative Mix):**
- 10 users: ~$750/mo revenue, $80 costs = **$670/mo profit (89% margin)**
- 100 users: ~$7,500/mo revenue, $800 costs = **$6,700/mo profit (89% margin)**
- 1,000 users: ~$75,000/mo revenue, $8,000 costs = **$67,000/mo profit (89% margin)**

**Key Differentiators:**
- **Zero messaging costs** - Users connect their own Twilio accounts
- **WhatsApp**: Users pay Twilio directly (~$0.005/msg)
- **Instagram**: Free via Graph API
- **Platform profit**: 100% margin on message delivery 🎉

**Average Revenue Per User (ARPU):** $75/mo (base plans only)
**Lifetime Value (LTV):** $900 (12-month retention)
**Customer Acquisition Cost (CAC) Target:** <$90 (10:1 LTV:CAC ratio)

## ✨ Features

### For Paid Users Only
- **Video Comment Automation**: Monitor Instagram Reels for buying intent and auto-respond with AI DMs
- **AI Voice Notes**: Send personalized voice messages to warm leads (Instagram & WhatsApp text-based)
- **Advanced Multi-Channel Support**: Full access to Instagram DMs, WhatsApp messages, and emails

### All Plans
- **AI-Powered Responses**: Automatically respond to leads with context-aware, personalized messages

**Legend:** ✅ = Works out-of-box | ⚙️ = Requires API keys/setup (code complete)

## 🎯 Current Status: Production-Ready MVP v1.0

**Last Updated:** October 30, 2025

This is a fully functional SaaS platform with complete authentication, database, pricing, and feature gating. Ready for production deployment and real users.

**✨ New Features (October 2025):**
- **Developer Mode**: Access dashboard without API keys for development
- **Optimized Pricing**: 90%+ profit margins on subscriptions
- **Twilio WhatsApp**: Users connect their own accounts (zero platform costs)
- **AI Comment Detection**: Smart intent analysis (not just keywords)
- **Security**: Removed all exposed secrets, added encryption
- **Real-time Updates**: Supabase integration for live data

### ✅ Core System (Works Immediately)

- **Frontend** - All 10 pages built with real-time data display
- **Backend** - RESTful API with Express.js
- **Database** - PostgreSQL with Drizzle ORM (persistent on Replit/deployed hosts)
- **Session Management** - PostgreSQL-backed sessions configured
- **Analytics** - Beautiful charts that work with any data (AI insights gracefully degrade)
- **API Routes** - All endpoints implemented

### ⚙️ Requires Supabase Setup (15 minutes)

**Without Supabase, you can still:**
- View all dashboard pages
- See how the UI works
- Test locally with in-memory storage

**With Supabase configured:**
- **Authentication** - OAuth login (Google, Apple) works
- **Data Persistence** - All data saved to Supabase PostgreSQL
- **User Management** - Multi-user support
- **Background Jobs** - Automated follow-up worker

**Setup:** [DEPLOYMENT.md](./DEPLOYMENT.md) has step-by-step Supabase instructions

### 🔌 Add API Keys = Instant Feature Unlock

These work **immediately** when you add keys (no code changes needed):

- **OpenAI** (`OPENAI_API_KEY`) → AI-generated insights, automated messages
  - Without key: Shows generic insights, everything else works fine
- **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_*`) → API-based subscription management
  - Without key: Pricing page displays, checkout redirects to demo mode
- **ElevenLabs** (`ELEVENLABS_API_KEY`) → Voice cloning for messages
  - Without key: Voice features disabled

### 🚧 Requires OAuth Provider Setup (Code Complete)

OAuth flows are **fully implemented**. You just need to register apps with providers:

1. **Google (Calendar + Gmail)** - Register at Google Cloud Console
2. **Instagram** - Create Meta app for Instagram API
3. **WhatsApp** - Users connect via Twilio (SaaS-ready)
4. **Outlook** - Register at Azure Portal

**Time:** ~30 minutes per provider | **Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📊 Analytics & Insights

**NEW: Beautiful Analytics Dashboard with Recharts**

- 📈 **Pie Charts** - Lead distribution by channel
- 📊 **Bar Charts** - Lead volume comparison
- 📉 **Line Charts** - 7-day trend analysis
- 🎯 **Conversion Funnel** - Visual sales pipeline
- 🤖 **AI-Generated Insights** - OpenAI analyzes your data and provides actionable insights
- ⚡ **Real-Time Updates** - Auto-refresh every 60 seconds

## 🗄️ Database

- **Type:** PostgreSQL (via Drizzle ORM)
- **Tables:** 18 production-ready tables with proper relationships
- **Storage:** Persistent (data survives restarts)
- **Migrations:** SQL migration files included
- **Hosting:** Works with Replit PostgreSQL, Supabase, or any PostgreSQL database

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching with caching
- **Shadcn UI** + Tailwind CSS - Beautiful component library
- **Recharts** - Data visualization
- **Framer Motion** - Smooth animations

### Backend
- **Express.js** + TypeScript
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Production database
- **Supabase** - Authentication provider
- **OpenAI** - AI message generation and insights
- **Stripe** - Payment processing
- **Google APIs** - Calendar, Gmail integration

## 🚀 Quick Start (100% Automated)

### 1. Add Supabase Credentials to Replit Secrets

Go to **Secrets** (🔒 icon) and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Get these from: https://supabase.com → Your Project → Settings → API

### 2. Add API Keys

```bash
# Recommended - Get from https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Recommended - Get from https://platform.openai.com
OPENAI_API_KEY=sk-your_openai_key

# Recommended - Get from https://stripe.com
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# Optional - For WhatsApp voice messages via Twilio (Free tier available)
# Get from https://console.twilio.com
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Set Up Database

Run migrations in your Supabase SQL editor:

```bash
# Copy and run the contents of:
migrations/002_audnix_schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Server starts on `http://localhost:5000`

### 5. Test It Out

- Visit `http://localhost:5000` - See landing page
- Click "Start Free Trial" - OAuth login works
- Navigate to Dashboard - All pages functional
- Add test leads - See analytics update in real-time

## 📦 What's Included

### Complete UI (All Pages Working)

1. **Landing Page** - Marketing site with animations, pricing, live user counter
2. **Dashboard Home** - KPIs, activity feed, quick actions
3. **Inbox** - Lead management with filtering and search
4. **Conversations** - Real-time chat interface (ready for provider integration)
5. **Deals** - Sales pipeline with drag-and-drop (UI complete)
6. **Calendar** - Event scheduling with Google Calendar integration
7. **Integrations** - OAuth connection management for all providers
8. **Insights** - Analytics dashboard with charts and AI insights
9. **Pricing** - Subscription plan management
10. **Settings** - User preferences and profile management
11. **Admin** - Admin panel for user management

### Backend Features

- ✅ **RESTful API** - All CRUD endpoints implemented
- ✅ **Authentication** - Supabase OAuth with session management
- ✅ **Authorization** - Role-based access control (admin, member)
- ✅ **Database** - PostgreSQL with Drizzle ORM
- ✅ **Encryption** - AES-256-GCM for sensitive data
- ✅ **File Uploads** - Voice samples and PDF processing
- ✅ **Webhooks** - Stripe payment webhooks
- ✅ **Background Jobs** - Follow-up worker for automation
- ✅ **Comment DM Automation** - AI-powered detection and follow-up (replaces ManyChat)

### Libraries & Integrations

- ✅ **OpenAI Wrapper** - Chat, embeddings, classification
- ✅ **Stripe Wrapper** - Subscriptions, one-time payments, webhooks
- ✅ **OAuth Implementations** - Instagram, WhatsApp, Gmail, Outlook, Google Calendar
- ✅ **Encryption Library** - Secure token storage
- ✅ **Calendar API** - Google Calendar event creation and management
- ✅ **Voice Cloning** - ElevenLabs integration ready

## 🌐 Deployment

### Recommended: Render.com (Free Tier Perfect for 500+ Users)

```bash
# One command deploy:
render deploy
```

Or use the Deploy to Render button (see [DEPLOYMENT.md](./DEPLOYMENT.md))

**Free Tier Includes:**
- 512 MB RAM
- 1 GB PostgreSQL
- Auto SSL
- Git-based deploys
- Perfect for starting out!

**See full deployment guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

### Also Supports:
- **Railway.app** - $5 free credit
- **Vercel** - (Requires serverless adapter)
- **Replit** - Already configured (you're here!)

## 🔑 API Keys You'll Need

### Tier 1: Critical (App Won't Work Without)

1. **Supabase** - Database and auth (https://supabase.com)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Secrets** - Generate with crypto
   - `SESSION_SECRET`
   - `ENCRYPTION_KEY`

### Tier 2: Important (Enable Core Features)

3. **OpenAI** - AI features (https://platform.openai.com/api-keys)
   - `OPENAI_API_KEY`

4. **Stripe** - Billing (https://dashboard.stripe.com/apikeys)
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`

### Tier 3: Optional (Enable Specific Integrations)

5. **Google** (Calendar, Gmail) - https://console.cloud.google.com
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

6. **Instagram** - https://developers.facebook.com
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`

7. **WhatsApp** - https://developers.facebook.com
   - `WHATSAPP_APP_ID`
   - `WHATSAPP_APP_SECRET`
   - `WHATSAPP_TOKEN`

8. **ElevenLabs** (Voice) - https://elevenlabs.io
   - `ELEVENLABS_API_KEY`

**See `.env.example` for complete list with setup instructions**

## 📈 Scaling Path

### Free Tier → 500 Users
- **Cost:** $0/month
- **Where:** Render.com free tier
- **Database:** 1GB PostgreSQL
- **RAM:** 512MB
- **Perfect for:** MVP, testing, first customers

### Starter → 2000 Users
- **Cost:** $14/month ($7 web + $7 database)
- **Where:** Render.com starter tier
- **Database:** 1GB PostgreSQL
- **RAM:** 512MB (always-on, no sleep)

### Standard → 10000+ Users
- **Cost:** $45/month ($25 web + $20 database)
- **Where:** Render.com standard tier
- **Database:** 10GB PostgreSQL
- **RAM:** 2GB

## 🤖 AI-Powered Comment Automation

**NEW: Intelligent DM Follow-Up System (No ManyChat Required)**

Instead of using expensive third-party tools like ManyChat, Audnix AI includes built-in comment automation:

### How It Works

1. **Smart Comment Detection** - AI analyzes comments to detect DM intent:
   - "Link" or "link please"
   - "DM me" 
   - "Interested"
   - Single word responses to "comment X for [something]"

2. **Personalized Initial DM** - AI generates custom first message:
   - Uses their username naturally
   - References what they asked for (link, info, offer, product)
   - Creates urgency for offers ("limited spots", "early access")
   - Sounds human, not robotic

3. **6-Hour Smart Follow-Up** - Automatic reminder if they:
   - Never opened the message
   - Opened but didn't click the link
   - Engaged but didn't take action

### Example Flow

```
User comments: "Link"
↓
AI detects DM intent (95% confidence)
↓
Immediate DM: "Hey Sarah! Thanks for your interest. Here's the AI tool I mentioned: [link]"
↓
6 hours later (if unopened): "Hey Sarah, did you manage to check out the AI tool I sent a few hours ago? This might be your last chance for early access!"
```

### Voice Minutes System ✅ FULLY IMPLEMENTED

**Real-Time Usage Tracking:**
- ✅ Live dashboard widget shows usage progress
- ✅ Automatic locking when balance reaches 0
- ✅ Real-time updates via API polling (30s interval)
- ✅ Visual progress bar with percentage indicator
- ✅ Actual minute deduction on voice generation
- ✅ PostgreSQL audit trail for all usage

**Plans now include voice minutes:**
- Starter ($49/mo): 300 minutes (5 hours)
- Pro ($99/mo): 800 minutes (13+ hours)  
- Enterprise ($199/mo): 1000 minutes (16+ hours)

**Auto-Lock System:**
When voice minutes are exhausted:
- ✅ All voice features lock automatically
- ✅ Lock modal displays: "🔒 All voice minutes used"
- ✅ "Top Up Now" button redirects to pricing page
- ✅ Real-time balance updates prevent overuse

**Instant Top-Up System:**
- 100 minutes - $7 (Quick Boost) - 86% margin
- 300 minutes - $20 (Best Value) - 85% margin  
- 600 minutes - $40 (Popular) - 85% margin
- 1200 minutes - $80 (Power User) - 85% margin

**Technical Implementation:**
- ✅ Stripe API integration for one-time payments
- ✅ Webhook-based balance updates (instant sync)
- ✅ In-app notifications for successful top-ups
- ✅ PostgreSQL tracking for usage history
- ✅ API endpoint: `GET /api/voice/balance`
- ✅ Middleware checks before voice generation

**Revenue Features:**
- All top-ups maintain ≥85% profit margin
- Automatic revenue tracking per user
- Deal conversion tracking with USD amounts
- Monthly/total revenue analytics in admin panel

### Video Comment Automation (Replaces ManyChat)

**Monitor Instagram videos 24/7 for buying signals:**
1. Select which videos AI should monitor
2. Set product link and CTA button text
3. AI reads every comment in real-time
4. Detects buying intent automatically
5. Sends personalized DM like a real salesperson

**Example Flow:**
```
Comment: "link please"
↓
AI detects: High buying intent (95% confidence)
↓
Sends DM: "Hey Sarah I noticed you showed interest in my post while scrolling. 
I think this could be exactly what you need right now..."
[Get it here →] (clickable button with your custom link)
↓
If converted: "Sarah, I'd love to stay connected! Do you mind following me on Instagram 
so we can keep each other updated?"
[Follow Now →] (clickable follow button)
```

**Professional Follow Requests:**
- **Converted leads**: "I'd love to stay connected! Do you mind following me on Instagram so we can keep each other updated?"
- **Not interested**: "No worries! Would you mind following me anyway? I share valuable content regularly."
- **Brands**: "I'd love to stay connected with your brand. Would you mind following me so we can collaborate in the future?"
- **Warm leads** (after 3+ exchanges): Polite, professional ask to stay connected

**Voice Minutes Optimization:**
- Warm leads get 2x 15-second voice notes (30 seconds total per lead)
- First note sent immediately, second after 2 hours
- Maintains profitability while maximizing engagement
- Works across Instagram and WhatsApp

**Handles difficult situations maturely:**
- Price objections → Emotional value selling
- Inappropriate comments → Professional de-escalation  
- Spam → Ignores automatically
- Genuine questions → Answers with brand knowledge

### API Endpoints

- `POST /api/automation/comment` - Process comment and trigger automation
- `POST /api/automation/analyze-comment` - Test if comment needs DM
- `GET /api/video-automation/videos` - Get user's Instagram videos
- `POST /api/video-automation/monitors` - Set up video monitoring
- `GET /api/video-automation/monitors` - Get all active monitors
- `POST /api/video-automation/test-intent` - Test comment intent detection

### Benefits vs ManyChat

- ✅ **$0 cost** - No monthly subscription or API fees ($297/year saved)
- ✅ **More intelligent** - AI understands context, sarcasm, objections
- ✅ **Personalized** - Every message sounds like a real human
- ✅ **Handles objections** - Closes deals through value-based selling
- ✅ **Multi-channel** - Works on Instagram, WhatsApp, and email
- ✅ **Real-time** - Monitors 24/7, responds within seconds
- ✅ **Learning AI** - Gets smarter from every conversation

## 🧪 Testing

### What Works Now

- [x] User registration and login
- [x] Dashboard navigation
- [x] Lead creation and management
- [x] Analytics with real data
- [x] Real-time insights generation
- [x] Session persistence
- [x] Database CRUD operations

### Integration Status

| Integration | OAuth Flow | API Wrapper | Status |
|------------|------------|-------------|--------|
| Google Calendar | ✅ | ✅ | Add API keys → Works |
| Gmail | ✅ | ✅ | Add API keys → Works |
| OpenAI | N/A | ✅ | Add API key → Works |
| Stripe | N/A | ✅ | Add API key → Works |
| Instagram | ✅ | ✅ | Needs Meta app setup |
| WhatsApp | ✅ | ✅ | Users connect via Twilio (SaaS-ready) |
| Outlook | ✅ | ✅ | Needs Azure app setup |
| ElevenLabs | N/A | ✅ | Add API key → Works |

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide with OAuth setup
- [.env.example](./.env.example) - All environment variables explained
- [design_guidelines.md](./design_guidelines.md) - UI/UX specifications
- [migrations/](./migrations/) - Database schema and migrations

## 💰 Monetization & Pricing

**Subscription Plans (Voice Minutes Included):**
- **Starter** - $49.99/month
  - 2,500 leads per month
  - **300 voice minutes** (5 hours of AI voice notes)
  - Instagram & WhatsApp integration

- **Pro** - $99.99/month - **Most Popular**
  - 7,000 leads per month  
  - **800 voice minutes** (13+ hours of AI voice notes)
  - All integrations + advanced features

- **Enterprise** - $199.99/month
  - 20,000 leads per month
  - **1,000 voice minutes** (16+ hours of AI voice notes)
  - Unlimited power + dedicated support

**Voice Minute Top-Ups (85%+ Profit Margin):**
Once your included voice minutes are exhausted, voice features lock automatically. Users can instantly unlock them with one-time top-up purchases:

- **100 minutes** - $7 (1.5+ hours) - Quick boost
- **300 minutes** - $20 (5 hours) - Best Value
- **600 minutes** - $40 (10 hours) - Popular
- **1,200 minutes** - $80 (20 hours) - Power user

*Pricing guarantees ≥85% margin at $0.01/min ElevenLabs cost. Verify cost basis before production.*

All top-ups sync in real-time via Stripe webhooks. Balance updates instantly and users get a notification confirming the purchase.

**Free Trial:**
- **Duration:** 3 days (automatically set when user signs up)
- **Features:** Limited access (0 voice minutes, basic features only)
- **After Trial:** Users are prompted to upgrade with a full-screen overlay
- **Upgrade Flow:** Clicking "Upgrade Plan" takes users to `/dashboard/pricing` where they can choose a plan
- **Real-Time Unlocking:** Features unlock immediately upon successful payment via Stripe webhook

**Feature Gating & Voice Locking:**
- ✅ Voice features lock when balance reaches 0 minutes
- ✅ Lock modal displays with "Top Up Now" call-to-action
- ✅ Live usage tracking via progress bar (real-time updates)
- ✅ Lead limits enforced per plan tier
- ✅ Middleware checks subscription status on protected routes
- ✅ Automatic lockout when trial expires with upgrade prompt
- ✅ Stripe API integration via Checkout Sessions (no payment links)

**Payment Processing:**
- Secure HTTP-only cookie-based sessions with SameSite=strict
- Stripe API-based Checkout Sessions for both subscriptions and top-ups
- Real-time plan upgrades and balance updates via webhook integration
- Automatic feature unlocking upon payment confirmation
- In-app notifications for successful top-up purchases

## 🔒 Security

- ✅ AES-256-GCM encryption for sensitive data
- ✅ Session-based authentication
- ✅ Supabase Row Level Security policies
- ✅ Input validation with Zod
- ✅ CSRF protection
- ✅ Secure password-less OAuth flows
- ✅ Environment variable isolation

## 🎨 Design

- **Theme:** Premium dark gradient with cyan/purple/pink accents
- **Primary Colors:** Vibrant cyan (`#00c8ff`), purple (`#9333ea`), pink (`#ec4899`)
- **Typography:** Inter font with bold gradients
- **Effects:** Advanced glassmorphism, smooth animations, glow effects
- **UI Style:** Creator-focused, energetic, modern
- **Mobile:** Fully responsive
- **Dashboard:** Bright white text, vibrant KPI cards with percentage indicators and trend arrows

## 🤝 Contributing

This is a production SaaS application. For questions or issues:

1. Check logs first (`/api/health` endpoint)
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Verify environment variables are set correctly

## 📝 License

Proprietary - All rights reserved © 2025 Audnix AI

---

## 🚦 Next Steps

1. **Add your API keys** to `.env` (see `.env.example`)
2. **Deploy to Render.com** (free tier, 5 minutes)
3. **Set up one integration** (start with Google Calendar - easiest)
4. **Test with real leads** and watch analytics update
5. **Scale up** as you get users

**Questions?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides.

---

**Built with React, Express, PostgreSQL, Supabase, OpenAI, and Stripe** | **Ready to deploy in minutes** 🚀