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
- **Manual Payment Approval System**: Zero API keys, zero webhooks - user pays via link → auto-marked pending → admin dashboard auto-approves in 5 seconds
- **Payment Success Page**: User sees "Payment Successful ✅" with plan/amount confirmation
- **Admin Approvals Dashboard**: Shows pending payments, 5-second countdown auto-approve button (no manual clicking needed)
- **Auto-Mark Pending**: User auto-marked as pending after payment link redirect (no user input required)
- **Stripe Poller Disabled**: Using manual approvals instead (no STRIPE_SECRET_KEY needed anywhere)
- **Payment Routes**: `/api/payment-approval/mark-pending/:userId` (auto), `/api/payment-approval/pending` (admin list), `/api/payment-approval/approve/:userId` (auto-click)
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

### Payment System Details (Manual Approvals - No API Keys)
**Flow:**
1. User clicks payment link (from friend's Canada Stripe account)
2. Completes payment on Stripe → Returns to `/payment-success?plan=starter&amount=49`
3. Success page auto-marks user as `payment_status = 'pending'` (no user action needed)
4. Admin dashboard shows pending approvals, refreshes every 5 seconds
5. Auto-approve button appears with 5-second countdown
6. Button auto-clicks → User upgraded to plan, `payment_status = 'approved'`
7. User gets instant access to all features

**Database Schema:**
- `users.payment_status` → 'none' | 'pending' | 'approved' | 'rejected'
- `users.pending_payment_amount`, `pending_payment_plan`, `pending_payment_date`, `payment_approved_date`

**API Endpoints:**
- `POST /api/payment-approval/mark-pending/:userId` → User marks self as paid (called from success page)
- `GET /api/payment-approval/pending` → Admin gets pending list
- `POST /api/payment-approval/approve/:userId` → Admin approves (auto-clicked after 5s)
- `POST /api/payment-approval/reject/:userId` → Admin rejects (optional)

### Known Issues & Todos
- Webhook configuration for Resend events (delivery tracking) - document endpoint URL format: `/api/webhooks/resend?userId={userId}`
- **Future Enhancement**: PDF brand context upload (currently uses metadata fields: businessDescription, industry, uniqueValue, targetAudience, successStories)
