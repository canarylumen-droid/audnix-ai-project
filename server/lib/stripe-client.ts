/* @ts-nocheck */
import Stripe from 'stripe';

let cachedStripeClient: Stripe | null = null;

/**
 * Fetch Stripe credentials from Replit connection ONLY
 * No env vars needed - uses Replit's secure connection
 */
async function getStripeCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken || !hostname) {
    console.log('⏭️  Replit connection not available - Stripe disabled');
    return null;
  }

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
      return connectionSettings.settings.secret;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get or create Stripe client (cached)
 * Uses ONLY Replit connection - no API keys needed
 */
export async function getStripeClient(): Promise<Stripe | null> {
  if (cachedStripeClient) {
    return cachedStripeClient;
  }

  const secretKey = await getStripeCredentials();
  
  if (!secretKey) {
    return null;
  }

  cachedStripeClient = new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });

  return cachedStripeClient;
}

/**
 * Reset cache (useful for testing)
 */
export function resetStripeClient() {
  cachedStripeClient = null;
}
