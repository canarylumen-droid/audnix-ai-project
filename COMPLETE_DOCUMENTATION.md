
# Audnix AI - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Setup & Installation](#setup--installation)
5. [Environment Variables](#environment-variables)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [AI Features](#ai-features)
9. [Integrations](#integrations)
10. [Security](#security)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Audnix AI** is an intelligent lead management platform that automates Instagram/WhatsApp conversations using AI. It monitors video comments 24/7, detects buying intent, and sends personalized DMs with voice notes.

### Key Differentiators
- **AI-Powered Intent Detection**: No keyword matching - understands natural language
- **Voice Cloning**: Sends personalized voice notes in YOUR voice (15s max)
- **Real-time Sync**: 30-second intervals for comment monitoring
- **Human-like Timing**: 2-8 minute delays before DMs (based on lead status)
- **CRM Built-in**: Track revenue, book meetings, manage pipeline

---

## Features

### ✅ Core Features (100% Complete)

#### Authentication & User Management
- ✅ Google OAuth (email removed as requested)
- ✅ Email OTP with Supabase
- ✅ User profiles with avatar upload
- ✅ Trial system (3 days) with real-time expiration
- ✅ Plan upgrades (Starter/Pro/Enterprise)

#### Integrations
- ✅ Instagram OAuth (Graph API)
- ✅ WhatsApp Web (QR code, persistent sessions)
- ✅ Gmail OAuth
- ✅ Outlook OAuth
- ✅ Voice cloning with ElevenLabs

#### AI Features
- ✅ AI conversation replies with context awareness
- ✅ Lead scoring and status detection
- ✅ Video comment monitoring (every 30 seconds)
- ✅ Buying intent detection (no keywords needed)
- ✅ Voice note generation (15-20 sec scripts)
- ✅ Personalized DMs using real usernames
- ✅ Content moderation (filters inappropriate messages)

#### Dashboard
- ✅ Real-time lead status updates
- ✅ Conversation inbox with AI replies
- ✅ Analytics & insights
- ✅ Calendar integration (Google/Outlook)
- ✅ Video automation management
- ✅ Deal tracking & revenue calculation

#### Mobile & UX
- ✅ Fully responsive design
- ✅ Dark mode support with theme toggle
- ✅ PWA support (installable app)
- ✅ Push notifications
- ✅ Real-time notification sound
- ✅ Timestamps on all notifications (e.g., "5 mins ago")

---

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Replit/Supabase)
- **Real-time**: Supabase Realtime (WebSocket)
- **AI**: OpenAI GPT-4o-mini
- **Voice**: ElevenLabs Voice Cloning
- **Auth**: Supabase Auth + Google OAuth
- **Storage**: Encrypted credentials with AES-256-GCM

### System Architecture
```
┌─────────────────┐
│   React SPA     │
│  (Client)       │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Express API    │
│  (Server)       │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    ▼         ▼         ▼          ▼
┌──────┐ ┌────────┐ ┌───────┐ ┌────────┐
│ DB   │ │ OpenAI │ │ IG API│ │ Eleven │
│ (PG) │ │ GPT-4  │ │ Graph │ │ Labs   │
└──────┘ └────────┘ └───────┘ └────────┘
```

### Background Workers
1. **Video Comment Monitor**: Runs every 30 seconds
2. **Follow-up Worker**: Processes scheduled messages
3. **Weekly Insights Worker**: Generates AI analytics
4. **Notification Worker**: Real-time push notifications

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (Replit/Supabase)
- Replit account

### Quick Start
1. **Fork this Repl** on Replit
2. **Add Secrets** in Replit Secrets tab:
   ```
   DATABASE_URL=your_postgres_connection_string
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   INSTAGRAM_CLIENT_ID=your_ig_client_id
   INSTAGRAM_CLIENT_SECRET=your_ig_client_secret
   ```
3. **Click Run** - migrations run automatically
4. **Open webview** - app runs on port 5000

### Manual Setup (Local)
```bash
# Clone repo
git clone <repo-url>
cd audnix-ai

# Install dependencies
npm install

# Copy .env.example to .env
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run migrations
npm run migrate

# Start dev server
npm run dev
```

---

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Supabase (Auth & Realtime)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Admin operations

# AI
OPENAI_API_KEY=sk-xxx
ELEVENLABS_API_KEY=xxx

# OAuth - Instagram
INSTAGRAM_CLIENT_ID=xxx
INSTAGRAM_CLIENT_SECRET=xxx
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/oauth/instagram/callback

# OAuth - Google (Calendar + Gmail)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback

# Session
SESSION_SECRET=your-random-secret-string

# Encryption
ENCRYPTION_KEY=32-byte-hex-string

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Optional Variables
```bash
# Voice Minutes Limits (per plan)
VOICE_MINUTES_PLAN_49=300
VOICE_MINUTES_PLAN_99=800
VOICE_MINUTES_PLAN_199=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/google`
Login/signup with Google OAuth
```json
Request: { "code": "google_oauth_code" }
Response: { "user": {...}, "session": {...} }
```

#### POST `/api/auth/otp/request`
Request OTP for email login
```json
Request: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent" }
```

#### POST `/api/auth/otp/verify`
Verify OTP and login
```json
Request: { "email": "user@example.com", "otp": "123456" }
Response: { "user": {...}, "session": {...} }
```

### Lead Management

#### GET `/api/leads`
Get all leads for user
```
Query: ?status=new&channel=instagram&search=john&limit=50
Response: [{ id, name, channel, status, score, ... }]
```

#### POST `/api/leads`
Create new lead
```json
Request: { "name": "John Doe", "channel": "instagram", "email": "john@example.com" }
Response: { "id": "uuid", "name": "John Doe", ... }
```

#### PATCH `/api/leads/:id`
Update lead
```json
Request: { "status": "converted", "score": 95 }
Response: { "id": "uuid", "status": "converted", ... }
```

### Video Automation

#### GET `/api/video-automation/monitors`
Get all video monitors
```
Response: [{ id, videoUrl, productLink, isActive, stats: {...} }]
```

#### POST `/api/video-automation/monitors`
Create video monitor
```json
Request: {
  "videoId": "instagram_media_id",
  "videoUrl": "https://instagram.com/p/xxx",
  "productLink": "https://yourbrand.com/product",
  "ctaText": "Get it now",
  "metadata": { "askFollowOnConvert": true }
}
Response: { "success": true, "monitor": {...} }
```

#### PATCH `/api/video-automation/monitors/:id`
Update monitor (pause/resume, change link)
```json
Request: { "isActive": false, "productLink": "https://new-link.com" }
Response: { "success": true, "monitor": {...} }
```

#### DELETE `/api/video-automation/monitors/:id`
Delete monitor
```
Response: { "success": true }
```

### AI Features

#### POST `/api/ai/reply`
Generate AI reply
```json
Request: {
  "message": "How much does it cost?",
  "leadId": "uuid",
  "context": "Previous conversation history"
}
Response: { "reply": "AI-generated response", "shouldSendVoice": true }
```

#### POST `/api/ai/voice-note`
Generate voice note script
```json
Request: { "leadId": "uuid", "context": "Lead showed interest in pricing" }
Response: { "script": "15-second script", "audioUrl": "https://..." }
```

### Notifications

#### GET `/api/notifications`
Get user notifications
```
Response: [{ id, type, title, message, timestamp, read, actionUrl }]
```

#### POST `/api/notifications/:id/read`
Mark notification as read
```
Response: { "success": true }
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  plan TEXT DEFAULT 'trial', -- trial, starter, pro, enterprise
  trial_expires_at TIMESTAMP,
  voice_minutes_used REAL DEFAULT 0,
  voice_minutes_topup REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### Leads Table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  external_id TEXT, -- Instagram user ID
  name TEXT NOT NULL,
  channel TEXT NOT NULL, -- instagram, whatsapp, email
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new', -- new, open, replied, converted, cold
  score INTEGER DEFAULT 0,
  warm BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Video Monitors Table
```sql
CREATE TABLE video_monitors (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  product_link TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_reply_enabled BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- instagram, whatsapp, gmail
  direction TEXT NOT NULL, -- inbound, outbound
  body TEXT NOT NULL,
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## AI Features

### Intent Detection
**File**: `server/lib/ai/video-comment-monitor.ts`

The AI analyzes EVERY comment for buying intent signals:
- Direct questions about product/service
- Expressing curiosity ("what is this?", "tell me more")
- Asking for details, pricing, availability
- Positive emotions (emojis: 😍, 🔥, 👀)
- Tagging friends (shows interest)

**No keyword matching** - uses GPT-4o-mini to understand context.

### Personalized DM Generation
**File**: `server/lib/ai/conversation-ai.ts`

Rules:
1. Use real Instagram username (no fake names)
2. Reference what they said in their comment
3. Talk about what THEY want
4. Connect to what YOU offer
5. Under 60 words
6. Create urgency naturally
7. Strong CTA

### Voice Note Script Generation
**File**: `server/lib/ai/voice-ai-service.ts`

- Generates 15-20 second scripts
- Sends 2 voice notes for warm/converted leads
- Uses ElevenLabs voice cloning
- Deducts minutes from user's balance

### Content Moderation
**File**: `server/lib/ai/content-moderation.ts`

Filters out:
- Spam/bots
- Offensive language
- Inappropriate content
- Competitors

---

## Integrations

### Instagram (Graph API)
**Setup**: [INTEGRATIONS_GUIDE.md](INTEGRATIONS_GUIDE.md)

Features:
- OAuth login (Business/Creator accounts)
- Fetch video comments
- Send DMs with buttons
- Reply to comments
- Follow/unfollow users

### WhatsApp (Web.js)
**Setup**: QR code scan

Features:
- Persistent sessions
- Send/receive messages
- Media support
- Group detection

### Google Calendar
**Setup**: OAuth flow

Features:
- Check availability
- Book meetings
- Prevent double-booking
- Email invites

### ElevenLabs (Voice Cloning)
**Setup**: API key

Features:
- Clone user's voice
- Generate 15s voice notes
- Track usage minutes

---

## Security

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Storage**: Environment variables
- **Encrypted Data**: OAuth tokens, API keys

### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Protected Routes**: All `/api/*` endpoints

### Input Validation
- **Library**: Zod schemas
- **Sanitization**: XSS protection
- **SQL Injection**: Parameterized queries (Drizzle ORM)

### Authentication
- **Session**: Supabase Auth
- **CSRF Protection**: Session tokens
- **Password**: N/A (OAuth + OTP only)

---

## Deployment

### Replit (Recommended)
1. Fork this Repl
2. Add secrets (DATABASE_URL, SUPABASE_URL, etc.)
3. Click Run
4. Done! Auto-deploys on changes

### Custom Server
```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production npm start

# Or use PM2
pm2 start server/index.ts --name audnix
```

### Environment Setup
- Set `NODE_ENV=production`
- Ensure all secrets are configured
- Database migrations run automatically on startup

---

## Troubleshooting

### "Database URL not set"
**Solution**: Add `DATABASE_URL` to Replit Secrets or `.env`

### "Supabase admin not configured"
**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to secrets

### Video monitoring not working
**Checklist**:
1. User is on paid plan (not trial)
2. Instagram OAuth connected
3. Video URL is valid
4. Monitor is active (`isActive: true`)
5. Check console for errors

### Voice notes failing
**Checklist**:
1. `ELEVENLABS_API_KEY` set
2. User has voice minutes remaining
3. Lead status is `warm` or `converted`
4. Check `voice_minutes_used` in database

### Real-time notifications not appearing
**Checklist**:
1. `SUPABASE_URL` and `SUPABASE_ANON_KEY` set
2. Browser supports WebSocket
3. User is authenticated
4. Check browser console for WebSocket errors

### "Trial expired" overlay stuck
**Solution**: Update `trial_expires_at` in database or upgrade plan

---

## Performance Optimization

### Database Indexing
```sql
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_video_monitors_user_id ON video_monitors(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

### Caching Strategy
- User sessions: Supabase (in-memory)
- Lead data: React Query (5-minute stale time)
- Static assets: Vite build optimization

### Background Workers
- Video monitoring: Every 30 seconds (batched per user)
- Follow-ups: Processed every 60 seconds
- Insights: Generated weekly (off-peak hours)

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License

Proprietary - All rights reserved

---

## Support

- **Email**: support@audnix.com
- **Docs**: This file
- **Issues**: GitHub Issues (if open-source)

---

## Changelog

### v1.0.0 (Current)
- ✅ Full authentication system
- ✅ Instagram + WhatsApp integrations
- ✅ AI-powered video comment monitoring
- ✅ Voice cloning with ElevenLabs
- ✅ Real-time notifications
- ✅ Calendar booking
- ✅ Dark mode + PWA support
- ✅ Complete documentation
