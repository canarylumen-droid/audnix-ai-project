
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
    description: 'Test it out. No credit card. See what it can do.',
    leadsLimit: 100,
    voiceMinutes: 0,
    order: -1,
    features: [
      '100 leads to test',
      'Email automation',
      'Prospect Playbook (AI replies using common objections)',
      'Auto-booking for qualified leads',
      'Lead intelligence & scoring',
      'No credit card required',
    ],
  },
  {
    id: 'free',
    name: 'Free Forever',
    price: 0,
    period: 'forever',
    description: 'Email automation with no credit card required.',
    leadsLimit: 100,
    voiceMinutes: 0,
    order: 0,
    features: [
      '100 leads',
      'Email automation & sequences',
      'Prospect Playbook (email only)',
      'Objection handling across 110+ scenarios',
      'Lead scoring & qualification',
      'Manual lead imports',
      'Email support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49.99,
    period: 'month',
    description: 'More leads, more reach. Voice automation on Instagram, email at scale.',
    leadsLimit: 2500,
    voiceMinutes: 100,
    order: 1,
    features: [
      '2,500 leads/month',
      'Email + voice automation on Instagram',
      'Prospect Playbook (email + voice notes)',
      'Smart follow-ups at the best time',
      'Auto-booking with calendar sync',
      'Lead scoring & ranking',
      'Conversion tracking',
      'Email/chat support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99.99,
    period: 'month',
    description: 'Built for teams that move fast. Collaborate, automate, scale.',
    leadsLimit: 7000,
    voiceMinutes: 400,
    popular: true,
    order: 2,
    features: [
      '7,000 leads/month',
      'Voice automation on Instagram (400 mins)',
      'Advanced lead sequences (auto-drip)',
      'Best-time follow-ups (AI timed)',
      'Team collaboration & role management',
      'Multiple agents working in parallel',
      'Prospect Playbook (customized)',
      'Deep conversion analytics',
      'Priority support',
      'Voice minute add-ons available',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99,
    period: 'month',
    description: 'Maximum reach. Full automation. Dedicated support.',
    leadsLimit: 20000,
    voiceMinutes: 1000,
    order: 3,
    features: [
      '20,000 leads/month',
      '1,000 voice minutes on Instagram',
      'Complete workflow automation',
      'Team permissions & role-based access',
      'CRM & tool integrations',
      'Custom Prospect Playbook (trained on your exact sales process)',
      'Advanced forecasting & predictive insights',
      'Dedicated account manager',
      'Priority 24/7 support',
    ],
  },
];
