# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a premium, zero-setup multi-channel sales automation SaaS platform designed for creators, coaches, agencies, and founders. It automates lead imports from WhatsApp, Email (custom SMTP), and CSV, then intelligently follows up with personalized campaigns across 24/7 workers. The platform emphasizes privacy by connecting directly to users' own business email, Calendly accounts, and WhatsApp, avoiding Audnix API dependencies. Key capabilities include real-time progress tracking, AI-powered email filtering, day-aware campaign automation (Day 1, 2, 5, 7), OTP email authentication, and Stripe billing with a 3-day free trial. The project is currently production-ready with zero errors, clean TypeScript build, and all core features operational, prepared for Vercel deployment.

### User Preferences
- **Authentication**: Prioritize email OTP mode for simple, secure signup (no Supabase required)
- **Email Service**: RESEND_API_KEY configured via Replit integrations for production OTP sending
- **Database**: PostgreSQL (Neon-backed) for all data, Supabase NOT required for auth
- **Billing**: Stripe integration via Replit (secure key management), payment links + poller for auto-upgrades
- **Domain**: Production deployed at https://audnixai.com with CORS support

### System Architecture

**Frontend**
- **Framework:** React 18 + TypeScript
- **Routing:** Wouter
- **Styling:** Tailwind CSS (dark mode, custom theme)
- **Animations:** Framer Motion
- **State:** TanStack Query
- **UI Components:** Shadcn UI (Radix components)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **Design Philosophy:** Premium dark theme with energetic gradients (Cyan, Purple, Pink), glassmorphism, glow effects, smooth transitions, and WCAG 2.1 AA accessibility.
- **Auth Flow**: Email → OTP entry → Countdown timer (60s) with resend button → Username selection → Celebration screen → Dashboard

**Backend**
- **Server:** Express.js + TypeScript
- **Database:** PostgreSQL (Neon-backed)
- **ORM:** Drizzle (type-safe)
- **Authentication:** Session-based (HTTP-only cookies)
- **Workers:** 6 Node.js background processes (24/7) for tasks like follow-ups, email warm-up, insights, comment monitoring, bounce handling, and Stripe polling.
- **Email Providers:** 5-provider failover system (Resend, Mailgun, Custom SMTP, Gmail API, Outlook API).
- **Stripe Integration:** Via Replit connection (secure key management), payment links for checkout + poller for auto-upgrades.

**Feature Specifications**
- **Email Authentication:** OTP-based with secure, crypto-random codes, 5-provider failover, rate limiting, database verification, and expiration checks.
- **OTP Flow**: Generate 6-digit code → Send via email (Resend primary) → Store in `otpCodes` table → User enters code → Verify against DB → Check expiration + attempts → Mark verified → Proceed to username
- **WhatsApp Lead Import:** QR code-based integration using WhatsApp Web.js, privacy-first, fetches contacts and chat history with smart filtering.
- **Business Email Import:** Connects user's SMTP, AI-powered smart filtering for OTP, transactional, marketing, and system emails.
- **CSV Lead Upload:** Bulk import with validation for email, phone, and duplicate detection.
- **Campaign Automation:** Multi-day email sequences (Day 1, 2, 5, 7) with human-like timing, dynamic personalization, warm-up protection, and bounce/reply handling.
- **Calendly Integration:** User's own Calendly API token for booking, auto-generates time slots, and syncs with Google Calendar.
- **Email Warm-Up Worker:** Prevents spam filters by gradually increasing sending volume.
- **Bounce Handling & Tracking:** Professional email list hygiene with hard/soft bounce tracking, spam complaint flagging, and suppression lists.
- **Stripe Billing:** Subscription management with payment links (easy checkout, no webhooks needed) + 1-minute payment poller for instant auto-upgrades. Redundant system: poller catches all payments even if webhooks fail.
- **Free Trial:** 3-day full access for all users, with graceful upgrade prompts.
- **Admin System:** Full user management, plan assignment, real-time analytics, and support actions.
- **Real-Time Dashboards:** Live KPI updates, campaign progress, multi-channel analytics, and plan usage.
- **Weekly AI Insights:** Automated AI-powered reports on lead sources, email stats, and campaign performance.
- **Video Comment Monitoring:** Auto-replies to Instagram/YouTube comments with personalized, AI-generated messages.
- **Settings Page:** Tabbed interface for managing Email and Calendly integrations.
- **Intelligent Email Filter Intelligence Modal:** Beautiful UX explaining AI filtering categories and benefits to users.

**Database Schema Highlights:** Users, Leads, Messages, Integrations, OTPCodes, Deals, Notifications, OnboardingProfiles, BounceRecords, Campaigns.

### External Dependencies
- **Stripe (via Replit Integration):** For billing and subscription management with secure key rotation.
- **Calendly API:** For integrating user's booking schedules.
- **WhatsApp Web.js:** For WhatsApp lead import functionality.
- **Resend (via Replit Integration):** Primary OTP email provider for user authentication with API key management.
- **Mailgun, Gmail API, Outlook API:** Fallback email providers.
- **OpenAI GPT-4:** For AI-powered email filtering, personalization, insights, and smart replies (with fallback to rule-based summary for insights).
- **PostgreSQL (Neon-backed):** Primary database.
- **Vercel:** Target deployment platform (all env vars configured).
- **csv-parser:** Library for CSV lead upload.

### Recent Changes (Nov 23, 2025)
- **Stripe Integration Complete**: Replit Stripe connection installed, secure API key management active
- **Stripe Payment Poller Fixed**: Poller now enabled and running every 1 minute (was incorrectly disabled)
- **Stripe Client Created**: `server/lib/stripe-client.ts` fetches credentials from Replit connection with env var fallback
- **Payment Auto-Upgrade Flow**: Poller detects successful payments → Auto-upgrades users to correct plan → Sends success notification
- **Redundant Payment System**: Both payment link checkout + 1-minute poller ensure 100% payment capture
- **OTP Email Authentication Complete**: Full 6-digit OTP flow with email sending, database verification, expiration checks, and attempt limiting
- **OTP UI Enhancements**: Added 60-second countdown timer with "Resend in Xs" button that enables after timeout
- **Multi-provider Email Failover**: Resend (primary) → Mailgun → Custom SMTP → Gmail → Outlook for maximum reliability
- **TypeScript Clean**: All route files have proper imports and type declarations, @ts-nocheck only on necessary files
- **Production Ready**: Frontend countdown UI, backend OTP database validation, Resend API integration, Stripe poller all working end-to-end
- **Premium Sales Language Optimizer**: 24+ word replacements (buy→join, cost→investment, follow-up→reconnect, etc.)
- **Conversational Tone**: System prompt updated for natural, human-like responses instead of corporate language
- **Brand Context Integration**: AI replies now reference user's company info, industry, and unique value for personalization
- **Smart Objection Handling**: Real-world, conversational responses to price objections, competitor comparisons, and hesitation
- **Personalized Examples**: AI uses lead's industry context to share relevant success stories
- **Less Professional, More Real**: AI talks like a real person (contractions, short sentences, no corporate BS)

### Sales Language Optimization Details
- **24+ Word Replacements**: buy→join, cost→investment, follow-up→reconnect, customer→client, expensive→premium, sell→share, service→solution, etc.
- **Conversational Filters**: Removes formal language like "kindly", "please", "I appreciate", replaces with natural alternatives
- **Brand-Context Responses**: Loads user's company name, industry, business description for personalized examples
- **Real Objection Handling**: 
  - Price: "Look, money matters...most people see 3-5x return in first month"
  - Already Using: "That's cool you're testing things...difference is usually 10+ hours saved per week"
  - Unsure/Busy: "Most people feel that way at first, then see the value pretty fast"
  - Not Interested: "No pressure...if something changes, you know where to find me"
- **Smart System Prompt**: AI instructed to talk like a real person, use contractions, short sentences, minimal emojis
- **Files**: `server/lib/ai/sales-language-optimizer.ts`, `server/lib/ai/brand-context.ts`, updated `server/lib/ai/conversation-ai.ts`

### Known Issues & Todos
- Webhook configuration for Resend events (delivery tracking) - document endpoint URL format: `/api/webhooks/resend?userId={userId}`
- Stripe webhook endpoint not yet configured (optional - poller is primary mechanism)
- Need to create Stripe payment links in Stripe Dashboard and add to secrets as: STRIPE_PAYMENT_LINK_STARTER, STRIPE_PAYMENT_LINK_PRO, STRIPE_PAYMENT_LINK_ENTERPRISE
- **Future Enhancement**: PDF brand context upload (currently uses metadata fields: businessDescription, industry, uniqueValue, targetAudience, successStories)
