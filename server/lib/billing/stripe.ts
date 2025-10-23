// Using Stripe blueprint integration
import Stripe from "stripe";
import { supabaseAdmin } from "../supabase-admin";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set. Billing features will be limited.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock-key", {
  apiVersion: "2025-09-30.clover",
});

export const isDemoMode = process.env.DISABLE_EXTERNAL_API === "true";

/**
 * Plan configurations
 */
export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_49 || "price_starter",
    name: "Starter",
    price: 49,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_49 || "2500"),
    voice_seconds: parseInt(process.env.VOICE_SECONDS_PLAN_49 || "100"),
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_99 || "price_pro",
    name: "Pro",
    price: 99,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_99 || "7000"),
    voice_seconds: parseInt(process.env.VOICE_SECONDS_PLAN_99 || "400"),
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY_199 || "price_enterprise",
    name: "Enterprise",
    price: 199,
    leads_limit: parseInt(process.env.LEADS_LIMIT_PLAN_199 || "20000"),
    voice_seconds: parseInt(process.env.VOICE_SECONDS_PLAN_199 || "1500"),
  },
};

/**
 * Top-up catalog
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
    price: 15,
  },
  voice_500: {
    priceId: process.env.STRIPE_PRICE_TOPUP_VOICE_500 || "price_voice_500",
    type: "voice" as const,
    amount: 500,
    price: 60,
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
export function getPlanLimits(planKey: string): { leads_limit: number; voice_seconds: number } {
  const plan = PLANS[planKey as keyof typeof PLANS];
  
  if (!plan) {
    return {
      leads_limit: 100,
      voice_seconds: 0,
    };
  }

  return {
    leads_limit: plan.leads_limit,
    voice_seconds: plan.voice_seconds,
  };
}

/**
 * Process successful top-up payment
 */
export async function processTopupSuccess(
  userId: string,
  topupType: "leads" | "voice",
  amount: number
): Promise<void> {
  if (!supabaseAdmin) {
    console.warn("Supabase not configured, skipping topup processing");
    return;
  }

  // Record top-up
  await supabaseAdmin.from("usage_topups").insert({
    user_id: userId,
    type: topupType,
    amount,
  });

  // Update user limits
  if (topupType === "leads") {
    await supabaseAdmin.rpc("increment_user_leads_limit", {
      p_user_id: userId,
      p_amount: amount,
    });
  } else if (topupType === "voice") {
    await supabaseAdmin.rpc("increment_user_voice_limit", {
      p_user_id: userId,
      p_amount: amount,
    });
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
