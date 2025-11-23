/* @ts-nocheck */
import Stripe from 'stripe';

let cachedStripeClient: Stripe | null = null;

/**
 * Get or create Stripe client from env var (for Vercel)
 * Uses STRIPE_SECRET_KEY set in Vercel environment
 */
export async function getStripeClient(): Promise<Stripe | null> {
  if (cachedStripeClient) {
    return cachedStripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY not set. Set it in Vercel environment variables.');
    return null;
  }

  cachedStripeClient = new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });

  console.log('✅ Stripe client initialized');
  return cachedStripeClient;
}

/**
 * Reset cache (useful for testing)
 */
export function resetStripeClient() {
  cachedStripeClient = null;
}
