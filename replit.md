# Audnix AI - Production-Ready Email + Voice Sales Automation SaaS

### Overview
Audnix AI is a zero-setup email-first sales automation SaaS platform with voice notes and AI-powered objection handling. Email automation (primary channel), voice notes (paid feature), and Instagram DMs (launching 2026). The platform focuses on user privacy by integrating directly with business email accounts. Built for creators, coaches, agencies, and founders automating warm leads for rapid revenue generation.

### User Preferences
- I prefer simple language.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder Z.
- Do not make changes to the file Y.

### System Architecture
The platform is built with a robust tech stack including Node.js + Express + TypeScript for the backend, PostgreSQL (Neon) with Drizzle ORM for the database, and React + Vite + Tailwind CSS + Radix UI for the frontend. Session management is handled by PostgreSQL-backed `connect-pg-simple`.

Key features include:
- **Email Automation:** Day 1-7 sequences and re-engagement sequences.
- **AI-Powered Capabilities:** OpenAI GPT-4 for objection handling (110+ types), intent analysis, and sequencing. ElevenLabs is used for voice notes.
- **Authentication:** Email → Password → OTP (SendGrid) → Username → Dashboard flow.
- **Monetization:** Stripe for payments with an auto-approval worker.
- **Real-time capabilities:** Optional Supabase integration for real-time subscriptions.
- **UI/UX:** Utilizes Tailwind CSS and Radix UI for a modern and responsive design.
- **Feature Tiers:** Free, Trial, Starter, Pro, and Enterprise tiers with varying lead limits, email automation, voice minutes (paid), and advanced features like team workflows and API access.
- **Positioning:** Email + Voice (paid), Instagram DMs coming 2026. WhatsApp removed due to serverless limitations.

### External Dependencies
- **Email Service:** SendGrid API (direct HTTP calls) for OTP and email automation.
- **AI Services:** OpenAI GPT-4 for objection handling (110+ types), intent analysis, and sequencing. ElevenLabs for voice note generation.
- **Payment Gateway:** Stripe for payments with auto-approval worker.
- **Database:** Neon (PostgreSQL) for primary data storage.
- **Session Management:** `connect-pg-simple` for PostgreSQL-backed sessions.
- **Real-time (Optional):** Supabase for potential features.
- **Lead Acquisition:** Apify (warm leads, $25 for 5K with 88% discount).

### Recent Changes (Dec 1, 2025)
- **Landing Page Repositioning:** Removed all WhatsApp references. Now positioned as "Email + Voice Automation" with "Instagram DMs Coming 2026"
- **Pricing Updates:** Updated all tiers to remove WhatsApp, clarify voice as paid feature, highlight Instagram as 2026 roadmap
- **Copy Refinement:** Shortened and clarified messaging across all sections to emphasize email-first strategy
- **Marketing Strategy:** Focus on warm leads from Apify ($25 = $11,850 Week 1 revenue, 697x ROI)