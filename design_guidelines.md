# Audnix AI - Design Guidelines

## Design Approach
**Selected Approach**: Premium SaaS aesthetic with glassmorphism and motion  
**Brand Personality**: Confident, futuristic, human-centered - feels personal, not robotic

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Background: Gradient from #0a0f1f (dark navy) → #020409 (near black)
- Accent Primary: Electric Blue #00aaff OR Emerald Green #00c896
- Text: White at 85% opacity
- Interactive Elements: Minimal glow on buttons and CTAs
- Style: Glassmorphism with subtle transparency and backdrop blur

**Important**: NO purple gradients or purple color schemes

### B. Typography
- Font Families: Inter / Urbanist / Satoshi
- Hierarchy:
  - Hero Headline: Large, bold, with soft glow effect
  - Subtext: Medium weight, 85% opacity
  - Body: Clean, readable with consistent line-height
  - Microcopy: Smaller, subtle for auth and trial messaging

### C. Layout System
- Responsive single-page landing design
- Smooth scroll behavior between sections
- Consistent spacing: Use Tailwind spacing primitives (p-8, p-12, p-16, p-20)
- Max-width containers for readability
- Multi-column layouts where appropriate (features grid, comparison table)

### D. Component Library

**Hero Section**
- Headline: "Follow up like a human, close deals like a pro — Audnix AI."
- Subtext: "The autopilot CRM that responds, nurtures, and converts leads humanly across Instagram, WhatsApp & Email."
- Dual CTAs: "Start Free Trial (3 Days)" (primary, glowing) + "Learn More" (secondary, scrolls to features)
- Animation: Soft glow + floating motion on hero text using Framer Motion
- Background: Dark gradient with subtle animated particles or grid pattern

**Features Section**
3-column grid with icons and descriptions:
1. 🧩 Human-Like Conversations - Real-time AI follow-ups that sound natural, not robotic
2. ⚡ Zero Setup - Just connect your socials; Audnix handles everything automatically
3. 📊 Smart Insights - Get weekly AI reports showing engagement and conversion trends

**Realtime Social Proof Widget**
- Dynamic counter: "🔥 {X} people have joined Audnix this week"
- Live updates via Supabase Realtime
- Subtle pulse animation on number change
- Optional toast notifications: "🎉 Welcome {name} joined Audnix"

**Comparison Table**
Clean table with checkmarks and X marks:
- Features vs Audnix vs ManyChat vs HubSpot
- Glassmorphic card background
- Color-coded indicators (green checkmarks for Audnix advantages)

**Pricing Section (Optional Add-on)**
- 3-tier layout: Free Trial → Starter ($49/mo) → Pro ($99/mo)
- Card-based design with hover lift effects
- Primary CTA on each tier directing to /auth

**Footer**
- Copyright: "© 2025 Audnix AI. All rights reserved."
- Links: Privacy Policy • Contact • Terms
- Minimalist design, dark background

**Auth Page (/auth)**
- Clean, centered modal or full-page design
- OAuth buttons: Google & Apple (branded, accessible)
- Microcopy: "No card required. Start your 3-day free trial."
- Subtle glow effects on interactive elements

**Dashboard Placeholder (/dashboard)**
- Personalized greeting: "Welcome, @username 👋"
- Typing animation or fade-in intro
- Simple message: "Your autopilot is active — full dashboard coming soon."
- CTA: "Return to Landing"

### E. Animations & Motion
- **Framer Motion** for all animations
- Hero text: Soft float and glow pulse
- Buttons: Subtle scale on hover, glow intensification
- Section reveals: Fade-in with slight slide-up on scroll
- Counter updates: Number flip or count-up animation
- Demo mode: Fake join events with smooth toast notifications every 30-90s
- Keep motion subtle and elegant - avoid overwhelming effects

## Images
**Hero Section**: Large background image or abstract gradient with animated particles/grid overlay representing AI automation and connectivity. Alternative: abstract illustration of multi-channel communication (Instagram, WhatsApp, Email icons in elegant arrangement)

**Feature Icons**: Custom iconography or use from Heroicons/Lucide matching the glassmorphic aesthetic

## Accessibility & UX
- High contrast text on dark backgrounds
- Keyboard navigation support for all interactive elements
- Focus states with visible outlines
- Loading states for auth flow and realtime updates
- Responsive design: mobile-first approach
- Touch-friendly button sizes (minimum 44px height)

## Visual Hierarchy
1. Hero CTA (highest priority)
2. Features showcase
3. Social proof counter
4. Comparison table
5. Optional pricing
6. Footer

## Interaction Patterns
- Smooth scroll to anchor links
- Auth modal/redirect on CTA click
- Realtime counter updates without page refresh
- Toast notifications for demo joins (subtle, non-intrusive)
- Hover states on all clickable elements with glow enhancement