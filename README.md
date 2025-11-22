# 🚀 Audnix AI - Complete AI Sales Automation Platform

**Production-Ready SaaS** | **Multi-Channel Lead Management** | **Real-Time AI Automation**

> Last Updated: **November 22, 2025**

---

## 📋 Table of Contents

1. [Features Implemented](#features-implemented)
2. [Architecture](#architecture)
3. [API Reference](#api-reference)
4. [Admin System](#admin-system)
5. [Deployment](#deployment)
6. [Security & Compliance](#security--compliance)

---

## ✅ Features Implemented

### 🔐 Authentication & Admin System

**Email Authentication**
- ✅ Email/Password signup with secure bcryptjs hashing
- ✅ Direct login with session management
- ✅ **Admin whitelist enforcement**: 3 pre-configured admin emails
  - `canarylumen@gmail.com` (hardcoded)
  - `fortune@audnixai.com` (ADMIN_EMAIL_1)
  - `treasure@audnixai.com` (ADMIN_EMAIL_2)
- ✅ Only whitelisted emails automatically become admins
- ✅ Secure HTTP-only session cookies

**API Endpoints:**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout

### 📧 Email System - Multi-Provider Failover (PRODUCTION READY)

**Automatic provider fallback chain:**
1. **Resend** (primary) - Fastest, no setup needed
2. **Mailgun** - Industry-standard deliverability
3. **Custom SMTP** - User's own email server
4. **Gmail API** - Backup for Gmail users
5. **Outlook API** - Last resort for Outlook users

**Features:**
- ✅ Automatic failover if primary provider fails
- ✅ Premium OTP templates (dark-themed, branded, mobile-responsive)
- ✅ Plaintext fallback for clients without HTML support
- ✅ Multi-language support

**API Endpoints:**
- `POST /api/otp/send` - Send OTP via best available provider
- `POST /api/otp/verify` - Verify 6-digit code
- `POST /api/otp/resend` - Rate-limited resend (3x per 15 min)

**Configuration:**
```env
RESEND_API_KEY=re_xxxxx
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.audnixai.com
```

### 🎯 Campaign Automation - Real-Time (24/7 WORKERS ACTIVE)

**Multi-Channel Orchestration**
- ✅ **Day-aware sequences**: Different AI messages for Day 1, 2, 5, 7
- ✅ **Human-like timing**: 24h → 48h → Day 5 → Day 7 (NOT spam bot timing)
- ✅ **Multi-channel escalation**:
  - Day 1: Email
  - Day 1 + 24h: WhatsApp
  - Day 1 + 72h: Instagram DM
- ✅ **Intelligent fallback**: If channel blocked, tries next channel
- ✅ **Campaign-aware AI**: AI knows which day of campaign it is

**Workers Running 24/7:**
1. **Follow-up Worker** - Sends personalized day-aware messages
2. **Email Warm-up Worker** - Gradual sending ramp (Day 1: 30 → Day 10: 200+)
3. **Bounce Handler** - Tracks hard/soft bounces + spam
4. **Stripe Poller** - Validates plan-based rate limits
5. **Weekly Insights Worker** - Generates AI analytics
6. **Video Comment Monitor** - Auto-replies to comments

**Message Templates by Day:**
- **Day 1**: Initial intro + value prop
- **Day 2**: Light follow-up (social proof)
- **Day 5**: Problem-focused (urgency)
- **Day 7**: Final push (scarcity/FOMO)

### 📊 Email Infrastructure (PRODUCTION READY)

**Lead Import System**
- ✅ **Paged imports**: 100 emails at a time (prevents crashes)
- ✅ **Duplicate detection**: Auto-filters existing leads
- ✅ **Smart lead detection**: Removes transactional/newsletter emails
- ✅ **CSV + manual import support**

**SMTP Abuse Protection**
- ✅ **Plan-based rate limiting**:
  - Starter: 150 emails/hour
  - Pro: 200 emails/hour
  - Enterprise: 300 emails/hour
- ✅ **Automatic throttling**: Prevents IP blacklisting

**Email Warm-up Automation**
- ✅ **Gradual sending ramp**:
  - Day 1: 30 emails
  - Day 2: 50 emails
  - Day 3: 75 emails
  - ...
  - Day 10+: 200+ emails
- ✅ **Prevents spam flagging**: Warm-up before blast

**Bounce Management**
- ✅ **Hard bounces**: Removed from list (invalid emails)
- ✅ **Soft bounces**: Tracked + retried
- ✅ **Spam complaints**: Flagged + removed
- ✅ **Real-time stats**: View bounce rates per campaign

**API Endpoints:**
- `GET /api/email/bounces/stats` - Bounce rate analytics
- `GET /api/email/sending/limits` - Current rate limits
- `GET /api/email/warmup/status` - Warm-up progress
- `POST /api/email/import` - Import leads from CSV

### 📅 Google Calendar Integration (PRODUCTION READY)

**Calendar Booking System**
- ✅ **OAuth connection**: Users connect Google Calendar
- ✅ **Auto time slots**: Reads calendar, finds available slots
  - Business hours: 9 AM - 5 PM
  - Excludes weekends
  - Skips booked time
- ✅ **Smart booking**: Auto-creates events when lead accepts
- ✅ **Meeting links**: Auto-generates Google Meet links
- ✅ **Shareable calendar**: Public booking page (no auth needed)
- ✅ **No double-booking**: Prevents scheduling conflicts

**Message Templates:**
- **Email**: Professional booking invitation
- **WhatsApp**: Friendly calendar link (emojis)
- **Instagram**: Casual calendar share

**API Endpoints:**
- `GET /api/calendar/slots` - Get available time slots (14 days, business hours)
- `POST /api/calendar/send-link` - Generate shareable booking link
- `POST /api/calendar/book` - Book meeting when lead accepts
- `POST /api/calendar/format-message` - Format message for channel
- `GET /api/calendar/public/:userId` - Public booking page (no auth)

**Configuration:**
```env
GOOGLE_CALENDAR_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxxxxx
GOOGLE_CALENDAR_REDIRECT_URI=https://audnixai.com/api/oauth/google-calendar/callback
```

### 📊 Real-Time Dashboards

**User Dashboard Features**
- ✅ Real-time lead status updates
- ✅ Campaign progress (% by day)
- ✅ Multi-channel analytics
- ✅ Lead import & management
- ✅ Revenue tracking
- ✅ Integration status
- ✅ Plan usage (leads, voice minutes)

**Admin Dashboard Features**
- ✅ **User Management**: Search/view all users
- ✅ **Access Control**: Invite/revoke admin access
- ✅ **Plan Management**: Assign any plan to any user (no payment needed)
- ✅ **Real-time Analytics**:
  - Total users
  - Monthly recurring revenue (MRR)
  - Total leads
  - Messages sent
  - Conversion rates by channel
- ✅ **Lead Monitoring**: Browse all platform leads (read-only)
- ✅ **Revenue Tracking**: Daily/monthly charts
- ✅ **Team Whitelist**: Manage admin access

**Admin API Endpoints:**
- `GET /api/admin/metrics` - Real-time dashboard stats
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:id/assign-plan` - Change user plan
- `POST /api/admin/access/grant` - Grant admin access
- `POST /api/admin/access/revoke` - Revoke admin access

### 💳 Billing & Payments (SECURE - PRODUCTION READY)

**Stripe Integration (Payment Links - No API Keys in Code)**
- ✅ **Payment Links Only**: No sensitive API keys in code
- ✅ **Secure redirects**: Users sent to Stripe-hosted pages
- ✅ **Webhook verification**: All payments verified server-side
- ✅ **Zero cheating possible**: Payment links can't be modified
- ✅ **Plan-based rate limits**: Enforce after payment confirmed

**Plans:**
- **Starter**: $49.99/mo - 2,500 leads, 100 voice minutes
- **Pro**: $99.99/mo - 7,000 leads, 400 voice minutes
- **Enterprise**: $199.99/mo - 20,000 leads, 1,500 voice minutes

**Top-ups:**
- 100 voice minutes: $7.00
- 300 voice minutes: $20.00
- 600 voice minutes: $40.00
- 1,200 voice minutes: $80.00

**Security Guarantees:**
- ✅ Payment links generated in Stripe Dashboard (not in code)
- ✅ All payments verified via webhooks
- ✅ No way to bypass payment checks
- ✅ Rate limits enforced at database level
- ✅ Trial period tracked (3 days auto-set on signup)

**API Endpoints:**
- `POST /api/billing/checkout` - Redirect to Stripe
- `POST /api/billing/topup` - Topup voice minutes
- `GET /api/billing/subscription` - Current plan info
- `POST /api/billing/cancel` - Cancel subscription

**Configuration:**
```env
STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/xxxxx
STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/yyyyy
STRIPE_PAYMENT_LINK_ENTERPRISE=https://buy.stripe.com/zzzzz
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 🔗 Channel Integrations

**Email (Gmail + Outlook + Custom SMTP)**
- ✅ OAuth connection to Gmail and Outlook
- ✅ Custom SMTP support (business domains)
- ✅ Lead import from email
- ✅ Real-time inbox sync
- ✅ Branded email templates (PDF brand extraction)

**WhatsApp (Web + QR Code)**
- ✅ WhatsApp Web.js integration (QR code, no API needed)
- ✅ Auto-messaging to leads
- ✅ 24-hour messaging window compliance
- ✅ Template messaging support
- ✅ Media upload support

**Instagram (Meta Graph API)**
- ✅ Official Instagram Graph API (ToS compliant)
- ✅ Lead import from DMs
- ✅ Auto-reply to messages
- ✅ Story interactions (coming)

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Wouter (routing)
- Tailwind CSS (styling)
- Framer Motion (animations)
- TanStack Query (server state)
- Shadcn UI (components)

**Backend:**
- Express.js + TypeScript
- PostgreSQL (Neon)
- Drizzle ORM
- Google APIs
- Stripe SDK
- ElevenLabs (voice)

**Services:**
- Supabase (auth, real-time)
- Stripe (billing)
- OpenAI (GPT-4o-mini)
- ElevenLabs (voice cloning)
- Resend/Mailgun (email)

### Database Schema (16 Migrations)

**Core Tables:**
- `users` - User accounts, plans, trial status
- `leads` - Imported leads, status, scores
- `integrations` - OAuth tokens (encrypted)
- `campaigns` - Campaign configuration
- `messages` - Message history
- `analytics` - Real-time metrics
- `admin_whitelist` - Admin access control
- `otp_codes` - OTP tracking
- `oauth_accounts` - OAuth provider data

### Worker Processes

All workers run continuously in production:

```typescript
// Follow-up Worker (Every 5 minutes)
- Checks pending follow-ups
- Reads campaign day + lead context
- Generates day-aware AI message
- Selects next channel
- Sends via best available provider

// Email Warm-up Worker (Every 2 hours)
- Checks warm-up schedule
- Increments daily send limit
- Logs warm-up progress

// Bounce Handler (Every 10 minutes)
- Checks for bounces
- Classifies (hard/soft/spam)
- Updates lead status
- Sends notifications

// Weekly Insights (Every 7 days)
- Aggregates campaign stats
- Generates AI insights
- Sends PDF report

// Stripe Poller (Every 5 minutes)
- Checks payment status
- Updates plan assignments
- Enforces rate limits
```

---

## 📡 API Reference

### Authentication

```bash
# Signup
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

# OTP Send
POST /api/otp/send
{
  "email": "user@example.com"
}

# OTP Verify
POST /api/otp/verify
{
  "code": "123456",
  "email": "user@example.com"
}
```

### Calendar

```bash
# Get available slots
GET /api/calendar/slots?daysAhead=7&duration=30

# Send booking link
POST /api/calendar/send-link
{
  "leadEmail": "lead@example.com",
  "leadName": "John Lead",
  "duration": 30
}

# Book meeting
POST /api/calendar/book
{
  "leadEmail": "lead@example.com",
  "leadName": "John Lead",
  "startTime": "2025-11-24T10:00:00Z",
  "endTime": "2025-11-24T10:30:00Z"
}

# Format message
POST /api/calendar/format-message
{
  "leadName": "John",
  "bookingLink": "https://...",
  "channel": "whatsapp"
}

# Public booking page
GET /api/calendar/public/:userId
```

### Admin

```bash
# Get metrics (admins only)
GET /api/admin/metrics

# Assign plan (admins only)
POST /api/admin/users/:userId/assign-plan
{
  "plan": "pro"
}

# Grant admin access
POST /api/admin/access/grant
{
  "email": "newadmin@audnixai.com"
}

# Revoke admin access
POST /api/admin/access/revoke
{
  "email": "admin@audnixai.com"
}
```

---

## 🔐 Admin System

### Three Admin Emails (Hardcoded)

1. **canarylumen@gmail.com** - Primary founder
2. **fortune@audnixai.com** - Team admin 1
3. **treasure@audnixai.com** - Team admin 2

These emails automatically become admins on account creation.

### Admin Capabilities

- ✅ View all users and their activity
- ✅ Assign any plan to any user (no payment needed)
- ✅ Grant/revoke admin access to other emails
- ✅ View real-time analytics across platform
- ✅ Monitor all leads and campaigns
- ✅ View revenue data
- ✅ Export reports

### Admin Dashboard Location

- **Frontend**: `/dashboard/admin`
- **Backend**: `server/routes/admin-routes.ts`
- **Auth**: `requireAdmin` middleware

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel
vercel --prod

# 3. Set environment variables in Vercel Dashboard
# Database, Stripe, OpenAI, Google OAuth, etc.

# 4. Custom domain
vercel domains add audnixai.com
```

### Environment Variables (Required for Production)

```env
# Database
DATABASE_URL=postgresql://user:pass@neon.tech/db

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/...
STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/...
STRIPE_PAYMENT_LINK_ENTERPRISE=https://buy.stripe.com/...

# OpenAI
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o-mini

# Email
RESEND_API_KEY=re_xxxxx
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.audnixai.com

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALENDAR_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxxxx

# ElevenLabs
ELEVENLABS_API_KEY=sk_xxxxx

# Admin
ADMIN_EMAIL_1=fortune@audnixai.com
ADMIN_EMAIL_2=treasure@audnixai.com
```

---

## 🔒 Security & Compliance

### Encryption

- ✅ All OAuth tokens encrypted at rest (AES-256)
- ✅ Session secrets generated securely
- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ CSRF protection on all state-changing endpoints

### Payment Security

- ✅ **Zero payment keys in code** - Uses Stripe Payment Links
- ✅ **Webhook verification** - All payments server-verified
- ✅ **No cheating possible** - Links immutable once generated
- ✅ **Rate limit enforcement** - Database-level limits
- ✅ **Trial tracking** - Automatic 3-day trial on signup

### Data Privacy

- ✅ GDPR-compliant data handling
- ✅ User data encrypted in transit (HTTPS)
- ✅ Regular security audits
- ✅ No sensitive data in logs
- ✅ Admin access logged

### Compliance

- ✅ **Instagram**: Official Graph API (ToS compliant)
- ✅ **WhatsApp**: 24-hour window enforcement
- ✅ **Email**: SPF/DKIM/DMARC support
- ✅ **GDPR**: User data deletion support
- ✅ **CCPA**: Privacy policy compliance

---

## 📞 Support & Documentation

- **API Docs**: See `/docs` endpoint
- **Admin Guide**: See `ADMIN_DASHBOARD.md`
- **Deployment**: See `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Security**: See `SECURITY_IMPROVEMENTS.md`

---

## 🎯 What's Next?

- [ ] Calendly integration (alternative to Google Calendar - instant API, no verification)
- [ ] SMS automation (Twilio)
- [ ] LinkedIn message automation
- [ ] Advanced lead scoring
- [ ] A/B testing for messages
- [ ] Team collaboration features
- [ ] Custom workflow builder

---

**Last Updated**: November 22, 2025  
**Status**: ✅ Production Ready  
**All Systems**: ✅ Operational
