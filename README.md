# Audnix AI - Landing Page & Authentication MVP

A premium SaaS landing page with Supabase authentication, real-time user counter, and beautiful glassmorphism UI.

## Features

✅ Premium landing page with Framer Motion animations
✅ Google & Apple OAuth via Supabase
✅ Real-time "People Joined" counter
✅ Demo mode for testing
✅ Dark gradient theme with electric blue accents
✅ Glassmorphism effects
✅ Dashboard placeholder with typing animation

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Express.js + Node.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase OAuth
- **Real-time**: Supabase Realtime

## Local Development

### Prerequisites

- Node.js 18+ installed
- Supabase account and project created

### Setup

1. **Clone the repository** (if applicable)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   
   Add these to Replit Secrets (🔒 icon) or create a `.env` file:
   
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_DEMO=false
   ```

4. **Set up Supabase**:
   
   a. Go to your Supabase project → SQL Editor
   
   b. Run this migration:
   ```sql
   create extension if not exists "pgcrypto";

   create table if not exists users (
     id uuid primary key default gen_random_uuid(),
     supabase_id text unique,
     email text not null,
     name text,
     username text,
     plan text default 'trial',
     trial_expires_at timestamptz,
     created_at timestamptz default now(),
     last_login timestamptz
   );

   create index if not exists idx_users_email on users(email);
   ```

   c. Enable OAuth providers:
      - Go to Authentication → Providers
      - Enable Google and Apple
      - Add redirect URL: `https://YOUR-REPLIT-URL.repl.co/api/auth/callback`

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Access the app**:
   - Open `http://localhost:5000` or your Replit URL

## Demo Mode

To enable demo mode (fake user joins every 30-90 seconds):

```env
NEXT_PUBLIC_DEMO=true
```

This will simulate new user signups for testing the real-time counter.

## Deployment on Replit

1. **Add Secrets**:
   - Click the 🔒 Secrets icon in Replit
   - Add all required environment variables

2. **Run the app**:
   - Click the "Run" button
   - The app will start on port 5000

3. **Configure Supabase OAuth**:
   - Copy your Replit URL (e.g., `https://your-app.your-username.repl.co`)
   - Add `https://your-app.your-username.repl.co/api/auth/callback` to Supabase OAuth redirect URLs

4. **Deploy**:
   - Use Replit's "Deploy" feature for production

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   │   ├── landing.tsx
│   │   │   ├── auth.tsx
│   │   │   └── dashboard.tsx
│   │   ├── lib/           # Utilities
│   │   └── index.css      # Global styles
│   └── index.html
├── server/                # Backend Express app
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Storage interface
│   └── index.ts           # Server entry
├── shared/                # Shared types
│   └── schema.ts          # Data models
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/webhook/demo` - Demo mode webhook (for testing)

## Testing

1. **Test landing page**:
   - Visit `/`
   - Check animations load
   - Counter displays correctly

2. **Test authentication**:
   - Click "Start Free Trial"
   - Choose Google or Apple
   - Verify redirect to dashboard

3. **Test real-time counter**:
   - Open landing page in two browser tabs
   - Trigger a signup in one tab
   - Counter should update in both tabs

4. **Test demo mode**:
   - Set `NEXT_PUBLIC_DEMO=true`
   - Counter should increment every 30-90 seconds

## Troubleshooting

**OAuth not working?**
- Check redirect URLs in Supabase match your Replit URL
- Ensure OAuth providers are enabled in Supabase
- Verify environment variables are set correctly

**Real-time not updating?**
- Check Supabase Realtime is enabled for the users table
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check browser console for errors

**Styling issues?**
- Clear browser cache
- Check Tailwind CSS is compiling correctly
- Verify Inter font is loading from Google Fonts

## Next Phase Features

- Pricing section with Stripe integration
- Full dashboard with AI analytics
- Instagram, WhatsApp, Email connection flows
- Admin panel
- Weekly AI report generation

## License

© 2025 Audnix AI. All rights reserved.
