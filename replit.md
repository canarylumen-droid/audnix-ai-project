# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a zero-setup, multi-channel sales automation SaaS platform designed to automate lead imports and personalized follow-ups across WhatsApp, Email, and CSV. It emphasizes user privacy by integrating directly with users' existing business accounts (email, Calendly, WhatsApp). The platform aims to automate sales and objection handling for creators, coaches, agencies, and founders, significantly improving conversion rates through an AI-driven autonomous objection handler. Its ambition is to streamline sales processes, generate substantial revenue, and revolutionize sales outreach.

### User Preferences
No specific user preferences were provided in the document.

### System Architecture
Audnix AI is a production-ready, Vercel-deployable SaaS platform featuring a unified AI sales engine.

**UI/UX Decisions:**
- **Responsive Mobile UI:** Admin dashboard includes a hamburger menu for mobile/tablet and a full sidebar for desktop.
- **Landing Page:** Highlights key features such as PDF Upload & Brand Learning, Real Analytics Dashboard, Multi-Channel Automation, Legal Compliance, and Conversion Strategy.

**Technical Implementations:**
- **Authentication System:** Features a secure user flow (Email -> Password -> OTP -> Username -> Dashboard) with 7-day sessions and a restricted Admin flow (whitelist email + OTP, 30-day sessions). Includes device banning for security. OTP system uses Twilio SendGrid and database persistence.
- **Payment System:** Database-driven payment tracking, eliminating the need for direct Stripe API keys for approval. An Admin Dashboard manages pending payments with auto-approval.
- **Admin Dashboard:** A secure, secret URL (configurable via `VITE_ADMIN_SECRET_URL`) provides access to user statistics, trial/paid user distribution, and pending approvals.
- **AI-powered Autonomous Objection Handler (Unified Sales Engine):** Identifies and responds to 110+ types of sales objections using GPT-4, generating context-aware closing responses. It operates in two modes:
    1.  **Autonomous Mode (Backend):** Automatically closes leads across email, WhatsApp, and Instagram, learning from outcomes.
    2.  **Assistant Mode (During Calls):** Provides real-time guidance during sales meetings, offering instant reframes and closing questions.
    The system uses a unified database for continuous learning and improvement.
- **Outreach Engine:** A comprehensive system for humanized outreach, including:
    - **Strategy Engine:** Segments leads by quality and projects revenue.
    - **Message Rotator:** Uses five hook variations, value pitches, and social proofs to prevent spam.
    - **Batch Scheduler:** Randomizes timing and batch sizes for sends.
    - **Outreach Engine:** Orchestrates segmentation, personalization, and intelligent follow-ups (12h-7d by tier) with safety guardrails like bounce rate protection.
    - **Reply Handling:** Automated responses based on reply timing and follow-up sequences.
    - **Deliverability:** Pre-validates emails, handles bounces, and auto-pauses campaigns if bounce rates exceed thresholds to maintain high deliverability (98%+).
- **Audit & Compliance:** Features an audit trail for AI actions, opt-out systems, PDF confidence tracking, rate limiting, auto-disclaimers, and integrated legal policies.
- **Email System:** Utilizes three distinct email senders (`hello@audnixai.com` for reminders, `billing@audnixai.com` for transactional, `auth@audnixai.com` for authentication) with predefined sequences and timing. It includes a universal email router supporting SendGrid or custom APIs and activity-based reminders.
- **Backend Infrastructure:** Uses PostgreSQL for data management. Session and encryption are handled with `SESSION_SECRET` and `ENCRYPTION_KEY`. API routing is configured to prevent conflicts.

**System Design Choices:**
- **Role-based access control.**
- **Comprehensive security measures** including AuthGuard, encryption, and secure secret management.
- **Modular design** with clear separation of concerns.
- **Persistent external database (Neon PostgreSQL)** for deployment independence.

### External Dependencies
- **PostgreSQL (Neon):** Primary database.
- **Stripe:** Used for generating payment links (not for payment approval logic).
- **Twilio SendGrid:** For sending OTP and other emails.
- **GPT-4:** AI model used for the autonomous objection handler and response generation.
- **ElevenLabs:** For voice cloning (human-sounding AI).