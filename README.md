# Audnix AI - Production-Ready AI Sales Automation Platform

**Multi-Channel Lead Management** | **Real-Time AI Automation** | **500+ Concurrent Users**

> Last Updated: **January 3, 2026** | **Status: Production Ready**

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5000
```

---

## Features

### Authentication System
- Email/Password signup with bcrypt hashing
- OTP verification via SendGrid (direct API)
- 7-day user sessions, 30-day admin sessions
- Admin whitelist enforcement (3 pre-configured emails)
- PostgreSQL session store (500+ concurrent users)

**Auth Flow:** Email → Password → OTP sent → OTP verify → Username → Dashboard

### Multi-Channel AI Sales Engine
- **Email**: SMTP/IMAP integration with bounce handling (primary channel)
- **WhatsApp**: Cloud API with voice notes
- **Instagram**: DM automation with comment monitoring

### AI Features
- **220+ objection handlers** (GPT-4 powered) across 7 categories
- **Intent analysis** - Buying signal detection
- **Day 1-7 email sequences** - Automated follow-ups with personalization
- **Re-engagement sequences** - Auto-follow-ups when ghosted (2-8 minute delays)
- **Context-aware responses** - Adapted to lead profile
- **Voice cloning** - Personal touch via ElevenLabs (paid feature only)
- **PDF brand learning** - Instant analysis of your company style

### Real-Time Analytics
- Live dashboard metrics (5-second refresh)
- Conversion funnel tracking
- Channel performance comparison
- AI learning status monitoring
- Deep insights - Real analytics from your activity

### Admin Dashboard
- User management with direct plan upgrades
- Payment approval workflow
- Real-time platform analytics
- Onboarding data tracking (roles, sources, business sizes)

---

## Pricing Tiers

| Plan | Price | Leads | Voice Minutes |
|------|-------|-------|---------------|
| Free | $0/mo | 100 | 10 |
| Trial | $0 (3 days) | 500 | 50 |
| Starter | $49.99/mo | 2,500 | 100 |
| Pro | $99.99/mo | 7,000 | 400 |
| Enterprise | $199.99/mo | 20,000 | 1,500 |

---

## Technical Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle
- **Sessions**: connect-pg-simple (persistent)
- **Email**: SendGrid API (direct HTTP)

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State**: TanStack Query
- **UI**: Radix UI + Tailwind CSS
- **Animations**: Framer Motion

### Integrations
- **AI**: OpenAI GPT-4
- **Voice**: ElevenLabs
- **Payments**: Stripe (payment links only)
- **Calendar**: Calendly
- **Real-time**: Supabase (optional)

---

## Environment Variables

### Required
```env
# Database
DATABASE_URL=postgres://...

# Authentication
SESSION_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Email (OTP)
TWILIO_SENDGRID_API_KEY=SG.xxxxx
TWILIO_EMAIL_FROM=auth@audnixai.com

# AI
OPENAI_API_KEY=sk-xxxxx
```

### Optional
```env
# Voice
ELEVENLABS_API_KEY=xxxxx

# Calendar
CALENDLY_API_KEY=xxxxx

# Payments
STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/xxxxx
STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/xxxxx
STRIPE_PAYMENT_LINK_ENTERPRISE=https://buy.stripe.com/xxxxx

# Admin
ADMIN_WHITELIST_EMAILS=email1@domain.com,email2@domain.com
VITE_ADMIN_SECRET_URL=/admin-secret-path
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Start signup (email)
- `POST /api/auth/register/password` - Set password
- `POST /api/auth/register/otp/send` - Send OTP
- `POST /api/auth/register/otp/verify` - Verify OTP
- `POST /api/auth/register/username` - Set username
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/stats` - Real-time metrics
- `GET /api/dashboard/activity` - Recent activity feed
- `GET /api/insights` - AI-generated analytics

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `POST /api/leads/import` - Bulk CSV import
- `PUT /api/leads/:id` - Update lead

### Objections
- `GET /api/objections` - List objections with filters
- `POST /api/objections` - Create custom objection
- `POST /api/objections/:id/copy` - Track copy usage

### Admin
- `GET /api/admin/metrics` - Platform stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users/:id/upgrade` - Direct plan upgrade

---

## Workers (24/7 Active)

1. **Follow-up Worker** - Automated lead follow-ups
2. **Email Sync Worker** - 5-minute mailbox sync
3. **Email Warmup Worker** - Gradual sending ramp
4. **Video Comment Monitor** - Instagram replies
5. **Weekly Insights Worker** - AI analytics generation
6. **OAuth Token Refresh** - Keep integrations alive

---

## Deployment

### Replit (Recommended)
1. Click "Publish" in Replit
2. All secrets auto-transfer
3. Choose Autoscale or Reserved VM

### Vercel
1. Import repository
2. Add all environment variables manually
3. Deploy

---

## Security

- bcrypt password hashing
- HTTP-only session cookies
- CSRF protection via helmet
- Rate limiting (memory or Redis)
- Input sanitization
- No API keys in client code

---

## Support

For issues or questions, contact the development team.

---

Built with precision for creators, coaches, agencies, and founders.

© 2026 Audnix AI. All rights reserved.
