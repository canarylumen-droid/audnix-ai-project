# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

> Last Updated: **November 29, 2025** | **Status: ✅ Replit Migration Complete**

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

### Recent Changes (November 29, 2025) - REPLIT MIGRATION & STABILIZATION
- **✅ REPLIT MIGRATION COMPLETE:** Migrated from Replit Agent to standard Replit environment
- **✅ node-fetch REMOVED:** Replaced with native fetch API in `calendly.ts` and `multi-provider-failover.ts`
- **✅ ROLLUP BINARY FIX:** Updated `.npmrc` configuration, installed `@rollup/rollup-linux-x64-gnu`
- **✅ CI/CD PIPELINE:** Created `.github/workflows/ci.yml` for GitHub Actions deployment
- **✅ VERCEL CONFIG:** Updated `vercel.json` with proper installCommand and output directory
- **✅ ALL 19 MIGRATIONS WORKING:** Database schema fully synchronized
- **✅ BUILD SUCCEEDS:** 19.27s build time, `dist/public/` generated successfully
- **✅ SERVER RUNNING:** Port 5000, all business logic intact (rate limiting, follow-up worker, video monitoring, lead import, payment handlers, OTP system, admin routes, PDF uploads)

### Required Secrets for Production
The following secrets need to be configured in Replit Secrets for full functionality:

| Secret | Purpose | Impact if Missing |
|--------|---------|-------------------|
| `TWILIO_SENDGRID_API_KEY` | Email OTP authentication | Users cannot sign up/login via email |
| `OPENAI_API_KEY` | AI objection handling, analytics | Falls back to basic responses |
| `STRIPE_SECRET_KEY` | Payment processing | Stripe webhooks disabled |
| `REDIS_URL` | Distributed rate limiting | Falls back to memory-based limiting |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google Calendar OAuth | Calendar integration disabled |
| `CALENDLY_CLIENT_ID` + `CALENDLY_CLIENT_SECRET` | Calendly OAuth | Users can still use manual API key |
| `ENCRYPTION_KEY` | Session encryption | Uses auto-generated key (insecure for production) |
| `SUPER_MEMORY_API_KEY` | Extended conversation memory | Limited to database storage only |

### Previous Changes (November 28, 2025) - VERCEL BUILD FIX
- **✅ VERCEL BUILD FIXED:** Removed esbuild bundling, using tsx for direct TypeScript execution
- **✅ IMPORT PATHS CORRECTED:** Fixed `server/index.ts` to import from `./routes` (main routes file)
- **✅ ALL API ENDPOINTS VERIFIED:** Health, auth, OTP, dashboard routes all working
- **✅ PRODUCTION BUILD:** `npm run build` generates `dist/public/` successfully
- **✅ COMPLETE MIGRATION TO NEON:** Using PostgreSQL (Neon) exclusively via Drizzle ORM
- **✅ Authentication Verified:** Password + SendGrid OTP, sessions in PostgreSQL
- **✅ Zero TypeScript Errors:** Full type safety across entire codebase
- **✅ CSRF Protection Fixed:** Auth endpoints properly whitelisted
- **Stripe Integration:** API v2024-06-20, webhook type handling verified
- **Session Storage:** PostgreSQL-backed (connect-pg-simple) for 500+ concurrent users

**Build Configuration:**
- `npm run build` - Builds client with Vite to `dist/public/`
- `npm run start` - Runs server with tsx (TypeScript Execute)
- Vercel uses `@vercel/node` to run `server/index.ts` directly

**Database: 100% Neon PostgreSQL via Drizzle ORM**
- No Supabase auth (removed all supabaseAdmin.auth calls)
- No Supabase database (removed all supabaseAdmin.from() queries)
- Supabase retained ONLY for real-time subscriptions (client-side, optional)

**Optional Features (Can Enable):**
- **OpenAI API:** Enable AI objection handler and analytics (add OPENAI_API_KEY)
- **Stripe Webhooks:** Enable automatic payment processing (add STRIPE_SECRET_KEY)
- **Google Calendar/Calendly:** OAuth integrations for scheduling
- **Redis:** For distributed rate limiting and session caching
- **Supabase Real-time:** Already configured in client-side `use-realtime.ts`

### Previous Changes (November 27, 2025)
- **User Schema Enhancements:** Added `subscriptionTier`, `whatsappConnected`, `pdfConfidenceThreshold` fields
- **Shared Types:** Created `shared/types.ts` for centralized PDFProcessingResult and common type definitions
- **Storage Interface:** Added `getAllMessages` method to IStorage interface
- **Follow-up Worker:** Fixed message property names (createdAt, direction) to match schema
- **Admin Direct Upgrade:** POST /api/admin/users/:id/upgrade - upgrade any user to any plan without payment
- **AI Analytics:** Real-time data with smart messaging for limited data scenarios

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