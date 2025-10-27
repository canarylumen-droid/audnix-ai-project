# Audnix AI - SaaS Landing Page MVP

## Overview

Audnix AI is a premium SaaS landing page featuring real-time capabilities, Supabase authentication, and a sleek glassmorphism UI. It aims to provide a conversion-focused landing experience, complete with live social proof, OAuth authentication, and a comprehensive dashboard placeholder. The project includes a sophisticated AI Voice System for personalized customer interactions, targeting warm leads via Instagram and WhatsApp.

## User Preferences

- **Design Philosophy**: Premium, creator-focused, energetic, human-centered
- **Color Scheme**: Vibrant cyan/purple/pink gradients (updated from no-purple requirement)
- **Glassmorphism**: Advanced transparency with backdrop blur and glow effects
- **Animations**: Smooth, professional, energetic
- **Accessibility**: High contrast white text, keyboard navigation support
- **UI Style**: Bright, vibrant, modern with percentage indicators and trend arrows

## System Architecture

Audnix AI is built with a React 18 frontend using TypeScript, Wouter for routing, Tailwind CSS for styling (dark gradient theme), Framer Motion for animations, and TanStack Query for server state management with Shadcn UI components. The backend uses Express.js with TypeScript, primarily relying on Supabase for authentication (Google & Apple OAuth), real-time features, and database management. An in-memory storage (MemStorage) serves for development.

Key features include:
- A responsive landing page with a hero section, feature grid, comparison table, and a real-time "People Joined" counter.
- Comprehensive authentication with Google/Apple OAuth, 3-day trial setup, and a graceful demo mode.
- A fully functional dashboard with 10 pages including KPI cards, an inbox with lead management, a conversations view with an AI composer, deals, calendar, integrations, insights, pricing, settings, and admin panels.
- Real-time updates for user counts and signup notifications via Supabase Realtime.
- An AI Voice System utilizing OpenAI and ElevenLabs for intelligent, personalized voice messages to warm leads, with usage limits and automatic credential decryption.

The application features a premium dark gradient theme with vibrant cyan (`#00c8ff`), purple (`#9333ea`), and pink (`#ec4899`) accents. Typography uses Inter font with bold gradient text and glow effects. Design elements emphasize advanced glassmorphism, energetic glow effects, and smooth Framer Motion animations. Dashboard includes bright white text, vibrant KPI cards with gradient backgrounds, percentage indicators, and trend arrows for a modern creator-focused aesthetic.

## Pricing & Monetization (v2.0 - Updated October 2025)

**Subscription Tiers:**
- **Starter**: $49.99/month (2,500 leads, 100 voice minutes)
- **Pro**: $99.99/month (7,000 leads, 400 voice minutes) - Most Popular
- **Enterprise**: $199.99/month (20,000 leads, 1,500 voice minutes)

**Free Trial:**
- Duration: 3 days (set automatically when user signs up via OAuth)
- Features: Limited (0 voice seconds, basic features)
- Post-trial: Full-screen overlay appears with upgrade prompt (no "unlimited" messaging)
- Upgrade Flow: "Upgrade Plan" button redirects to `/dashboard/pricing`
- Real-Time Unlocking: Features unlock immediately after Stripe payment via webhook

**Payment Integration:**
- Stripe Checkout API (no payment links - full programmatic control)
- Secure cookie-based sessions (HTTP-only, SameSite=strict, secure in production)
- OAuth tokens (access & refresh) stored in secure HTTP-only session cookies
- Webhook-based plan activation for instant feature unlocking

**Feature Gating:**
- Voice features require paid subscription (trial users get 0 seconds)
- Lead limits enforced per plan tier
- Middleware: `requireActiveSubscription` checks trial expiry
- Automatic blocking when trial expires with clean upgrade messaging

## External Dependencies

- **Supabase**: Database, Authentication (Google, Apple OAuth), Real-time features.
- **ElevenLabs**: AI voice generation and cloning.
- **OpenAI**: AI text generation for messages.
- **Wouter**: Client-side routing.
- **Tailwind CSS**: Utility-first CSS framework.
- **Framer Motion**: Animation library.
- **TanStack Query**: Server state management.
- **Shadcn UI**: UI component library.
- **Express.js**: Backend server.
- **Stripe**: (Requires configuration) For billing and subscription management.
- **Instagram / WhatsApp / Gmail / Outlook**: (Requires configuration) For channel integrations and message delivery.
- **Resend / SendGrid**: (Optional enhancement) For email notifications.
- **Redis**: (Optional enhancement) For background jobs.