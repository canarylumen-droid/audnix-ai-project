
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
    description: 'Test everything. Audnix helps you know exactly what to say next.',
    leadsLimit: 500,
    voiceMinutes: 0,
    order: -1,
    features: [
      '500 leads to test',
      'Email automation',
      'Neural Flow (Audnix shows what prospects said + what to say next)',
      'Objection handling powered by AI',
      'Auto-booking for qualified leads',
      'Lead intelligence & scoring',
      'No credit card required',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49.99,
    period: 'month',
    description: 'More leads, more reach. Predictive follow-ups, email at scale.',
    leadsLimit: 2500,
    voiceMinutes: 100,
    order: 1,
    features: [
      '2,500 leads/month',
      'Email automation',
      'Neural Flow Analysis',
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
      'Voice automation (400 mins)',
      'Advanced lead sequences (auto-drip)',
      'Best-time follow-ups (AI timed)',
      'Multiple workflows & automations',
      'Neural Flow (customized to your objections)',
      'Deep conversion analytics',
      'Advanced lead filtering & segments',
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
      '1,000 voice minutes',
      'Complete workflow automation',
      'Unlimited automations & workflows',
      'CRM & tool integrations',
      'Custom Neural Flow (trained on your exact process)',
      'Advanced forecasting & predictive insights',
      'Dedicated support',
      'Priority 24/7 access',
    ],
  },
];
