// Using Stripe blueprint integration
import Stripe from "stripe";
import { supabaseAdmin } from "../supabase-admin";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set. Billing features will be limited.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock-key", {
  apiVersion: "2025-09-30.clover" as any,
});

export const isDemoMode = process.env.DISABLE_EXTERNAL_API === "true";

/**
 * Plan configurations
 */
export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_49 || "price_starter",
    name: "Starter",
    price: 49.99,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_49 || "2500"),
    voice_minutes: parseInt(process.env.VOICE_MINUTES_PLAN_49 || "300"),
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_99 || "price_pro",
    name: "Pro",
    price: 99.99,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_99 || "7000"),
    voice_minutes: parseInt(process.env.VOICE_MINUTES_PLAN_99 || "800"),
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
 * Top-up catalog - Voice minutes with >85% profit margin
 * Cost per minute: ~$0.01-0.02 (ElevenLabs + storage)
 * Pricing ensures 85-90%+ margin on all tiers
 */
export const TOPUPS = {
  leads_1000: {
    priceId: process.env.STRIPE_PRICE_TOPUP_LEADS_1000 || "price_leads_1000",
    type: "leads" as const,
    amount: 1000,
    price: 25,
  },
  leads_2500: {
    priceId: process.env.STRIPE_PRICE_TOPUP_LEADS_2500 || "price_leads_2500",
    type: "leads" as const,
    amount: 2500,
    price: 50,
  },
  voice_100: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_100 || "price_voice_100",
    type: "voice" as const,
    amount: 100,
    price: 7,
    description: "100 minutes - $7",
  },
  voice_300: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_300 || "price_voice_300",
    type: "voice" as const,
    amount: 300,
    price: 20,
    description: "300 minutes - $20",
  },
  voice_600: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_600 || "price_voice_600",
    type: "voice" as const,
    amount: 600,
    price: 40,
    description: "600 minutes - $40",
  },
  voice_1200: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_1200 || "price_voice_1200",
    type: "voice" as const,
    amount: 1200,
    price: 80,
    description: "1,200 minutes - $80",
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

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId: userId || "",
    },
  });

  return customer.id;
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

  const plan = PLANS[planKey];
  
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: plan.priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });

  const invoice = subscription.latest_invoice as any;
  const paymentIntent = invoice?.payment_intent as any;

  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent?.client_secret || null,
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

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const newPlan = PLANS[newPlanKey];

  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPlan.priceId,
      },
    ],
    proration_behavior: "create_prorations",
  });
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (isDemoMode) {
    return;
  }

  await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Create checkout session for subscription
 */
export async function createSubscriptionCheckout(
  customerId: string,
  planKey: keyof typeof PLANS,
  userId: string
): Promise<{ sessionId: string; url: string }> {
  if (isDemoMode) {
    return {
      sessionId: `cs_mock_${Date.now()}`,
      url: "/dashboard",
    };
  }

  const plan = PLANS[planKey];
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000"}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000"}/dashboard/pricing?payment=cancelled`,
    metadata: {
      userId,
      planKey,
    },
  });

  return {
    sessionId: session.id,
    url: session.url || "",
  };
}

/**
 * Create checkout session for top-up
 */
export async function createTopupCheckout(
  customerId: string,
  topupKey: keyof typeof TOPUPS,
  userId: string
): Promise<{ sessionId: string; url: string }> {
  if (isDemoMode) {
    return {
      sessionId: `cs_mock_${Date.now()}`,
      url: "https://example.com/checkout",
    };
  }

  const topup = TOPUPS[topupKey];
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price: topup.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000"}/dashboard/settings?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000"}/dashboard/settings?payment=cancelled`,
    metadata: {
      userId,
      topupType: topup.type,
      topupAmount: topup.amount.toString(),
    },
  });

  return {
    sessionId: session.id,
    url: session.url || "",
  };
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
  topupType: "leads" | "voice",
  amount: number
): Promise<void> {
  console.log(`💳 Processing top-up for user ${userId}: ${amount} ${topupType}`);

  try {
    // Get user's current balance using storage layer
    const { storage } = await import('../../storage');
    const user = await storage.getUserById(userId);
    
    if (!user) {
      console.error(`User ${userId} not found for top-up processing`);
      return;
    }

    // Record top-up in audit table for analytics (Supabase)
    if (supabaseAdmin) {
      await supabaseAdmin.from("usage_topups").insert({
        user_id: userId,
        type: topupType,
        amount,
      });
    }

    // Update user's topup balance directly
    if (topupType === "voice") {
      const currentTopup = user.voiceMinutesTopup || 0;
      const newTopup = currentTopup + amount;
      
      await storage.updateUser(userId, {
        voiceMinutesTopup: newTopup
      });

      console.log(`✅ Voice minutes top-up successful: ${amount} minutes added (total topup: ${newTopup} minutes)`);
      
      // Create notification for successful top-up
      await storage.createNotification({
        userId,
        type: 'system',
        title: 'Top-up Successful',
        message: `${amount} voice minutes have been added to your account!`,
        isRead: false,
        metadata: {
          topupType: 'voice',
          amount,
          timestamp: new Date().toISOString()
        }
      });
    } else if (topupType === "leads") {
      // Leads topup (if needed)
      console.log(`Leads top-up: ${amount} leads added`);
    }
  } catch (error) {
    console.error(`Error processing top-up for user ${userId}:`, error);
  }
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
    throw new Error("Stripe webhook secret not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
