# Audnix AI - SaaS Landing Page MVP

## Project Overview

Audnix AI is a premium SaaS landing page with real-time features, Supabase authentication, and beautiful glassmorphism UI. The application provides a conversion-focused landing experience with live social proof, OAuth authentication, and a dashboard placeholder.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom dark gradient theme
- **Animations**: Framer Motion for smooth, professional animations
- **State Management**: TanStack Query for server state
- **UI Components**: Shadcn UI library with custom modifications

### Backend
- **Server**: Express.js with TypeScript
- **Storage**: In-memory storage (MemStorage) for development
- **Authentication**: Supabase OAuth (Google & Apple)
- **Real-time**: Supabase Realtime for live counter updates

## Key Features

1. **Landing Page**
   - Hero section with animated text glow effects
   - Features grid showcasing key capabilities
   - Comparison table with competitors
   - Real-time "People Joined" counter
   - Responsive design with glassmorphism effects

2. **Authentication**
   - Google OAuth integration via Supabase
   - Apple OAuth integration via Supabase
   - Automatic 3-day trial setup
   - Graceful demo mode fallback

3. **Complete Dashboard**
   - **Dashboard Home**: 4 animated KPI cards (leads, messages, AI voice replies, conversion rate), activity feed, quick actions
   - **Inbox**: Table/card views, search, channel & status filters, bulk selection, trial limit enforcement
   - **Conversations**: Merged chat view with AI composer, typewriter effect, voice messages, timeline
   - **Deals**: Conversion board with deal cards, value tracking
   - **Calendar**: Meeting sync (Google/Outlook), upcoming events, join links
   - **Integrations**: Instagram/WhatsApp/Email OAuth, voice clone setup with consent
   - **Insights**: AI-generated summaries, channel performance charts, conversion funnel
   - **Pricing**: Three tiers (Starter $49, Pro $99, Enterprise $199), FAQ section
   - **Settings**: Profile, security, team management, webhooks, API keys
   - **Admin**: Metrics dashboard, user stats, recent signups

4. **Real-time Features**
   - Live user counter updates via Supabase Realtime
   - Toast notifications for new signups
   - Demo mode with simulated joins (30-90 second intervals)

## Environment Variables

Required secrets (set in Replit Secrets):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `NEXT_PUBLIC_DEMO` - Set to "true" for demo mode testing

## Database Schema

```sql
users (
  id: UUID (primary key)
  supabase_id: TEXT (unique)
  email: TEXT (required)
  name: TEXT
  username: TEXT
  plan: TEXT (default: 'trial')
  trial_expires_at: TIMESTAMPTZ
  created_at: TIMESTAMPTZ (auto)
  last_login: TIMESTAMPTZ
)
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/users/count` - Get total user count
- `POST /api/webhook/demo` - Create demo users (testing only)
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/users` - Create or update user after auth

## Design System

### Colors
- **Background**: Dark gradient (#0a0f1f → #020409)
- **Primary**: Electric Blue (#00aaff)
- **Accent**: Emerald Green (optional alternative)
- **Text**: White at 85% opacity for body text

### Typography
- **Font**: Inter (Google Fonts)
- **Hierarchy**: Bold headlines with glow effects, medium weight body text

### Effects
- **Glassmorphism**: Backdrop blur with subtle transparency
- **Glow**: Soft box-shadow on primary elements
- **Animations**: Framer Motion for entrance and interaction states

## File Structure

```
├── client/
│   ├── src/
│   │   ├── components/ui/     # Shadcn UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and configurations
│   │   │   ├── supabase.ts   # Supabase client setup
│   │   │   ├── queryClient.ts # TanStack Query config
│   │   │   └── utils.ts       # Helper functions
│   │   ├── pages/             # Page components
│   │   │   ├── landing.tsx         # Main landing page
│   │   │   ├── auth.tsx            # Authentication page
│   │   │   ├── dashboard/          # Dashboard pages
│   │   │   │   ├── index.tsx      # Dashboard router
│   │   │   │   ├── home.tsx       # Dashboard home
│   │   │   │   ├── inbox.tsx      # Lead inbox
│   │   │   │   ├── conversations.tsx  # Chat interface
│   │   │   │   ├── deals.tsx      # Deals & conversions
│   │   │   │   ├── calendar.tsx   # Calendar sync
│   │   │   │   ├── integrations.tsx   # Channel integrations
│   │   │   │   ├── insights.tsx   # Analytics
│   │   │   │   ├── pricing.tsx    # Pricing plans
│   │   │   │   ├── settings.tsx   # Settings
│   │   │   │   └── admin.tsx      # Admin panel
│   │   │   └── not-found.tsx       # 404 page
│   │   ├── components/
│   │   │   └── dashboard/
│   │   │       └── DashboardLayout.tsx  # Dashboard layout with sidebar
│   │   ├── data/                   # Demo data
│   │   │   ├── demo-leads.json    # Sample leads
│   │   │   └── demo-messages.json # Sample messages
│   │   ├── App.tsx           # Root app component
│   │   ├── index.css         # Global styles & design tokens
│   │   └── main.tsx          # Entry point
│   └── index.html            # HTML template
├── server/
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Storage interface & implementation
│   ├── index.ts              # Server entry point
│   └── vite.ts               # Vite dev server integration
├── shared/
│   └── schema.ts             # Shared TypeScript types
├── migrations/
│   └── 001_create_users.sql # Database migration
├── scripts/
│   └── seed_demo.ts          # Demo user seeding script
├── design_guidelines.md      # Comprehensive design specs
└── README.md                 # Setup and deployment guide
```

## Development Workflow

1. **Local Development**:
   ```bash
   npm run dev
   ```
   Server starts on port 5000

2. **Demo Mode**:
   Set `NEXT_PUBLIC_DEMO=true` to test without Supabase

3. **Database Migrations**:
   Run SQL in Supabase SQL Editor from `migrations/001_create_users.sql`

4. **Testing**:
   - Landing page: Verify animations and counter
   - Auth flow: Test Google/Apple OAuth
   - Real-time: Open multiple tabs to see live updates

## Recent Changes

**January 22, 2025 - Complete Dashboard Implementation**
- Built 10 fully functional dashboard pages with comprehensive features
- Created Dashboard Home with animated KPI cards and activity feed
- Implemented Inbox with table/card toggle, search, filters, and trial enforcement
- Added Conversations page with AI composer and typewriter effects
- Built Deals, Calendar, Integrations, Insights, Pricing, Settings, and Admin pages
- Created collapsible sidebar layout with mobile-responsive bottom navigation
- Added demo data system with 8 sample leads and conversation history
- All features tested and working correctly

**Initial Implementation**
- Implemented complete landing page with Framer Motion animations
- Added Google & Apple OAuth via Supabase
- Configured dark gradient theme with electric blue accents
- Set up real-time counter with Supabase Realtime
- Created demo mode for testing without Supabase
- Added comprehensive documentation and README

## Production Deployment

### Quick Start (5 Minutes)

1. **Set up Supabase** (see `docs/SUPABASE_SETUP.md`)
   - Create free Supabase project
   - Run migrations from `migrations/` folder
   - Add credentials to Replit Secrets

2. **Configure OAuth** (see `.env.example`)
   - Set up Supabase Auth providers (Google, Apple)
   - Configure at least one channel (Instagram/WhatsApp/Gmail)

3. **Add API Keys**
   - OpenAI for AI features
   - Stripe for billing (optional)
   - ElevenLabs for voice (optional)

4. **Deploy**
   - Click "Deploy" in Replit
   - Your app is live with persistent data!

### Architecture Status

**✅ Production-Ready Components:**
- Session management with secure cookies
- Authentication middleware protecting all routes
- Supabase integration with automatic failover to MemStorage
- Frontend-backend integration via TanStack Query
- Real-time data fetching and mutations
- Trial management and plan limits
- Responsive UI with glassmorphism design

**🔧 Requires Configuration (Environment Variables):**
- Supabase database (data persistence)
- OAuth providers (Instagram, WhatsApp, Gmail, Outlook)
- AI services (OpenAI for message generation)
- Payment processing (Stripe for billing)
- Voice cloning (ElevenLabs)

**📋 Optional Enhancements:**
- Email notifications (Resend/SendGrid)
- Redis queue for background jobs
- Webhook system for external integrations
- Analytics and monitoring
- Rate limiting middleware

### Environment Variables Priority

**Critical (Required for basic functionality):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SESSION_SECRET=random_32_byte_hex
ENCRYPTION_KEY=random_32_byte_hex
```

**Important (Enables core features):**
```bash
OPENAI_API_KEY=sk_your_key           # AI message generation
STRIPE_SECRET_KEY=sk_your_key        # Billing
INSTAGRAM_APP_ID=your_id             # Instagram integration
WHATSAPP_TOKEN=your_token            # WhatsApp integration
GMAIL_CLIENT_ID=your_id              # Gmail integration
```

**Optional (Enhanced functionality):**
```bash
ELEVENLABS_API_KEY=your_key          # Voice cloning
RESEND_API_KEY=your_key              # Email notifications
REDIS_URL=redis://...                # Background jobs
```

### Security Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] `SESSION_SECRET` is set to a random, secure value (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `ENCRYPTION_KEY` is set to a random, secure value (32 bytes hex)
- [ ] Service role key never exposed to frontend
- [ ] OAuth redirect URIs updated to production domain
- [ ] Webhook signatures verified
- [ ] HTTPS enforced
- [ ] Cookie security enabled (httpOnly, secure, sameSite)

### Known Limitations

**⚠️ Session Store:** Currently uses MemoryStore which:
- Loses all sessions on restart
- Cannot scale horizontally across multiple servers
- Is not suitable for high-traffic production

**For production:** Consider upgrading to connect-pg-simple with Supabase:
```typescript
import connectPgSimple from 'connect-pg-simple';
const PgSession = connectPgSimple(session);
const sessionStore = new PgSession({
  conString: process.env.NEXT_PUBLIC_SUPABASE_URL,
  tableName: 'session'
});
```

**Why this matters:**
- Vercel/Netlify deployments use serverless functions
- Each request might hit a different function instance
- Sessions must be stored in a shared database
- Without this, users will randomly lose their login

**Workaround for now:**
- App works fine for single-user or low-traffic scenarios
- For Netlify/Vercel, consider Supabase Auth's built-in session management
- Sessions will persist for 7 days or until server restart

## Implementation Status

### ✅ Completed

**Authentication & Sessions:**
- Supabase OAuth (Google, Apple) - frontend ready
- Session management middleware
- Authentication guards on all protected routes
- User profile creation and updates

**Database:**
- Full Supabase schema with RLS policies
- MemStorage fallback for development
- Automatic migration to Supabase when credentials added
- Data models for users, leads, messages, integrations

**Frontend-Backend Integration:**
- Dashboard Home connected to real APIs
- Inbox page with real lead fetching
- Conversations page with real-time messaging
- TanStack Query for all data operations
- Proper error handling and loading states

**Dashboard Features:**
- 10 fully functional pages
- Real-time KPI metrics
- Activity feed
- Lead management with filters
- Conversation interface
- Settings management

### 🔧 Needs Configuration

**OAuth Integrations:**
- Instagram OAuth flow (code ready, needs app credentials)
- WhatsApp OAuth flow (code ready, needs app credentials)
- Gmail OAuth flow (code ready, needs app credentials)
- Outlook OAuth flow (code ready, needs app credentials)

**AI Features:**
- OpenAI integration (code ready, needs API key)
- Message generation (code ready, needs API key)
- Voice cloning (code ready, needs ElevenLabs key)

**Billing:**
- Stripe integration (code ready, needs API key)
- Subscription management (code ready, needs price IDs)
- Usage tracking (code ready)

## User Preferences

- **Design Philosophy**: Premium, futuristic, human-centered
- **No Purple**: Avoid purple color schemes (per requirements)
- **Glassmorphism**: Subtle transparency with backdrop blur
- **Animations**: Smooth, professional, never overwhelming
- **Accessibility**: High contrast, keyboard navigation support
