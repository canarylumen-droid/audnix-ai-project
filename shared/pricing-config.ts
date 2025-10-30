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
    price: 49.99,
    period: 'month',
    description: 'Perfect for creators just getting started',
    leadsLimit: 2500,
    voiceMinutes: 100,
    features: [
      '2,500 leads per month',
      '100 voice minutes (~1.5 hours)',
      'Instagram & WhatsApp (via Twilio)',
      'Email integration',
      'AI-powered comment detection',
      'Basic AI insights',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99.99,
    period: 'month',
    description: 'For growing creators who need more power',
    leadsLimit: 7000,
    voiceMinutes: 400,
    popular: true,
    features: [
      '7,000 leads per month',
      '400 voice minutes (~6.5 hours)',
      'All integrations (IG, WA, Email)',
      'Advanced AI insights',
      'Voice cloning',
      'Priority support',
      'Custom automations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99,
    period: 'month',
    description: 'Unlimited power for scaling businesses',
    leadsLimit: 20000,
    voiceMinutes: 1000,
    features: [
      '20,000 leads per month',
      '1,000 voice minutes (~16+ hours)',
      'All integrations + API access',
      'AI-powered insights & reports',
      'Custom voice cloning',
      'Dedicated account manager',
      'White-label option',
      'SLA guarantee',
    ],
  },
];
