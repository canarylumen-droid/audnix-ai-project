# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a premium, zero-setup multi-channel sales automation SaaS platform designed for creators, coaches, agencies, and founders. It automates lead imports from WhatsApp, Email (custom SMTP), and CSV, then intelligently follows up with personalized campaigns across 24/7 workers. The platform emphasizes privacy by connecting directly to users' own business email, Calendly accounts, and WhatsApp, avoiding Audnix API dependencies. Key capabilities include real-time progress tracking, AI-powered email filtering, day-aware campaign automation, OTP email authentication, and Stripe billing with a 3-day free trial. The project is production-ready with all core features operational, prepared for Vercel deployment.

### User Preferences
- **Authentication**: Prioritize email OTP mode for simple, secure signup (no Supabase required)
- **Email Service**: RESEND_API_KEY configured via Replit integrations for production OTP sending
- **Database**: PostgreSQL (Neon-backed) for all data, Supabase NOT required for auth
- **Billing**: Stripe integration via Replit (secure key management), payment links + poller for auto-upgrades
- **Domain**: Production deployed at https://audnixai.com with CORS support

### System Architecture

**Frontend**
- **Framework:** React 18 + TypeScript, Wouter for routing, Tailwind CSS for styling (dark mode, custom theme), Framer Motion for animations.
- **State Management:** TanStack Query.
- **UI Components:** Shadcn UI (Radix components), Lucide React for icons.
- **Forms:** React Hook Form + Zod validation.
- **Design Philosophy:** Premium dark theme with energetic gradients (Cyan, Purple, Pink), glassmorphism, glow effects, smooth transitions, and WCAG 2.1 AA accessibility.
- **Auth Flow**: Email → OTP entry → Countdown timer (60s) with resend button → Username selection → Celebration screen → Dashboard.

**Backend**
- **Server:** Express.js + TypeScript.
- **Database:** PostgreSQL (Neon-backed) with Drizzle ORM.
- **Authentication:** Session-based (HTTP-only cookies).
- **Workers:** 6 Node.js background processes for 24/7 tasks including follow-ups, email warm-up, insights, comment monitoring, bounce handling, and Stripe polling.
- **Email Providers:** 5-provider failover system (Resend, Mailgun, Custom SMTP, Gmail API, Outlook API).
- **Stripe Integration:** Via Replit connection for secure key management, payment links for checkout, and a poller for auto-upgrades.

**Feature Specifications**
- **Email Authentication:** OTP-based with secure, crypto-random codes, 5-provider failover, rate limiting, database verification, and expiration checks.
- **Lead Import:** WhatsApp (QR code-based, privacy-first), Business Email (user's SMTP, AI-powered filtering), and CSV (bulk upload with validation).
- **Campaign Automation:** Multi-day email sequences (Day 1, 2, 5, 7) with human-like timing, dynamic personalization, warm-up protection, and bounce/reply handling.
- **Calendly Integration:** User's own Calendly API token for booking and Google Calendar sync.
- **Email Warm-Up Worker:** Prevents spam filters by gradually increasing sending volume.
- **Bounce Handling & Tracking:** Professional email list hygiene, hard/soft bounce tracking, spam complaint flagging, and suppression lists.
- **Stripe Billing:** Subscription management with payment links and a 1-minute payment poller for instant auto-upgrades. Includes a 3-day full-access free trial.
- **Admin System:** Full user management, plan assignment, real-time analytics, and support actions.
- **Real-Time Dashboards:** Live KPI updates, campaign progress, multi-channel analytics, and plan usage.
- **Weekly AI Insights:** Automated AI-powered reports on lead sources, email stats, and campaign performance.
- **Video Comment Monitoring:** Auto-replies to Instagram/YouTube comments with personalized, AI-generated messages.
- **Millionaire Closer Sales Language Engine:** A 10-engine system with 40+ word replacements, tone engine, industry mirroring, objection crushing, re-engagement, brand context, urgency, conversion, personality adaptation, and memory engines. Includes non-negotiable rules for lead framing and identity-based communication.
- **PDF Brand Context Upload Modal:** Validates 9 required fields from PDFs, provides a quality score, and pre-fills AI system prompts with brand voice.
- **Robust Stripe Checkout Session Verification:** Unique `subscription_id` per payment, `stripe_session_id` stored with 24-hour expiry, admin approval workflow to prevent bypass.
- **UNIVERSAL AI SALES AGENT v4** (Revolutionary - NOT Audnix-specific, works for ANY business!)
  - Helps ANY business/agency close first $1,000 deal + 5 clients in 1 week
  - Free trial users close first 2 clients FAST & EASILY (import → verify → analyze → reach → close)
  - 🌐 **Internet Research Engine**: AI searches competitors + finds market gaps automatically
  - 🧠 **Smart Testimonial Extraction**: Auto-extracts testimonials from PDFs + finds URLs
  - 📊 **UVP Detection**: Auto-discovers unique value proposition vs competitors
  - 🎯 **Real-Time Learning**: Learns from each lead response, continuously adapts messaging
  - ✅ **Pre-Send Verification**: Checks EVERY message (personalization, CTAs, tone, defensive language)
  - 🚀 **Industry-Specific Guidance**: Researches how million-dollar closers dominate THEIR space
  - 💡 **Competitive Intelligence**: Finds gaps competitors DON'T have → positioning advantage
  - Files: `server/lib/ai/universal-sales-agent.ts`, `server/lib/ai/pdf-context-extractor.ts`
  - See `UNIVERSAL_SALES_AGENT_GUIDE.md` for complete details

### External Dependencies
- **Stripe (via Replit Integration):** Billing and subscription management.
- **Calendly API:** Booking schedule integration.
- **WhatsApp Web.js:** WhatsApp lead import.
- **Resend (via Replit Integration):** Primary OTP email provider.
- **Mailgun, Gmail API, Outlook API:** Fallback email providers.
- **OpenAI GPT-4:** AI-powered email filtering, personalization, insights, and smart replies.
- **PostgreSQL (Neon-backed):** Primary database.
- **Vercel:** Target deployment platform.
- **csv-parser:** CSV lead upload library.