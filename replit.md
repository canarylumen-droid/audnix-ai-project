# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a premium, zero-setup multi-channel sales automation SaaS platform. It automates lead imports from WhatsApp, Email (custom SMTP), and CSV, then intelligently follows up with personalized campaigns. The platform emphasizes privacy by connecting directly to users' own business email, Calendly accounts, and WhatsApp. Its core purpose is to automate sales and objection handling across multiple channels for creators, coaches, agencies, and founders, aiming to significantly improve conversion rates and streamline sales processes with an AI-driven autonomous objection handler.

### User Preferences
No specific user preferences were provided in the document.

### System Architecture
Audnix AI is a production-ready, Vercel-deployable SaaS platform.

**UI/UX Decisions:**
- **Responsive Mobile UI:** The Admin dashboard features a hamburger menu for mobile/tablet, with a full sidebar for desktop.
- **Landing Page:** Showcases real features across five sections: PDF Upload & Brand Learning, Real Analytics Dashboard, Multi-Channel Automation, Legal Compliance + Disclaimers, and Conversion Strategy.

**Technical Implementations:**
- **Authentication System:**
    - User Flow: Email -> Password -> OTP -> Username -> Dashboard (7-day sessions).
    - Admin Flow: Whitelist email + OTP (30-day sessions).
    - Security: Device ban after 2 failed attempts (1-week ban), all `/dashboard/*` routes protected.
    - OTP System: Fully operational with Twilio SendGrid integration, 10-minute OTP expiry, and database persistence.
- **Payment System (API Key Free):**
    - Database-driven payment tracking, eliminating the need for Stripe API keys for approval.
    - Admin Dashboard for managing pending payments with a 5-second auto-approve feature.
    - Payment verification and subscription IDs are stored in the database to prevent exploitation.
- **Admin Dashboard:**
    - Secret Admin Dashboard URL for enhanced security, accessible via a configurable environment variable (`VITE_ADMIN_SECRET_URL`).
    - Requires admin role and whitelist email + OTP for access.
    - Provides statistics on total users, trial users, paid users, pending approvals, and user distribution by plan.
- **AI-powered Autonomous Objection Handler (Version 2.8):**
    - Identifies and responds to 60+ types of sales objections (timing, price, competitor, trust, etc.).
    - Generates context-aware closing responses using GPT-4, incorporating reframes, stories, and power questions.
    - Learns from past interactions to improve effectiveness.
    - Core logic implemented in `autonomous-objection-responder.ts` and integrated via `universal-sales-agent-integrated.ts`.
- **Audit & Compliance:**
    - Audit trail for all AI actions.
    - Opt-out system for lead communication.
    - PDF confidence tracking and alerts.
    - Rate limiting for uploads.
    - Auto-disclaimers on all messages and integrated legal policies (Terms of Service, Privacy Policy).
- **Backend Infrastructure:**
    - Utilizes PostgreSQL for database management.
    - Session and encryption handled with `SESSION_SECRET` and `ENCRYPTION_KEY`.
    - API routing fixed to correctly handle `/api/` and `/webhook/` routes, preventing conflicts with Vite middleware.

**System Design Choices:**
- **Role-based access control** for users and administrators.
- **Comprehensive security measures** including AuthGuard, encryption, and secure secret management.
- **Modular design** with clear separation of concerns (e.g., AI engine, sales engine, objection database).

### External Dependencies
- **PostgreSQL:** Primary database.
- **Stripe:** For generating payment links (no API keys needed for payment approval logic).
- **Twilio SendGrid:** For sending OTP emails.
- **GPT-4:** AI model used for the autonomous objection handler.