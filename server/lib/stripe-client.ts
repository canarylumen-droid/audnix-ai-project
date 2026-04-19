import Stripe from 'stripe';

let cachedStripeClient: Stripe | null = null;

/**
 * Get or create Stripe client (cached)
 * Uses standard environment variables
 */
export async function getStripeClient(): Promise<Stripe | null> {
  if (cachedStripeClient) {
    return cachedStripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('⚠️ Stripe Secret Key MISSING. Provide STRIPE_SECRET_KEY as an environment variable to enable billing features.');
    return null;
  }

  cachedStripeClient = new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });

  return cachedStripeClient;
}

/**
 * Reset cache (useful for testing)
 */
export function resetStripeClient(): void {
  cachedStripeClient = null;
}
