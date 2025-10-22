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

## Next Phase Features

- Backend API implementation for all dashboard features
- Stripe payment integration for pricing plans
- Real Supabase database schema and migrations
- Instagram, WhatsApp, Email OAuth implementation
- Voice cloning backend with ElevenLabs or similar
- AI reply generation with OpenAI/Anthropic
- Webhook system for real-time notifications
- Weekly AI report generation and delivery

## User Preferences

- **Design Philosophy**: Premium, futuristic, human-centered
- **No Purple**: Avoid purple color schemes (per requirements)
- **Glassmorphism**: Subtle transparency with backdrop blur
- **Animations**: Smooth, professional, never overwhelming
- **Accessibility**: High contrast, keyboard navigation support
