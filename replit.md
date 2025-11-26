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
---

## 🆕 VERSION 2.9 - UNIFIED AI SALES ENGINE ✅

### Single Unified Feature: Handles EVERYTHING Autonomously

**NOT TWO SEPARATE TOOLS** - One intelligent system with dual modes:

1. **AUTONOMOUS MODE (Backend)** - AI closes leads automatically while you sleep
   - Lead objects → AI identifies type (110+ objection database)
   - Generates contextual response using GPT-4
   - Reframes + tells story + asks power question
   - Sends autonomously, learns from outcome
   - Handles email, WhatsApp, Instagram, SMS equally

2. **ASSISTANT MODE (During Calls)** - Use during sales meetings for real-time guidance
   - You paste what prospect said during call
   - AI returns instant reframe + closing question + tactic
   - One-click copy to clipboard (paste while on call)
   - Same 110+ objection database learns from your usage

### Why Single System (Not Two UIs):

- **Same database, same learning** - Every response improves the AI
- **No feature fragmentation** - Autonomous mode uses what Assistant proved works
- **Unified learning** - Learns from both lead responses AND your manual adjustments
- **Free for all plans** - No paywall, same power regardless of tier

### 110+ Objections Covered:

**Core Categories (50):** Timing, Price, Competitor, Trust, Fit, Social, Decision, Edge Cases

**NEW Categories (60+):**
- **Compliance & Permission (15):** WhatsApp permission, Instagram spam, GDPR, unsubscribe links
- **Tone-Based (15):** Hesitant interest, too pushy, sounds like bot, feels generic
- **Channel-Specific (12):** Instagram vs Email, WhatsApp boundaries, voice note issues
- **Behavior & Intent (12):** Too fast outreach, duplicate messages, ignored "no thanks"
- **Industry-Advanced (18):** Coach relationship-based sales, B2B enterprise, retail foot traffic

**Smart Learning:**
- Analyzes HOW they said it (tone, permission ask, urgency level)
- Adapts per channel (email ≠ WhatsApp ≠ Instagram DM)
- Learns lead behavior (fast responder vs. slow, skeptical vs. enthusiastic)
- Contextual reasoning (brand PDF + industry + lead history)

### Key Files:
- `server/lib/sales-engine/objections-database.ts` - 110+ unified database
- `server/lib/ai/autonomous-objection-responder.ts` - AI engine (GPT-4)
- `server/lib/ai/universal-sales-agent-integrated.ts` - Autonomous trigger
- `server/routes/sales-engine.ts` - API endpoint
- `client/src/pages/sales-assistant.tsx` - Call-time assistant UI (if needed)

### Deployment & Infrastructure:

**Neon + Vercel Connection (Your Question):**
- ✅ Neon database is PERSISTENT - if you delete Replit project, Neon keeps running in PostgreSQL cloud
- ✅ Vercel integrations (payment links, etc) continue working independently
- ✅ Your app will still function anywhere (Vercel, other hosts) because database is external
- ✅ No need to keep Replit project active - deploy once, it runs forever

**Supabase Real-time NOT NEEDED:**
- ✅ Your auth system is built-in (email → password → OTP → username)
- ✅ Zero Supabase dependency for core features
- ✅ PostgreSQL via Neon handles all data persistence
- ✅ No real-time requirement - sales messages work with standard polling
- ✅ Supabase optional for future real-time features (notifications, etc)

**What You Can Delete:**
- Supabase code if not using it
- Replit is just the dev environment - Neon database is your production database
- No lock-in to Replit - fully portable

---

**Version:** 2.9 | **Status:** ✅ Production-Ready | **Build:** ✅ Passing (700.0kb) | **Objections:** 110+ | **Autonomous:** ✅ Always On | **Supabase:** Optional | **Database:** Neon (Persistent)

---

## 📧 EMAIL SYSTEM (v2.9 - NEW)

### Three Email Senders (Each With Purpose)

**1. `hello@audnixai.com` - Reminders & Nurture**
- Day 1: Welcome email (with username from signup)
- Day 2: "Let's get your first win" action reminder
- Day 3: "Your trial ends today" FOMO upgrade push
- Winback: "Your leads are getting cold" engagement recovery
- Status: ✅ Template created

**2. `billing@audnixai.com` - Transactional (Immediate)
- Payment confirmations (within seconds of purchase)
- Monthly invoices
- Subscription updates
- Status: ✅ Template created

**3. `auth@audnixai.com` - Authentication
- OTP verification codes
- Status: ✅ Already configured & working

### Email Sequence Timing (UPDATED - V2.9.1)

| Email | Trigger | Copy Focus |
|-------|---------|-----------|
| It's Live (+4hrs) | Signup complete | Immediate action to import |
| Day 2 Check In (+50-69hrs) | Day 2 morning | Social proof + engagement |
| Trial Ends Tomorrow (+60-72hrs) | Day 2 evening | First urgency warning |
| Trial Ends Today (+72hrs) | Final day | Last-chance urgency |
| No Activity (12+hrs) | No login detected | Re-engagement push |
| Payment Confirmation | Immediate after payment | Trust-building, feature unlock |
| Monthly Invoice | Recurring on renewal date | Clean, professional, administrative |

### Implementation Notes

**Files Created:**
- `server/lib/email-templates/reminder-sequence.ts` - All nurture emails (welcome, day2, day3, winback)
- `server/lib/email-templates/billing-transactional.ts` - Payment & invoice emails
- `ENV_SETUP_GUIDE.md` - Complete setup instructions

**Required Environment Variables:**
```
AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
AUDNIX_BILLING_EMAIL_FROM=billing@audnixai.com
```

**SendGrid Setup:**
1. Verify all 3 senders in SendGrid (settings/sender_auth)
2. Each sender gets its own verified domain/email
3. OTP sender (auth@) already verified ✅

**Design Approach:**
- Clean, minimal, professional (no casual tone)
- Strong copy with social proof & FOMO for trial sequence
- Consistent Audnix branding (dark navy #1B1F3A, electric blue #4A5BFF)
- Mobile-responsive, plain text + HTML versions
- Personalized with user's actual username from signup

**Future Enhancement:**
- AI voice assistant integration (ElevenLabs) for real-time call handling
- Will revolutionize support industry when combined with autonomous email closing


### Email API Configuration

**Universal Email Router - Supports Both SendGrid & Custom API:**
- Automatically detects which provider to use
- Falls back gracefully if one fails
- Single integration point for all emails

**To Use SendGrid (Already Configured):**
```
TWILIO_SENDGRID_API_KEY=SG.xxxxx
AUDNIX_REMINDER_EMAIL_FROM=hello@audnixai.com
AUDNIX_BILLING_EMAIL_FROM=billing@audnixai.com
```

**To Use Custom Email API:**
```
REMINDER_EMAIL_API_KEY=your_api_key_here
REMINDER_EMAIL_ENDPOINT=https://api.yourservice.com/send
```

**Activity-Based Reminders:**
- Checks user activity automatically every 30 seconds
- No login after 12 hours → sends "come back" email
- Repeats every 48 hours until engagement
- Stops once user upgrades or trial ends
