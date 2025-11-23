/**
 * Week-1 Battle Plan: 3-Day Email Sequence to Hit $3k-$5k
 * 
 * Assumptions:
 * - 5,000 verified emails imported + warmed
 * - SPF/DKIM/DMARC correct
 * - Follow-up engine active
 * - Trial: 3-day (cost-optimized) or 5-day (recommended)
 */

export interface Week1Sequence {
  email1: { delay: number; name: string; description: string };
  email2: { delay: number; name: string; description: string };
  email3: { delay: number; name: string; description: string };
  email4: { delay: number; name: string; description: string };
}

/**
 * 3-DAY BATTLE PLAN SEQUENCE
 * 
 * Day 0 (Launch prep)
 * - Warm domain: send 200 internal team emails (activity)
 * - Publish 1 hero reel showing case-study (real screenshot)
 * - Prepare 3 email templates (Intro, Value+CTA, Proof+CTA)
 * - Prepare WhatsApp template for bio inbound
 * 
 * Email 1: IMMEDIATE (short intro + curiosity)
 * Email 2: +24h (value snippet + offer to run quick audit)
 * Email 3: +48h (proof + CTA: "Activate 3-day trial")
 * Email 4: +72h (final nudge + urgency)
 * 
 * Follow-up rules:
 * - If open & click → accelerate WhatsApp nudge Day 1 (only if WhatsApp exists)
 * - Randomize send times within best-time windows
 * - Stop sequence on reply for that channel
 * - Rate: 5000 leads / 72 hours = ~70 emails/hour (safe)
 */

export const WEEK_1_BATTLE_PLAN: Week1Sequence = {
  email1: {
    delay: 0, // Send immediately
    name: "intro",
    description: "Short intro + curiosity hook. 100-150 words. No CTAs yet."
  },
  email2: {
    delay: 24 * 60, // +24 hours
    name: "value_audit",
    description: "Value snippet + offer to run quick 5min audit. Include one social proof stat."
  },
  email3: {
    delay: 48 * 60, // +48 hours
    name: "proof_trial",
    description: "Real proof (case study/screenshot) + CTA: 'Activate 3-day trial'. Create urgency."
  },
  email4: {
    delay: 72 * 60, // +72 hours (final nudge)
    name: "final_nudge",
    description: "Final reminder + limited availability. P.S. with urgency element."
  }
};

/**
 * EMAIL TEMPLATE STRUCTURE FOR BATTLE PLAN
 */
export interface EmailTemplate {
  id: string;
  sequenceNumber: number;
  subject: string;
  preheader: string;
  body: string;
  cta?: { text: string; url: string };
}

export const BATTLE_PLAN_TEMPLATES: EmailTemplate[] = [
  {
    id: "email1-intro",
    sequenceNumber: 1,
    subject: "{{firstName}}, quick question",
    preheader: "Are you struggling with manual lead follow-ups?",
    body: `Hi {{firstName}},

I stumbled across {{company}} and thought of something...

Most agencies like yours spend 8+ hours/week on manual follow-ups. We help close the gap automatically.

Just sent out a new case study - thought you might find it interesting.

Quick question: are you already using something for this?

Talk soon,
{{senderName}}`,
  },
  {
    id: "email2-value-audit",
    sequenceNumber: 2,
    subject: "The 3 things we found with {{company}}...",
    preheader: "See what's working (and what's not)",
    body: `Hi {{firstName}},

Following up on the earlier email.

We did a quick audit and found 3 things most agencies miss in their follow-up flow:
1. {{audit1}}
2. {{audit2}}
3. {{audit3}}

If you're interested, I can show you exactly what's happening - takes about 5 minutes.

Would next week work?

{{senderName}}`,
  },
  {
    id: "email3-proof-trial",
    sequenceNumber: 3,
    subject: "{{firstName}}: See the results yourself (3-day trial)",
    preheader: "Real results from 50+ agencies like you",
    body: `Hi {{firstName}},

Real quick - you asked how we help teams like yours.

Here's what happened with {{caseStudyCompany}}:
- {{resultMetric1}}
- {{resultMetric2}}
- {{resultMetric3}}

This is exactly what your team could achieve with automated follow-ups.

**Ready to try it?** I set up a 3-day trial for you → {{trialLink}}

(You'll see real results by Day 2)

{{senderName}}`,
  },
  {
    id: "email4-final-nudge",
    sequenceNumber: 4,
    subject: "Last thing: {{firstName}}, your trial expires soon",
    preheader: "48 hours left to activate",
    body: `Hi {{firstName}},

Just a quick reminder: your 3-day trial link is still active.

Most teams who activate see:
- Replies within 24 hours
- 40% reduction in response time
- First deal closed by Day 3

The trial closes {{expiryTime}}.

→ Activate now: {{trialLink}}

Questions? Hit reply.

{{senderName}}

P.S. After {{trialEnd}}, we can't guarantee this slot. Limited spots available.`,
  }
];

/**
 * WEEKLY METRICS TO TRACK
 */
export interface Week1Metrics {
  totalLeadsImported: number;
  emailsDelivered: number;
  emailsOpened: number; // Target: 25%+
  emailsClicked: number; // Target: 5%+
  repliesReceived: number; // Target: 1%+
  trialsActivated: number; // Target: 0.5%+
  dealsClosedWeek1: number; // Target: 50-250 deals (1-5% of trial activations)
  revenue: number; // Target: $3k-$5k
}

export function calculateWeek1Targets(leadsImported: number): Week1Metrics {
  const openRate = 0.25; // 25%
  const clickRate = 0.05; // 5%
  const replyRate = 0.01; // 1%
  const trialActivationRate = 0.005; // 0.5%
  const dealClosureRate = 0.02; // 2% of trial activations
  const avgDealValue = 100; // $100 per deal

  const emailsOpened = Math.floor(leadsImported * openRate);
  const emailsClicked = Math.floor(leadsImported * clickRate);
  const repliesReceived = Math.floor(leadsImported * replyRate);
  const trialsActivated = Math.floor(leadsImported * trialActivationRate);
  const dealsClosedWeek1 = Math.floor(trialsActivated * dealClosureRate);
  const revenue = dealsClosedWeek1 * avgDealValue;

  return {
    totalLeadsImported: leadsImported,
    emailsDelivered: leadsImported,
    emailsOpened,
    emailsClicked,
    repliesReceived,
    trialsActivated,
    dealsClosedWeek1,
    revenue,
  };
}

/**
 * EXECUTION CHECKLIST
 */
export const WEEK_1_CHECKLIST = {
  DAY_0: [
    "✅ Domain warmup: Send 200 internal team emails",
    "✅ Publish 1 hero reel with real case study screenshot",
    "✅ Prepare 3 email templates (Intro, Value, Proof)",
    "✅ Prepare WhatsApp template for inbound",
    "✅ Configure SPF/DKIM/DMARC records",
  ],
  EMAIL_SEQUENCE: [
    "✅ Email 1 (Immediate): Intro + curiosity",
    "✅ Email 2 (+24h): Value + quick audit offer",
    "✅ Email 3 (+48h): Proof + 3-day trial CTA",
    "✅ Email 4 (+72h): Final nudge + urgency",
  ],
  FOLLOW_UP_RULES: [
    "✅ Open + Click → Accelerate WhatsApp nudge Day 1",
    "✅ Randomize send times within best windows",
    "✅ Stop sequence on first reply",
    "✅ Don't follow up more than 5x per lead",
  ],
  MONITORING: [
    "✅ Track open rates (target: 25%+)",
    "✅ Track click rates (target: 5%+)",
    "✅ Track reply rates (target: 1%+)",
    "✅ Track trial activation (target: 0.5%+)",
    "✅ Alert on delivery issues",
  ],
};
