# Audnix AI - SaaS Landing Page MVP

## Overview

Audnix AI is a premium SaaS landing page featuring real-time capabilities, Supabase authentication, and a sleek glassmorphism UI. It aims to provide a conversion-focused landing experience, complete with live social proof, OAuth authentication, and a comprehensive dashboard placeholder. The project includes a sophisticated AI Voice System for personalized customer interactions, targeting warm leads via Instagram and WhatsApp.

## User Preferences

- **Design Philosophy**: Premium, futuristic, human-centered
- **No Purple**: Avoid purple color schemes (per requirements)
- **Glassmorphism**: Subtle transparency with backdrop blur
- **Animations**: Smooth, professional, never overwhelming
- **Accessibility**: High contrast, keyboard navigation support

## System Architecture

Audnix AI is built with a React 18 frontend using TypeScript, Wouter for routing, Tailwind CSS for styling (dark gradient theme), Framer Motion for animations, and TanStack Query for server state management with Shadcn UI components. The backend uses Express.js with TypeScript, primarily relying on Supabase for authentication (Google & Apple OAuth), real-time features, and database management. An in-memory storage (MemStorage) serves for development.

Key features include:
- A responsive landing page with a hero section, feature grid, comparison table, and a real-time "People Joined" counter.
- Comprehensive authentication with Google/Apple OAuth, 3-day trial setup, and a graceful demo mode.
- A fully functional dashboard with 10 pages including KPI cards, an inbox with lead management, a conversations view with an AI composer, deals, calendar, integrations, insights, pricing, settings, and admin panels.
- Real-time updates for user counts and signup notifications via Supabase Realtime.
- An AI Voice System utilizing OpenAI and ElevenLabs for intelligent, personalized voice messages to warm leads, with usage limits and automatic credential decryption.

The application adheres to a dark gradient theme (`#0a0f1f` to `#020409`) with an electric blue primary color (`#00aaff`). Typography uses Inter font, featuring bold headlines with glow effects. Design elements emphasize glassmorphism, soft glow effects, and Framer Motion animations.

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