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
- **Positioning:** Email + Voice (Instagram only, paid), Instagram DMs launching Q4 2025.

### External Dependencies
- **Email Service:** Custom SMTP for business email, SendGrid API for OTP.
- **AI Services:** OpenAI GPT-4 for smart objection handling, intent analysis, and sequencing. ElevenLabs for voice note generation (Instagram DMs only).
- **Payment Gateway:** Stripe for payments with auto-approval worker.
- **Database:** Neon (PostgreSQL) for primary data storage.
- **Session Management:** `connect-pg-simple` for PostgreSQL-backed sessions.
- **Real-time (Optional):** Supabase for potential features.
- **Lead Acquisition:** Apify (warm leads, $25 for 5K with 88% discount).

### Recent Changes (Dec 1, 2025)
- **Content Updates:** Removed WhatsApp UI from dashboard (backend kept), updated all references to use "Business Email" + "Custom SMTP"
- **WelcomeCelebration:** Extended confetti to 5 seconds, fixed greeting to "Hey [Name]!" format with proper capitalization
- **Terms & Privacy:** Updated to remove Gmail/WhatsApp references, replaced with neutral "Email" and "SMTP provider" language
- **Sales Assistant:** Updated copy to use "AI-powered objection analysis" instead of "110+ objection types"
- **Accurate Claims:** Voice notes clearly marked as Instagram DMs only, ManyChat comparison is accurate