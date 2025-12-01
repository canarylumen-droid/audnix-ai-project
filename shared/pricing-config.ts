
export interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  leadsLimit: number;
  voiceMinutes: number;
  popular?: boolean;
  paymentLink?: string;
  order: number;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    period: '3 days',
    description: 'Test drive all Pro features. No credit card needed.',
    leadsLimit: 100,
    voiceMinutes: 10,
    order: -1,
    features: [
      'Up to 100 leads to test',
      '10 voice minutes on Instagram',
      'AI objection handling (110+ scenarios)',
      'Email sequences with auto-follow-up',
      'Real-time lead scoring',
      'Basic analytics',
      'No credit card required',
    ],
  },
  {
    id: 'free',
    name: 'Free Forever',
    price: 0,
    period: 'forever',
    description: 'Email-only tier. No expiration, no credit card.',
    leadsLimit: 100,
    voiceMinutes: 0,
    order: 0,
    features: [
      '100 leads',
      'Email automation & sequences',
      'AI objection handling',
      'Basic lead scoring',
      'Manual lead import',
      'Community support',
      'Forever free (no trial expiry)',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49.99,
    period: 'month',
    description: 'Perfect for solopreneurs hitting their groove. Email + voice automation.',
    leadsLimit: 2500,
    voiceMinutes: 100,
    order: 1,
    features: [
      '2,500 leads/month (25x more reach)',
      '100 voice minutes on Instagram',
      'Email + voice automation at scale',
      'AI objection handling (110+ types)',
      'Auto-booking with calendar sync',
      'Lead quality scoring & ranking',
      'Conversion analytics',
      'Email/chat support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99.99,
    period: 'month',
    description: 'For agencies & teams that want to scale fast. Everything you need to run a sales operation.',
    leadsLimit: 7000,
    voiceMinutes: 400,
    popular: true,
    order: 2,
    features: [
      '7,000 leads/month (70x more reach)',
      '400 voice minutes on Instagram',
      'Advanced lead sequencing (drip campaigns)',
      'Best-time auto-follow-ups (AI timed)',
      'Team collaboration & role management',
      'Multi-agent workflows',
      'Custom objection handling',
      'Conversion & ROI analytics',
      'Priority support',
      'Voice minute top-ups available',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99,
    period: 'month',
    description: 'For revenue teams ready to scale to 7-figures. Full automation + API + dedicated support.',
    leadsLimit: 20000,
    voiceMinutes: 1000,
    order: 3,
    features: [
      '20,000 leads/month (unlimited growth)',
      '1,000 voice minutes on Instagram',
      'Complete workflow automation',
      'REST API for custom integrations',
      'Advanced team workflows & permissions',
      'Real-time sync with CRM/tools',
      'Custom AI voice training',
      'Predictive analytics & forecasting',
      'Dedicated account manager',
      'Priority phone/email support',
    ],
  },
];
