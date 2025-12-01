
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
    name: 'Trial',
    price: 0,
    period: '3 days',
    description: 'Try all features risk-free',
    leadsLimit: 100,
    voiceMinutes: 10,
    order: -1,
    features: [
      '100 leads (3-day trial)',
      '10 voice minutes',
      'Limited features access',
      'No credit card required',
    ],
  },
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Start free → upgrade when closing deals',
    leadsLimit: 100,
    voiceMinutes: 0,
    order: 0,
    features: [
      '100 leads',
      'Email automation',
      'AI objection handling',
      'No voice / limited features',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49.99,
    period: 'month',
    description: 'For solopreneurs automating email sequences',
    leadsLimit: 2500,
    voiceMinutes: 100,
    order: 1,
    features: [
      '2,500 leads',
      'Email + Voice notes',
      '100 voice minutes',
      'Objection handling (110+ types)',
      'Auto-booking',
      'Analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99.99,
    period: 'month',
    description: 'For agencies & teams (Instagram DMs coming soon)',
    leadsLimit: 7000,
    voiceMinutes: 400,
    popular: true,
    order: 2,
    features: [
      '7,000 leads',
      'Email + Voice notes',
      '400 voice mins',
      'Advanced sequencing',
      'Best-time follow-ups',
      'Team collaboration',
      'Voice top-ups available',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99,
    period: 'month',
    description: 'For scaling teams with custom needs',
    leadsLimit: 20000,
    voiceMinutes: 1000,
    order: 3,
    features: [
      '20,000 leads',
      '1,000 voice mins',
      'Priority processing',
      'Team workflows',
      'API access',
      'Dedicated support',
    ],
  },
];
