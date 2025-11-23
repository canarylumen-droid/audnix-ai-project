# Audnix AI - Production-Ready Multi-Channel Sales Automation SaaS

### Overview
Audnix AI is a premium, zero-setup multi-channel sales automation SaaS platform designed for creators, coaches, agencies, and founders. It automates lead imports from WhatsApp, Email (custom SMTP), and CSV, then intelligently follows up with personalized campaigns across 24/7 workers. The platform emphasizes privacy by connecting directly to users' own business email, Calendly accounts, and WhatsApp, avoiding Audnix API dependencies. Key capabilities include real-time progress tracking, AI-powered email filtering, day-aware campaign automation (Day 1, 2, 5, 7), **email+password authentication**, and Stripe billing with a 3-day free trial. The project is currently production-ready with zero errors, clean TypeScript build, and all core features operational, prepared for Vercel deployment.

### User Preferences
- **Authentication**: Email + Password authentication (simple, secure signup with no passwords stored in plain text)
- **Email Service**: Optional for integrations (Resend, Mailgun, Gmail, etc.) for business features
- **Database**: PostgreSQL (Neon-backed) for all user data and credentials
- **Domain**: Production deployed at https://audnixai.com with CORS support

### System Architecture

**Frontend**
- **Framework:** React 18 + TypeScript
- **Routing:** Wouter
- **Styling:** Tailwind CSS (dark mode, custom theme)
- **Animations:** Framer Motion
- **State:** TanStack Query
- **UI Components:** Shadcn UI (Radix components)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **Design Philosophy:** Premium dark theme with energetic gradients (Cyan, Purple), glassmorphism, glow effects, and smooth transitions.
- **Auth Flow**: Email → Password → Create Account / Sign In → Dashboard

**Backend**
- **Server:** Express.js + TypeScript
- **Database:** PostgreSQL (Neon-backed)
- **ORM:** Drizzle (type-safe)
- **Authentication:** Session-based (HTTP-only cookies)
- **Password Storage:** bcryptjs (10-round hashing for security)
- **Workers:** 6 Node.js background processes (24/7) for tasks like follow-ups, email warm-up, insights, comment monitoring, bounce handling, and Stripe polling.
- **Email Providers:** 5-provider failover system (Resend, Mailgun, Custom SMTP, Gmail API, Outlook API).

**Feature Specifications**
- **Email + Password Auth:** Secure signup/signin with bcryptjs password hashing, session-based authentication, HTTP-only cookies.
- **Auth Flow**: Enter email → Enter password (min 6 chars) → Create account or sign in → Session created → Dashboard access
- **Multi-day Follow-up Campaign Automation:** Multi-day email sequences (Day 1, 2, 5, 7) with human-like timing, dynamic personalization, warm-up protection, and bounce/reply handling.
- **Calendly Integration:** User's own Calendly API token for booking, auto-generates time slots, and syncs with Google Calendar.
- **Email Warm-Up Worker:** Prevents spam filters by gradually increasing sending volume.
- **Bounce Handling & Tracking:** Professional email list hygiene with hard/soft bounce tracking, spam complaint flagging, and suppression lists.
- **Stripe Billing:** Subscription management with webhook fallback for Starter, Pro, and Enterprise tiers.
- **Free Trial:** 3-day full access for all users, with graceful upgrade prompts.
- **Admin System:** Full user management, plan assignment, real-time analytics, and support actions.
- **Real-Time Dashboards:** Live KPI updates, campaign progress, multi-channel analytics, and plan usage.
- **Weekly AI Insights:** Automated AI-powered reports on lead sources, email stats, and campaign performance.
- **Video Comment Monitoring:** Auto-replies to Instagram/YouTube comments with personalized, AI-generated messages.
- **Settings Page:** Tabbed interface for managing Email and Calendly integrations.

**Database Schema Highlights:** Users, Leads, Messages, Integrations, Deals, Notifications, OnboardingProfiles, BounceRecords, Campaigns.

### External Dependencies
- **Stripe:** For billing and subscription management.
- **Calendly API:** For integrating user's booking schedules.
- **WhatsApp Web.js:** For WhatsApp lead import functionality.
- **Resend, Mailgun, Gmail API, Outlook API:** Optional email providers for business features.
- **OpenAI GPT-4:** For AI-powered email filtering, personalization, insights, and smart replies.
- **PostgreSQL (Neon-backed):** Primary database.
- **Vercel:** Target deployment platform.
- **csv-parser:** Library for CSV lead upload.
- **bcryptjs:** Password hashing for secure authentication.

### Recent Changes (Nov 23, 2025)
- **Replaced OTP with Email+Password Auth**: Simplified from complex 60-second countdown OTP to straightforward email+password signup/signin
- **Password Security**: Implemented bcryptjs with 10-round hashing for all user passwords
- **Session-Based Auth**: HTTP-only cookies for secure session management, session.destroy() for logout
- **Clean Auth Pages**: Simple, beautiful signup/signin forms with dark theme (Cyan/Purple gradients)
- **Fixed All Route Imports**: Added proper Router, Request, Response imports to all route files
- **Backend Auth Endpoints**:
  - POST `/api/auth/signup` - Create new user account with email+password
  - POST `/api/auth/signin` - Authenticate existing user and create session
  - GET `/api/auth/profile` - Get current user profile (protected)
  - POST `/api/auth/logout` - Destroy session and logout
- **Database Verified**: All migrations passing, users table ready with password column
- **Build Clean**: TypeScript errors resolved, 517.6kb bundle size, production-ready

### Known Issues & Todos
- Remove old OTP table (012_create_otp_codes.sql) if not needed in future
- Optional: Add password reset via email link feature
- Optional: Add "Remember me" checkbox for 30-day sessions
- Document deployment: RESEND_API_KEY still needed for business email integrations

### Auth Implementation Details
```
Signup Flow:
1. User enters email, password (min 6 chars), optional name
2. Backend hashes password with bcryptjs (10 rounds)
3. Creates user record in database
4. Sets session cookie (HTTP-only)
5. Redirects to dashboard

Signin Flow:
1. User enters email and password
2. Backend retrieves user from database
3. Compares password with bcryptjs.compare()
4. Sets session cookie on match
5. Updates lastLogin timestamp
6. Redirects to dashboard

Session Management:
- HTTP-only secure cookies prevent XSS attacks
- Session middleware validates on every request
- Session.destroy() clears session on logout
- 24-hour default session expiration (configurable)
```
