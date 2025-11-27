# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

> Last Updated: **November 27, 2025**

### Overview
Audnix AI is a zero-setup, multi-channel sales automation SaaS platform designed to automate lead imports and personalized follow-ups across WhatsApp, Email, and CSV. It emphasizes user privacy by integrating directly with users' existing business accounts (email, Calendly, WhatsApp). The platform automates sales and objection handling for creators, coaches, agencies, and founders.

### System Architecture

**Tech Stack:**
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **Frontend:** React + Vite + Tailwind CSS + Radix UI
- **Sessions:** PostgreSQL-backed (connect-pg-simple) - 500+ concurrent users
- **Email:** SendGrid API (direct HTTP calls)
- **AI:** OpenAI GPT-4
- **Voice:** ElevenLabs
- **Payments:** Stripe (payment links only, no API keys in code)
- **Real-time:** Supabase (optional, for real-time subscriptions)

**Authentication Flow:**
Email → Password → OTP (SendGrid) → Username → Dashboard

**Pricing Tiers:**
- Free: $0/mo (100 leads, 10 voice minutes)
- Trial: $0 for 3 days (500 leads, 50 voice minutes)
- Starter: $49.99/mo (2,500 leads, 100 voice minutes)
- Pro: $99.99/mo (7,000 leads, 400 voice minutes)
- Enterprise: $199.99/mo (20,000 leads, 1,500 voice minutes)

### Key Features
- **AI Objection Handler:** 110+ objection types with GPT-4 responses
- **Multi-Channel:** Email, WhatsApp, Instagram DM automation
- **Human-like Timing:** 2-8 minute response delays
- **PDF Brand Learning:** Instant analysis with AI fallback for missing data
- **Admin Dashboard:** Direct plan upgrades, user management, real-time analytics
- **Background Workers:** Follow-ups, email sync, warmup, comment monitoring

### Recent Changes (November 27, 2025)
- **User Schema Enhancements:** Added `subscriptionTier`, `whatsappConnected`, `pdfConfidenceThreshold` fields
- **TypeScript Build Fixes:** Fixed OpenAI API calls (`message.content` vs `message.body`), schema property alignment
- **Shared Types:** Created `shared/types.ts` for centralized PDFProcessingResult and common type definitions
- **Storage Interface:** Added `getAllMessages` method to IStorage interface
- **Follow-up Worker:** Fixed message property names (createdAt, direction) to match schema
- **Message Scripts:** Fixed channel-specific day mapping for WhatsApp/Instagram
- **Migration 021:** Applied user schema enhancements for subscription tracking
- **Admin Direct Upgrade:** POST /api/admin/users/:id/upgrade - upgrade any user to any plan without payment
- **AI Analytics:** Real-time data with smart messaging for limited data scenarios
- **PDF Upload UX:** AI fallback messaging when brand data is incomplete
- **TypeScript Config:** Updated target to ES2020 for modern regex flag support

### Key Files
- `server/drizzle-storage.ts`: Main storage (Drizzle ORM)
- `server/lib/auth/twilio-email-otp.ts`: OTP via SendGrid
- `server/routes/admin-routes.ts`: Admin endpoints
- `server/lib/ai/follow-up-worker.ts`: AI-powered follow-up automation
- `server/lib/ai/message-scripts.ts`: Channel-specific message templates
- `shared/types.ts`: Shared type definitions (PDFProcessingResult, etc.)
- `shared/schema.ts`: Database schema with Drizzle ORM
- `client/src/pages/dashboard/home.tsx`: Main dashboard
- `client/src/pages/auth.tsx`: Authentication flow