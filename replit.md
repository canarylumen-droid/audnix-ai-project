# Audnix AI - Production-Ready Email + Voice Sales Automation SaaS

### Overview
Audnix AI is a zero-setup email-first sales automation SaaS platform with voice notes and AI-powered objection handling. Email automation (primary channel, via Custom SMTP), voice notes (Instagram DMs only, paid feature), and Instagram DM automation (launching Q4 2025). The platform focuses on user privacy by integrating directly with business email accounts. Built for creators, coaches, agencies, and founders automating warm leads for rapid revenue generation.

### User Preferences
- I prefer simple language.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder Z.
- Do not make changes to the file Y.
- Voice notes ONLY work on Instagram DMs - never claim email has voice notes
- Replace all "Gmail/Outlook" references with "Business Email" + "Custom SMTP"
- Use varied language for objection handling - avoid repeating "110+ objections"
- ManyChat comparison must be accurate: they have flow builder + keyword triggers, don't have AI conversations/voice/email

### System Architecture
The platform is built with a robust tech stack including Node.js + Express + TypeScript for the backend, PostgreSQL (Neon) with Drizzle ORM for the database, and React + Vite + Tailwind CSS + Radix UI for the frontend. Session management is handled by PostgreSQL-backed `connect-pg-simple`.

Key features include:
- **Email Automation:** Business email via Custom SMTP, Day 1-7 sequences and re-engagement sequences.
- **AI-Powered Capabilities:** OpenAI GPT-4 for smart objection handling, intent analysis, and sequencing. ElevenLabs for voice notes (Instagram only).
- **Authentication:** Email → Password → OTP (SendGrid) → Username → Dashboard flow.
- **Monetization:** Stripe for payments with an auto-approval worker.
- **Real-time capabilities:** Optional Supabase integration for real-time subscriptions.
- **UI/UX:** Utilizes Tailwind CSS and Radix UI for a modern and responsive design.
- **Feature Tiers:** Free, Trial, Starter, Pro, and Enterprise tiers with varying lead limits, email automation, voice minutes (paid), and advanced features like team workflows and API access.
- **Positioning:** Email + Voice (Instagram only, paid), Instagram DMs now fully available to all users.

### External Dependencies
- **Email Service:** Custom SMTP for business email, SendGrid API for OTP.
- **AI Services:** OpenAI GPT-4 for smart objection handling, intent analysis, and sequencing. ElevenLabs for voice note generation (Instagram DMs only).
- **Payment Gateway:** Stripe for payments with auto-approval worker.
- **Database:** Neon (PostgreSQL) for primary data storage.
- **Session Management:** `connect-pg-simple` for PostgreSQL-backed sessions.
- **Real-time (Optional):** Supabase for potential features.
- **Lead Acquisition:** Apify (warm leads, $25 for 5K with 88% discount).

### Recent Changes (Dec 9, 2025)
- **Aggressive CTA Copy:** Updated all landing page CTAs to "Recover My Clients" (header) and "Recover My Lost Clients" (hero/calculator) for psychological impact
- **Calendly-Only Booking:** Removed all Google Calendar references from UI - Calendly is the only booking integration
- **Auto-Booking Context:** Added explanation in Calendly settings - "AI automatically books meetings when leads show buying intent"
- **WhatsApp Cleanup:** Fixed integrations page hooks error by removing remaining WhatsApp code
- **Settings Page:** Calendar tab now references only Calendly, not Google Calendar
- **CalendlyConnectUI:** Removed Google Calendar card entirely, updated info banner to focus on Calendly + Audnix auto-booking

### Recent Changes (Dec 5, 2025)
- **TypeScript Fix:** Fixed intent-analyzer.ts compilation errors (OpenAI imports, type annotations) - Vercel deployment unblocked
- **Security Update:** Verified jws package override set to ^4.0.0 for HMAC vulnerability patch
- **Lead Limits:** Updated free trial from 100 to 500 leads across pricing config, migrations, and UI
- **Predictive Timing:** Enhanced AI follow-up intelligence with ROI-based decisions, conversation insights analysis, and smart timing based on lead behavior (not one-size-fits-all)
- **Admin Tools:** Added /api/admin/reset-limbo-users and /api/admin/reset-all-users endpoints for auth cleanup
- **Landing Page:** Updated HeroSection with intelligence layer messaging - "knows when to follow up based on lead behavior"
- **Missing Secrets:** SendGrid API key (TWILIO_SENDGRID_API_KEY) required for OTP authentication to work

### Recent Changes (Dec 3, 2025)
- **Instagram Integration Live:** Instagram OAuth connection now available to ALL users (free and paid plans)
- **Voice Notes Gated:** Voice notes remain a paid-plan feature - free/trial users see upgrade overlay
- **UI Cleanup:** Removed all "coming soon" labels for Instagram, simplified integrations page
- **Documentation:** Created comprehensive INSTAGRAM_SETUP.md for webhook and OAuth configuration
- **Closer Engine Live:** New premium real-time objection handler page with collapsible tactical sections (Reframe, Close Question, Story, Identity Upgrade)
- **Sidebar Restructure:** Updated to 6 groups (Leads, Closer Engine Live, Conversations, Automation & Deals, Insights, Account & Billing)
- **Premium Styling:** Closer Engine Live section has gradient background, PRO badge, and accent styling to highlight as Ferrari feature
- **Tailwind Fix:** Fixed dynamic class generation with static lookup maps for all accent colors
- **Confetti Polish:** Improved welcome celebration with controlled 30% center spread radius, 5-second duration, professional emoji selection
- **Dashboard Routes:** Added /dashboard/closer-engine, /dashboard/lead-import, /dashboard/video-automation routes

### Recent Changes (Dec 2, 2025)
- **UI/UX Restructure:** Complete sidebar navigation redesign with collapsible groups
- **GuidedTour Component:** 7-step premium onboarding tour with spotlight effects and portal rendering
- **ActivationChecklist Component:** 4-step activation checklist with per-step feature unlocking
- **Per-Step Feature Unlocking:** Features unlock progressively (Inbox/Calendar after SMTP, Conversations/Deals after leads import)
- **Cookie Fix:** Fixed signout cookie name mismatch (changed from 'connect.sid' to 'audnix.sid')
- **Mobile Responsive:** Full mobile support for collapsible navigation groups
- **Tour/Activate Buttons:** Added sidebar footer buttons to replay tour or open activation checklist

### Recent Changes (Dec 1, 2025)
- **Competitor Comparison:** Updated ManyChat feature comparison - they have auto-booking + email automation, not AI objection handling, voice notes, or conversation memory
- **Integrations Page:** Updated custom email section to use generic "business email with SMTP/IMAP access" language
- **Calendar Page:** Removed Google/Outlook references, now uses generic "calendar" language
- **Terms of Service:** Removed WhatsApp and Gmail from platform ban disclaimers, replaced with neutral "email providers"
- **Privacy Policy:** Removed WhatsApp and Gmail from third-party services list, kept only Instagram/Meta
- **Inbox Page:** Removed WhatsApp from channel icons and filter options, fixed unused import
- **Deals Page:** Removed WhatsApp from channel icons mapping
- **Conversations Page:** Removed WhatsApp from channel icons mapping  
- **Admin Leads Page:** Removed WhatsApp from channel filter dropdown
- **Email Setup UI:** Simplified SMTP guidance, removed provider-specific examples
- **Content Updates:** Removed WhatsApp UI from dashboard (backend kept), updated all references to use "Business Email" + "Custom SMTP"
- **WelcomeCelebration:** Extended confetti to 5 seconds, fixed greeting to "Hey [Name]!" format with proper capitalization, fixed window.innerHeight SSR issue
- **Terms & Privacy:** Updated to remove Gmail/WhatsApp references, replaced with neutral "Email" and "SMTP provider" language
- **Sales Assistant:** Updated copy to use "AI-powered objection analysis" instead of "110+ objection types"
- **Email Setup Form:** Removed Gmail examples, replaced with generic SMTP examples (Office 365, Zoho, Custom Domain)
- **RecentConversations:** Removed WhatsApp channel type, now only supports Instagram + Email
- **Favicon:** Created favicon.ico as fallback for browser compatibility
- **Accurate Claims:** Voice notes clearly marked as Instagram DMs only, ManyChat comparison is accurate

### Messaging Standards
- **Email:** Always reference as "Business Email" or "Custom SMTP" - never "Gmail/Outlook"
- **Voice Notes:** ONLY on Instagram DMs - never claim email has voice capability  
- **Objection Handling:** Use varied language - "Smart objection handling", "AI-powered analysis" - avoid repeating "110+"
- **Integrations:** Showcase Email + Instagram only (WhatsApp backend remains for future use, hidden from UI)