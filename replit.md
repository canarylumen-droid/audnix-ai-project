# Audnix AI - Production-Ready Email + Voice Sales Automation SaaS

### Overview
Audnix AI is a zero-setup, email-first sales automation SaaS platform designed for creators, coaches, agencies, and founders. Its primary purpose is to automate warm lead nurturing for rapid revenue generation through email automation (via Custom SMTP), AI-powered objection handling, and Instagram DM automation with voice notes (paid feature). The platform emphasizes user privacy by integrating directly with business email accounts.

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
The platform is built with a Node.js + Express + TypeScript backend, PostgreSQL (Neon) with Drizzle ORM, and a React + Vite + Tailwind CSS + Radix UI frontend. Session management is handled by PostgreSQL-backed `connect-pg-simple`.

Key architectural decisions and features include:
- **Email Automation:** Supports Day 1-7 sequences and re-engagement via Custom SMTP.
- **AI-Powered Capabilities:** Utilizes OpenAI GPT-4 for smart objection handling, intent analysis, and sequencing. ElevenLabs provides voice note generation for Instagram DMs.
- **Authentication:** Features a secure Email → Password → OTP (SendGrid) → Username → Dashboard flow.
- **Monetization:** Integrated Stripe for payment processing with an auto-approval worker, supporting Free, Trial, Starter, Pro, and Enterprise tiers.
- **Real-time capabilities:** Optional Supabase integration for real-time subscriptions.
- **UI/UX:** Modern and responsive design leveraging Tailwind CSS and Radix UI.
- **Feature Set:** Includes lead limits, email automation, voice minutes (paid), team workflows, and API access across different tiers. Instagram DM automation is fully integrated.
- **Intelligence-Governed Automation:** Features an `automation_rules` table for various rule types (follow_up, objection_handler, etc.), a `content_library` for intent-tagged templates, and a `conversation_events` table for unified message ingestion. A Decision Engine evaluates actions, logging all AI decisions with confidence and reasoning.

### External Dependencies
- **Email Service:** Custom SMTP for business email, SendGrid API for OTP.
- **AI Services:** OpenAI GPT-4, ElevenLabs (for Instagram voice notes).
- **Payment Gateway:** Stripe.
- **Database:** Neon (PostgreSQL).
- **Session Management:** `connect-pg-simple`.
- **Real-time (Optional):** Supabase.
- **Lead Acquisition:** Apify.
- **Calendar Integration:** Calendly (for automated meeting bookings).