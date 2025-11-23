/* @ts-nocheck */

/**
 * Stripe Poller Scheduler - Runs on every request (lazy triggering)
 * 
 * Instead of setInterval (doesn't work on Vercel serverless),
 * we trigger the poller on every incoming request if it's been >1 minute since last run.
 * This is non-blocking (runs in background), so it doesn't slow down requests.
 */

import { pollStripePayments } from './stripe-payment-poller';

let lastPolledAt = 0;
const POLL_INTERVAL = 60 * 1000; // 1 minute

/**
 * Trigger poller if enough time has passed (non-blocking)
 * DISABLED: Using manual admin approvals instead (no API key needed)
 */
export async function triggerStripePollerIfNeeded() {
  // Poller disabled - using manual admin approval system
  return;
}

/**
 * Middleware to attach to Express app
 * Triggers polling on every request (safe, non-blocking)
 */
export function stripePollerMiddleware(req, res, next) {
  // Trigger poller in background
  triggerStripePollerIfNeeded();
  
  // Continue with request immediately
  next();
}

/**
 * Get last poll time for debugging
 */
export function getLastPolledAt() {
  return new Date(lastPolledAt).toISOString();
}

/**
 * Manually trigger poller (for testing)
 */
export async function manuallyTriggerPoller() {
  console.log('🔄 Manually triggering Stripe poller...');
  lastPolledAt = 0; // Reset timer so it runs immediately
  await pollStripePayments();
}
