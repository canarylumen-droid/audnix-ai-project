# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a premium, zero-setup multi-channel sales automation SaaS platform designed for creators, coaches, agencies, and founders. It automates lead imports from WhatsApp, Email (custom SMTP), and CSV, then intelligently follows up with personalized campaigns across 24/7 workers. The platform emphasizes privacy by connecting directly to users' own business email, Calendly accounts, and WhatsApp, avoiding Audnix API dependencies. Key capabilities include real-time progress tracking, AI-powered email filtering, day-aware campaign automation, OTP email authentication, and Stripe billing with a 3-day free trial. The project is production-ready with all core features operational, prepared for Vercel deployment.

### User Preferences
- **Authentication**: Twilio email OTP for signup (one-time), then password login for 7 days (no re-OTP needed)
- **Email Service**: Twilio SendGrid API for email OTP sending (TWILIO_SENDGRID_API_KEY)
- **WhatsApp**: Twilio OTP verification for dashboard connection, QR code + phone number methods
- **Database**: PostgreSQL (Neon-backed) for all data
- **Billing**: Stripe integration with real-time payment confirmation, admin auto-approve (5s auto-click), no webhooks/pollers
- **Deployment**: Vercel (no Replit dependency), all env vars in Vercel settings
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
- **Authentication:** Session-based (HTTP-only cookies), 7-day expiry, password stored + hashed (bcrypt).
- **Email OTP:** Twilio SendGrid API (no Resend fallback needed).
- **WhatsApp:** Twilio OTP verification + QR code option for dashboard connection.
- **Stripe Integration:** Real-time payment confirmation from Stripe API, no webhooks/pollers, admin auto-approve button (5s auto-click).
- **Workers:** 6 Node.js background processes for 24/7 tasks (follow-ups, email warm-up, insights, comment monitoring, bounce handling, voice notes).
- **AI:** OpenAI GPT-4 for voice note generation, real-time replies, sales language engine.

**Feature Specifications**
- **Email Authentication:** Twilio SendGrid OTP (one-time for signup), rate-limited, crypto-random codes, 10-min expiry.
- **Password Login:** 7-day session (no re-OTP needed), bcrypt hashed, permanently stored per user.
- **WhatsApp Connection:** Twilio OTP verification or QR code scan, imports full contact list, real-time access.
- **Lead Import:** WhatsApp (OTP/QR verified), Business Email (user's SMTP, AI-powered filtering), and CSV (bulk upload with validation).
- **Campaign Automation:** Multi-day email sequences with human-like timing, dynamic personalization, warm-up protection, bounce/reply handling.
- **Calendly Integration:** User's own Calendly API token for booking and Google Calendar sync.
- **Email Warm-Up Worker:** Prevents spam filters by gradually increasing sending volume.
- **Bounce Handling & Tracking:** Professional email list hygiene, hard/soft bounce tracking, spam complaint flagging, suppression lists.
- **Stripe Billing:** Subscription management with payment links, real-time confirmation (no poller), admin auto-approve button (5s auto-click). Includes 3-day full-access free trial.
- **Voice AI Service:** Generates AI voice scripts, sends voice notes to WhatsApp/Instagram, real-time replies, plan-based minute limits.
- **Admin System:** Full user management, plan assignment, real-time analytics, payment approvals, support actions.
- **Real-Time Dashboards:** User dashboard (stats, activity, trial countdown), Admin dashboard (overview, revenue, user analytics, payment approvals).
- **Weekly AI Insights:** Automated AI-powered reports on lead sources, email stats, campaign performance.
- **Video Comment Monitoring:** Auto-replies to Instagram/YouTube comments with personalized, AI-generated messages.
- **Millionaire Closer Sales Language Engine:** 10-engine system with 40+ word replacements, tone engine, industry mirroring, objection crushing, re-engagement, brand context, urgency, conversion, personality adaptation, memory engines.
- **PDF Brand Context Upload Modal:** Validates 9 required fields from PDFs, provides quality score, pre-fills AI system prompts with brand voice.
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
- **Stripe:** Billing, payment confirmation (real-time API calls, no webhooks/pollers).
- **Twilio:** Email OTP (SendGrid API), WhatsApp OTP for connection verification, international phone support.
- **OpenAI GPT-4:** AI-powered email filtering, personalization, insights, voice script generation, real-time replies.
- **Calendly API:** Booking schedule integration.
- **WhatsApp Web.js:** WhatsApp lead import and integration.
- **Mailgun, Gmail API, Outlook API:** Email provider fallbacks.
- **PostgreSQL (Neon-backed):** Primary database.
- **Vercel:** Deployment platform (no Replit dependency).
- **csv-parser:** CSV lead upload library.

### Recent Features (COMPLETE - READY FOR VERCEL)

**Authentication System (Complete)**
- **Signup:** Email OTP (Twilio SendGrid) → Create password → Account created
- **Login:** Email + password → 7-day session (no re-OTP)
- **Logout:** Session destroyed cleanly
- **Files:** `server/routes/auth-clean.ts` - Clean auth implementation

**WhatsApp Dashboard Integration (Complete)**
- **Connection:** QR code scan OR phone number → Twilio OTP
- **Import:** Full contact list imported
- **UI:** Two auth methods, status display, disconnect button
- **Files:** `server/routes/whatsapp-connect.ts` - WhatsApp connection logic
- **Component:** `client/src/components/integrations/whatsapp-connect.tsx`

**User Dashboard (Complete)**
- **Stats:** Real-time KPIs, conversion rate, trial countdown
- **Activity:** Recent lead updates, conversions
- **Profile:** Username, plan, business info
- **Endpoints:** GET `/api/dashboard/stats`, `/api/dashboard/activity`, `/api/user/profile`
- **Files:** `server/routes/dashboard-routes.ts` - Dashboard API

**Admin Dashboard (Complete)**
- **Overview:** Total users, active users, MRR, lead metrics
- **Analytics:** User growth, revenue, channels, onboarding stats
- **User Management:** View users, activity per user
- **Payment Approvals:** Real-time payment verification, admin auto-approve (5s auto-click)
- **Endpoints:** GET `/api/admin/overview`, `/api/admin/metrics`, `/api/admin/analytics/*`

**Stripe Billing (Complete)**
- **Payment Confirmation:** Real-time API verification (no webhooks/pollers)
- **Admin Auto-Approve:** Button auto-clicks within 5 seconds, user instantly upgraded
- **Subscription Verification:** Check active subscriptions
- **Endpoints:** POST `/api/stripe/confirm-payment`, `/api/stripe/admin/auto-approve`

**Landing Page (Complete)**
- **Hero Section:** Attention-grabbing headline + CTA
- **Problem/Solution:** Side-by-side comparison (manual vs automated)
- **Feature Showcase:** Instagram, WhatsApp, Email automation
- **Pricing Section:** Trial, Starter, Pro, Enterprise tiers
- **Navigation:** Login/Signup buttons, smooth scrolling

**PDF Upload UX v2 - All 15 Conversion Patterns**
- **15 UX Patterns:** Quality gate, AI analyzer, auto-fill fixer, confidence scores, micro-interactions
- **Smart File Validation:** Prevents trash uploads (detects JPGs saved as PDFs)
- **AI Intake Analyzer:** 10-item checklist with real-time status
- **Confidence Scoring:** 4 metrics (clarity, detail, structure, missing info)
- **Output Quality Preview:** 5-star display
- **Files:** `client/src/components/admin/pdf-upload-modal-v2.tsx`, `server/routes/admin-pdf-routes-v2.ts`

**Instant AI Sales Suggestions**
- `/api/ai/suggest-best` → 3 ranked sales options instantly
- `/api/ai/suggest-instant-follow-up` → Perfect follow-ups
- **Files:** `server/routes/ai-sales-suggestion.ts`