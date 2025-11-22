
import { stripe } from '../billing/stripe';
import { storage } from '../../storage';
import { supabaseAdmin } from '../supabase-admin';

/**
 * Poll Stripe for recent successful payments and auto-upgrade users
 * Runs every 5 minutes as a fallback to webhooks
 */
export async function pollStripePayments() {
  if (!stripe) {
    console.log('⏭️  Stripe not configured - skipping payment poll');
    return;
  }

  try {
    console.log('🔍 Polling Stripe for new payments...');

    // Get payments from last 2 minutes (faster polling, checking for recent payments)
    const twoMinutesAgo = Math.floor(Date.now() / 1000) - 120;

    const payments = await stripe.paymentIntents.list({
      created: { gte: twoMinutesAgo },
      limit: 100,
    });

    let upgraded = 0;

    for (const payment of payments.data) {
      if (payment.status !== 'succeeded') continue;

      // Get customer details
      const customerId = payment.customer as string;
      if (!customerId) continue;

      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) continue;

      const email = customer.email;
      if (!email) continue;

      // Check if user exists and needs upgrade
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`⚠️  Payment for unknown user: ${email}`);
        continue;
      }

      // Skip if already upgraded
      if (user.plan !== 'trial' && user.plan !== 'free') {
        continue;
      }

      // Determine plan from payment amount
      const amount = payment.amount / 100; // Convert cents to dollars
      let plan: 'starter' | 'pro' | 'enterprise' = 'starter';
      let voiceMinutes = 100;

      if (amount >= 199) {
        plan = 'enterprise';
        voiceMinutes = 1000;
      } else if (amount >= 99) {
        plan = 'pro';
        voiceMinutes = 400;
      } else if (amount >= 49) {
        plan = 'starter';
        voiceMinutes = 100;
      }

      // Upgrade user
      await storage.updateUser(user.id, {
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: payment.id, // Use payment ID if no subscription
        trialExpiresAt: null,
        voiceMinutesPlan: voiceMinutes,
      });

      // Create notification
      if (supabaseAdmin) {
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          type: 'system',
          title: `Payment Successful - Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan!`,
          message: `Your $${amount} payment was processed. All premium features are now unlocked.`,
          action_url: '/dashboard',
        });
      }

      console.log(`✅ Auto-upgraded ${email} to ${plan} plan`);
      upgraded++;
    }

    if (upgraded > 0) {
      console.log(`🎉 Auto-upgraded ${upgraded} users from Stripe payments`);
    }
  } catch (error) {
    console.error('❌ Error polling Stripe payments:', error);
  }
}

// Run every 1 minute (faster upgrades, better user experience)
export function startStripePaymentPoller() {
  console.log('🤖 Starting Stripe payment poller (runs every 1 minute for faster upgrades)');
  
  // Run immediately on startup
  pollStripePayments();

  // Then every 1 minute
  setInterval(pollStripePayments, 1 * 60 * 1000);
}
