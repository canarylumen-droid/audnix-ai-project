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

3. **Dashboard**
   - Placeholder page with typing animation
   - Personalized welcome message
   - Coming soon features preview

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
│   │   │   ├── landing.tsx   # Main landing page
│   │   │   ├── auth.tsx      # Authentication page
│   │   │   └── dashboard.tsx # Dashboard placeholder
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

- Implemented complete landing page with Framer Motion animations
- Added Google & Apple OAuth via Supabase
- Configured dark gradient theme with electric blue accents
- Set up real-time counter with Supabase Realtime
- Created demo mode for testing without Supabase
- Added comprehensive documentation and README

## Next Phase Features

- Pricing section with Stripe integration
- Full dashboard with AI conversation analytics
- Instagram, WhatsApp, Email connection flows
- Admin panel for user management
- Weekly AI report generation and delivery

## User Preferences

- **Design Philosophy**: Premium, futuristic, human-centered
- **No Purple**: Avoid purple color schemes (per requirements)
- **Glassmorphism**: Subtle transparency with backdrop blur
- **Animations**: Smooth, professional, never overwhelming
- **Accessibility**: High contrast, keyboard navigation support
