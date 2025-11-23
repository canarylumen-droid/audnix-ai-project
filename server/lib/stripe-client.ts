/* @ts-nocheck */
import Stripe from 'stripe';

let cachedStripeClient: Stripe | null = null;

/**
 * Fetch Stripe credentials with intelligent fallback
 * 1. Try env var (Vercel)
 * 2. Fallback: Try Replit connection (test key)
 * 3. If both fail: Return null (payments disabled gracefully)
 */
async function getStripeCredentials() {
  // First try env var (Vercel production)
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }

  // Try Replit connection (development or if no env var)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (xReplitToken && hostname) {
    try {
      const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
      const targetEnvironment = isProduction ? 'production' : 'development';

      const url = new URL(`https://${hostname}/api/v2/connection`);
      url.searchParams.set('include_secrets', 'true');
      url.searchParams.set('connector_names', 'stripe');
      url.searchParams.set('environment', targetEnvironment);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      });

      const data = await response.json();
      const connectionSettings = data.items?.[0];

      if (connectionSettings?.settings?.secret) {
        console.log('✅ Using Stripe credentials from Replit connection');
        return connectionSettings.settings.secret;
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch Stripe from Replit connection');
    }
  }

  // No credentials found
  return null;
}

/**
 * Get or create Stripe client (cached)
 */
export async function getStripeClient(): Promise<Stripe | null> {
  if (cachedStripeClient) {
    return cachedStripeClient;
  }

  const secretKey = await getStripeCredentials();
  
  if (!secretKey) {
    console.log('⏭️  Stripe not configured - payments disabled');
    return null;
  }

  cachedStripeClient = new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });

  console.log('✅ Stripe client initialized (test or live mode)');
  return cachedStripeClient;
}

/**
 * Reset cache (useful for testing)
 */
export function resetStripeClient() {
  cachedStripeClient = null;
}
