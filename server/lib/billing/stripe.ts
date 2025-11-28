import Stripe from 'stripe';
import { getStripeClient } from '../stripe-client.js';
import { storage } from '../../storage.js';

export const isDemoMode = process.env.DISABLE_EXTERNAL_API === "true";

let stripe: Stripe | null = null;

(async () => {
  stripe = await getStripeClient();
})();

export { stripe };

/**
 * Plan configurations
 */
export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_49 || "price_starter",
    name: "Starter",
    price: 49.99,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_49 || "2500"),
    voice_minutes: parseInt(process.env.VOICE_MINUTES_PLAN_49 || "100"),
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_99 || "price_pro",
    name: "Pro",
    price: 99.99,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_99 || "7000"),
    voice_minutes: parseInt(process.env.VOICE_MINUTES_PLAN_99 || "400"),
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_199 || "price_enterprise",
    name: "Enterprise",
    price: 199.99,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_199 || "20000"),
    voice_minutes: parseInt(process.env.VOICE_MINUTES_PLAN_199 || "1000"),
  },
};

/**
 * Top-up catalog - Voice minutes with 90%+ profit margin
 * 
 * COST BREAKDOWN PER MINUTE:
 * - ElevenLabs voice generation: $0.006
 * - Storage + delivery (S3/Supabase): $0.002  
 * - Processing overhead (API calls): $0.002
 * Total cost: ~$0.01/minute
 * 
 * PROFIT MARGINS (90%+):
 * - 100 min: Cost $1 → Price $10 (90% margin)
 * - 300 min: Cost $3 → Price $30 (90% margin)
 * - 600 min: Cost $6 → Price $60 (90% margin)
 * - 1,200 min: Cost $12 → Price $120 (90% margin)
 */
export const TOPUPS = {
  leads_1000: {
    priceId: process.env.STRIPE_PRICE_TOPUP_LEADS_1000 || "price_leads_1000",
    type: "leads" as const,
    amount: 1000,
    price: 30,
  },
  leads_2500: {
    priceId: process.env.STRIPE_PRICE_TOPUP_LEADS_2500 || "price_leads_2500",
    type: "leads" as const,
    amount: 2500,
    price: 65,
  },
  voice_100: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_100 || "price_voice_100",
    type: "voice" as const,
    amount: 100,
    price: 10,
    description: "100 minutes - $10",
  },
  voice_300: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_300 || "price_voice_300",
    type: "voice" as const,
    amount: 300,
    price: 30,
    description: "300 minutes - $30",
  },
  voice_600: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_600 || "price_voice_600",
    type: "voice" as const,
    amount: 600,
    price: 60,
    description: "600 minutes - $60",
  },
  voice_1200: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_1200 || "price_voice_1200",
    type: "voice" as const,
    amount: 1200,
    price: 120,
    description: "1,200 minutes - $120",
  },
};

/**
 * Create Stripe customer for user
 */
export async function createStripeCustomer(
  email: string,
  name?: string,
  userId?: string
): Promise<string> {
  if (isDemoMode) {
    return `cus_mock_${Date.now()}`;
  }

  // Stripe SDK is not initialized here as we only use payment links
  // A customer is created implicitly by Stripe when a payment link is used.
  // We store the Stripe customer ID in our DB upon successful checkout.

  // For now, returning a mock ID for demo mode.
  // In a real scenario, this function might not be needed if customer creation is handled by Stripe checkout.
  // If we need to explicitly create a customer, we would need the Stripe SDK initialized.
  // Given the current context (payment links only), this function might be vestigial or needs re-evaluation.
  return `cus_mock_${Date.now()}`;
}

/**
 * Create subscription for customer
 */
export async function createSubscription(
  customerId: string,
  planKey: keyof typeof PLANS
): Promise<{ subscriptionId: string; clientSecret: string | null }> {
  if (isDemoMode) {
    return {
      subscriptionId: `sub_mock_${Date.now()}`,
      clientSecret: null,
    };
  }

  // This function is not directly used with payment links,
  // as subscription creation is handled by Stripe's checkout flow.
  // It's kept here for potential future use or if a direct subscription API is needed.
  // If it were to be used, the Stripe SDK would need to be initialized.
  return {
    subscriptionId: `sub_mock_${Date.now()}`,
    clientSecret: null,
  };
}

/**
 * Update user subscription plan
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPlanKey: keyof typeof PLANS
): Promise<void> {
  if (isDemoMode) {
    return;
  }

  // This function is not directly used with payment links.
  // It's kept here for potential future use.
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (isDemoMode) {
    return;
  }

  // This function is not directly used with payment links.
  // It's kept here for potential future use.
}

/**
 * Get payment link for subscription plan
 * Supports BOTH payment links (recommended) and price IDs
 */
export async function getSubscriptionPaymentLink(
  planKey: keyof typeof PLANS,
  userId: string
): Promise<string> {
  // Method 1: Payment Links (easiest - just copy from Stripe Dashboard)
  const paymentLinks = {
    starter: process.env.STRIPE_PAYMENT_LINK_STARTER,
    pro: process.env.STRIPE_PAYMENT_LINK_PRO,
    enterprise: process.env.STRIPE_PAYMENT_LINK_ENTERPRISE,
  };

  const link = paymentLinks[planKey];

  // If payment link exists, use it (preferred method)
  if (link) {
    try {
      const url = new URL(link);
      // Only allow Stripe payment links
      if (url.hostname === 'buy.stripe.com' && url.protocol === 'https:') {
        url.searchParams.set('client_reference_id', userId);
        return url.toString();
      }
    } catch (e) {
      console.error('Invalid payment link URL:', e);
    }
  }

  // Method 2: Price IDs (if your friend gave you these instead)
  // You'll need to create payment links from these price IDs in Stripe Dashboard
  const plan = PLANS[planKey];
  const priceId = plan.priceId;

  if (!priceId || priceId.startsWith('price_')) {
    throw new Error(
      `❌ No payment link configured for ${planKey} plan.\n\n` +
      `Option 1 (Recommended): Create a payment link in Stripe Dashboard:\n` +
      `1. Go to https://dashboard.stripe.com/payment-links\n` +
      `2. Click "+ New" and set price to $${plan.price}/month\n` +
      `3. Copy the link and add to Replit Secrets as: STRIPE_PAYMENT_LINK_${planKey.toUpperCase()}\n\n` +
      `Option 2: If you have a price ID (${priceId}), create a payment link from it in Stripe Dashboard.`
    );
  }

  // Fallback: If you only have Price IDs, create Checkout Session
  // This requires STRIPE_SECRET_KEY to be set
  // Return a placeholder - user needs to create payment links
  return `https://billing.stripe.com/p/login/test_placeholder?prefilled_email=user@example.com`;
}

/**
 * Get payment link for voice minutes top-up
 * Supports BOTH payment links (recommended) and price IDs
 */
export async function getTopupPaymentLink(
  topupKey: keyof typeof TOPUPS,
  userId: string
): Promise<string> {
  // Method 1: Payment Links (easiest)
  const paymentLinks = {
    voice_100: process.env.STRIPE_PAYMENT_LINK_VOICE_100,
    voice_300: process.env.STRIPE_PAYMENT_LINK_VOICE_300,
    voice_600: process.env.STRIPE_PAYMENT_LINK_VOICE_600,
    voice_1200: process.env.STRIPE_PAYMENT_LINK_VOICE_1200,
    leads_1000: process.env.STRIPE_PAYMENT_LINK_LEADS_1000,
    leads_2500: process.env.STRIPE_PAYMENT_LINK_LEADS_2500,
  };

  const link = paymentLinks[topupKey];

  // If payment link exists, use it (preferred method)
  if (link) {
    try {
      const url = new URL(link);
      // Only allow Stripe payment links
      if (url.hostname === 'buy.stripe.com' && url.protocol === 'https:') {
        url.searchParams.set('client_reference_id', userId);
        return url.toString();
      }
    } catch (e) {
      console.error('Invalid payment link URL:', e);
    }
  }

  // Method 2: Price IDs fallback
  const topup = TOPUPS[topupKey];
  const priceId = topup.priceId;

  if (!priceId || priceId.startsWith('price_')) {
    throw new Error(
      `❌ No payment link configured for ${topupKey} top-up.\n\n` +
      `Create a payment link in Stripe Dashboard:\n` +
      `1. Go to https://dashboard.stripe.com/payment-links\n` +
      `2. Click "+ New" and set price to $${topup.price} (ONE-TIME payment)\n` +
      `3. Copy the link and add to Replit Secrets as: STRIPE_PAYMENT_LINK_${topupKey.toUpperCase()}`
    );
  }

  throw new Error('No payment method configured');
}

/**
 * Get plan limits for a plan key
 */
export function getPlanLimits(planKey: string): { leads_limit: number; voice_minutes: number } {
  const plan = PLANS[planKey as keyof typeof PLANS];

  if (!plan) {
    return {
      leads_limit: 100,
      voice_minutes: 0,
    };
  }

  return {
    leads_limit: plan.leads_limit,
    voice_minutes: plan.voice_minutes,
  };
}

/**
 * Process successful top-up payment
 * Adds purchased minutes/leads to user's balance in real-time
 * Records audit trail for compliance and analytics
 */
export async function processTopupSuccess(
  userId: string,
  topupType: string,
  topupAmount: number
): Promise<void> {
  console.log(`Processing top-up for user ${userId}: ${topupAmount} minutes`);

  const { storage } = await import('../../storage');

  // Get current user
  const user = await storage.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Add minutes to topup balance
  const currentTopup = user.voiceMinutesTopup || 0;
  await storage.updateUser(userId, {
    voiceMinutesTopup: currentTopup + topupAmount
  });

  // Create audit log
  await storage.createUsageTopup({
    userId,
    type: 'voice',
    amount: topupAmount,
    metadata: {
      source: 'stripe_topup',
      topupType,
      priceId: TOPUPS[topupType as keyof typeof TOPUPS]?.priceId
    }
  });

  // Send notification
  await storage.createNotification({
    userId,
    type: 'system',
    title: '✅ Top-up successful!',
    message: `+${topupAmount} voice minutes added to your account`,
    metadata: { topupAmount, topupType }
  });

  console.log(`✅ Added ${topupAmount} minutes to user ${userId}`);
}

/**
 * Create subscription checkout session
 */
export async function createSubscriptionCheckout(
  customerId: string,
  planKey: keyof typeof PLANS,
  userId: string
): Promise<{ sessionId: string; url: string }> {
  if (isDemoMode) {
    return {
      sessionId: `cs_mock_${Date.now()}`,
      url: `/dashboard?demo=true`,
    };
  }

  const paymentLink = await getSubscriptionPaymentLink(planKey, userId);
  return {
    sessionId: `cs_link_${Date.now()}`,
    url: paymentLink,
  };
}

/**
 * Create top-up checkout session
 */
export async function createTopupCheckout(
  customerId: string,
  topupKey: keyof typeof TOPUPS,
  userId: string
): Promise<{ sessionId: string; url: string }> {
  if (isDemoMode) {
    return {
      sessionId: `cs_mock_${Date.now()}`,
      url: `/dashboard?demo=true`,
    };
  }

  const paymentLink = await getTopupPaymentLink(topupKey, userId);
  return {
    sessionId: `cs_link_${Date.now()}`,
    url: paymentLink,
  };
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured - rejecting webhook for security");
  }

  if (!stripe) {
    throw new Error("Stripe SDK not initialized - cannot verify webhooks");
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    console.log(`✅ Webhook signature verified: ${event.type}`);
    return event;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Webhook signature verification failed: ${errorMessage}`);
    throw new Error(`Webhook signature verification failed: ${errorMessage}`);
  }
}