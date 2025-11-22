# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a premium, zero-setup multi-channel sales automation SaaS platform designed for creators, coaches, agencies, and founders. It automates lead imports from WhatsApp, Email (custom SMTP), and CSV, then intelligently follows up with personalized campaigns across 24/7 workers. The platform emphasizes privacy by connecting directly to users' own business email, Calendly accounts, and WhatsApp, avoiding Audnix API dependencies. Key capabilities include real-time progress tracking, AI-powered email filtering, day-aware campaign automation (Day 1, 2, 5, 7), OTP email authentication, and Stripe billing with a 3-day free trial. The project is currently production-ready with zero errors, clean TypeScript build, and all core features operational, prepared for Vercel deployment.

### User Preferences
- **Authentication**: Prioritize email OTP mode for simple, secure signup (no Supabase required)
- **Email Service**: RESEND_API_KEY configured in Vercel for production OTP sending
- **Database**: PostgreSQL (Neon-backed) for all data, Supabase NOT required for auth
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

**Backend**
- **Server:** Express.js + TypeScript
- **Database:** PostgreSQL (Neon-backed)
- **ORM:** Drizzle (type-safe)
- **Authentication:** Session-based (HTTP-only cookies)
- **Workers:** 6 Node.js background processes (24/7) for tasks like follow-ups, email warm-up, insights, comment monitoring, bounce handling, and Stripe polling.
- **Email Providers:** 5-provider failover system (Resend, Mailgun, Custom SMTP, Gmail API, Outlook API).

**Feature Specifications**
- **Email Authentication:** OTP-based with secure, crypto-random codes, 5-provider failover, and rate limiting.
- **WhatsApp Lead Import:** QR code-based integration using WhatsApp Web.js, privacy-first, fetches contacts and chat history with smart filtering.
- **Business Email Import:** Connects user's SMTP, AI-powered smart filtering for OTP, transactional, marketing, and system emails.
- **CSV Lead Upload:** Bulk import with validation for email, phone, and duplicate detection.
- **Campaign Automation:** Multi-day email sequences (Day 1, 2, 5, 7) with human-like timing, dynamic personalization, warm-up protection, and bounce/reply handling.
- **Calendly Integration:** User's own Calendly API token for booking, auto-generates time slots, and syncs with Google Calendar.
- **Email Warm-Up Worker:** Prevents spam filters by gradually increasing sending volume.
- **Bounce Handling & Tracking:** Professional email list hygiene with hard/soft bounce tracking, spam complaint flagging, and suppression lists.
- **Stripe Billing:** Subscription management with webhook fallback for Starter, Pro, and Enterprise tiers.
- **Free Trial:** 3-day full access for all users, with graceful upgrade prompts.
- **Admin System:** Full user management, plan assignment, real-time analytics, and support actions.
- **Real-Time Dashboards:** Live KPI updates, campaign progress, multi-channel analytics, and plan usage.
- **Weekly AI Insights:** Automated AI-powered reports on lead sources, email stats, and campaign performance.
- **Video Comment Monitoring:** Auto-replies to Instagram/YouTube comments with personalized, AI-generated messages.
- **Settings Page:** Tabbed interface for managing Email and Calendly integrations.
- **Intelligent Email Filter Intelligence Modal:** Beautiful UX explaining AI filtering categories and benefits to users.

**Database Schema Highlights:** Users, Leads, Messages, Integrations, OTPCodes, Deals, Notifications, OnboardingProfiles, BounceRecords, Campaigns.

### External Dependencies
- **Stripe:** For billing and subscription management.
- **Calendly API:** For integrating user's booking schedules.
- **WhatsApp Web.js:** For WhatsApp lead import functionality.
- **Resend (RESEND_API_KEY):** Primary OTP email provider for user authentication.
- **Mailgun, Gmail API, Outlook API:** Fallback email providers.
- **OpenAI GPT-4:** For AI-powered email filtering, personalization, insights, and smart replies (with fallback to rule-based summary for insights).
- **PostgreSQL (Neon-backed):** Primary database.
- **Vercel:** Target deployment platform (all env vars configured).
- **csv-parser:** Library for CSV lead upload.

### Recent Changes (Nov 22, 2025)
- **Fixed OTP Authentication Flow**: Changed default auth mode from email-password to email-otp
- **Custom OTP Implementation**: Uses custom `/api/auth/send-otp` and `/api/auth/verify-otp` endpoints (no Supabase required)
- **CORS Configuration**: Added support for audnixai.com domain in CSRF protection
- **UI Improvements**: Added dedicated OTP code input field with visual feedback
- **Frontend Logging**: Added comprehensive console logging for signup/OTP flow debugging
- **Build Status**: ✅ Local build passing (531.9kb, zero errors)