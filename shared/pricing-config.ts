
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
    name: 'Accelerator Trial',
    price: 0,
    period: '3 days',
    description: 'Experience the power of autonomous engagement. No commitment required.',
    leadsLimit: 500,
    voiceMinutes: 0,
    order: -1,
    features: [
      '500 lead synchronization',
      'Unified Email engagement',
      'Intelligence Flow (Real-time logs)',
      'Automated objection handling',
      'Direct calendar booking',
      'Predictive lead scoring',
      'Full dashboard access',
    ],
  },
  {
    id: 'starter',
    name: 'Growth',
    price: 49.99,
    period: 'month',
    description: 'Empower your small team with elite-level automation and intelligence.',
    leadsLimit: 2500,
    voiceMinutes: 100,
    order: 1,
    features: [
      '2,500 leads / month',
      '100 AI Voice Minutes',
      'Autonomous Follow-ups',
      'Instagram DM Synchronization',
      'Smart CRM',
      'Performance Analytics',
      'Conversion Tracking',
    ],
  },
  {
    id: 'pro',
    name: 'Performance',
    price: 99.99,
    period: 'month',
    description: 'The standard for high-performance sales teams scaling past their limits.',
    leadsLimit: 7500,
    voiceMinutes: 400,
    popular: true,
    order: 2,
    features: [
      '7,500 leads / month',
      '400 AI Voice Minutes',
      'Deep Lead Insights',
      'Intent Recognition',
      'Objection Mastery (110+ Scenarios)',
      'Strategic ROI Mapping',
      'Priority Support Access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.99,
    period: 'month',
    description: 'Custom-built automation architecture for organizations lead by data.',
    leadsLimit: 20000,
    voiceMinutes: 1000,
    order: 3,
    features: [
      '20,000 leads / month',
      '1,000 AI Voice Minutes',
      'Voice Cloning & Training',
      'Smart Auto-Tagging System',
      'Drop-off & Churn Detection',
      'Dedicated Success Manager',
      '24/7 Priority Tech Support',
    ],
  },
];
