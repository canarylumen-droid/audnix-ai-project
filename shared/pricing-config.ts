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
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    period: 'month',
    description: 'Perfect for creators just getting started',
    leadsLimit: 100,
    voiceMinutes: 30,
    features: [
      '100 leads per month',
      '30 voice minutes',
      'Instagram & WhatsApp integration',
      'Basic AI insights',
      'Email support',
    ],
    paymentLink: import.meta.env.VITE_STRIPE_LINK_STARTER || undefined,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    period: 'month',
    description: 'For growing creators who need more power',
    leadsLimit: 500,
    voiceMinutes: 150,
    popular: true,
    features: [
      '500 leads per month',
      '150 voice minutes',
      'All integrations (IG, WA, Email)',
      'Advanced AI insights',
      'Voice cloning',
      'Priority support',
      'Custom automations',
    ],
    paymentLink: import.meta.env.VITE_STRIPE_LINK_PRO || undefined,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    period: 'month',
    description: 'Unlimited power for scaling businesses',
    leadsLimit: -1, // unlimited
    voiceMinutes: -1, // unlimited
    features: [
      'Unlimited leads',
      'Unlimited voice minutes',
      'All integrations + API access',
      'AI-powered insights & reports',
      'Custom voice cloning',
      'Dedicated account manager',
      'White-label option',
      'SLA guarantee',
    ],
    paymentLink: import.meta.env.VITE_STRIPE_LINK_ENTERPRISE || undefined,
  },
];
