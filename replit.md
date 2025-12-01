# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a zero-setup, multi-channel sales automation SaaS platform that automates lead imports and personalized follow-ups across Email (primary), WhatsApp (secondary), and Instagram (coming soon). It focuses on user privacy by integrating directly with existing business accounts. The platform is designed to automate sales and objection handling for creators, coaches, agencies, and founders, aiming to be a production-ready solution with a strong emphasis on a warm lead strategy for rapid revenue generation.

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
- **Feature Tiers:** Free, Trial, Starter, Pro, and Enterprise tiers with varying lead limits, channel access (Email, WhatsApp, Instagram DM), voice minutes, and advanced features like team workflows and API access.

### External Dependencies
- **Email Service:** SendGrid API (direct HTTP calls) for OTP and email automation.
- **AI Services:** OpenAI GPT-4 for AI objection handling, intent analysis, and follow-up sequences. ElevenLabs for voice note generation.
- **Payment Gateway:** Stripe for processing payments and managing subscriptions.
- **Database:** Neon (PostgreSQL) for primary data storage.
- **Session Management:** `connect-pg-simple` for PostgreSQL-backed sessions.
- **Real-time (Optional):** Supabase for potential real-time features.
- **Lead Scraping (Recommended Strategy):** Apify (LinkedIn Scraper, Google Maps Scraper) for acquiring warm leads.