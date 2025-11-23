/* @ts-nocheck */
import Stripe from 'stripe';

let connectionSettings: any = null;
let cachedStripeClient: Stripe | null = null;

/**
 * Fetch Stripe credentials from Replit connection
 */
async function getStripeCredentials() {
  if (connectionSettings) {
    return connectionSettings.settings;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  // If no Replit token, fall back to env var
  if (!xReplitToken || !hostname) {
    if (process.env.STRIPE_SECRET_KEY) {
      return { secret: process.env.STRIPE_SECRET_KEY };
    }
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
    connectionSettings = data.items?.[0];

    if (connectionSettings?.settings?.secret) {
      return connectionSettings.settings;
    }

    // Fallback to env var if connection fetch fails
    if (process.env.STRIPE_SECRET_KEY) {
      return { secret: process.env.STRIPE_SECRET_KEY };
    }

    return null;
  } catch (error) {
    console.warn('Failed to fetch Stripe from Replit connection, falling back to env var');
    if (process.env.STRIPE_SECRET_KEY) {
      return { secret: process.env.STRIPE_SECRET_KEY };
    }
    return null;
  }
}

/**
 * Get or create Stripe client (cached)
 */
export async function getStripeClient(): Promise<Stripe | null> {
  if (cachedStripeClient) {
    return cachedStripeClient;
  }

  const credentials = await getStripeCredentials();
  if (!credentials?.secret) {
    return null;
  }

  cachedStripeClient = new Stripe(credentials.secret, {
    apiVersion: '2025-08-27.basil',
  });

  return cachedStripeClient;
}

/**
 * Reset cache (useful for testing)
 */
export function resetStripeClient() {
  cachedStripeClient = null;
  connectionSettings = null;
}
