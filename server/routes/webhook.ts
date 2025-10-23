import { Request, Response, Router } from 'express';
import { stripe, verifyWebhookSignature, processTopupSuccess, PLANS } from '../lib/billing/stripe';
import { supabaseAdmin } from '../lib/supabase-admin';
import { storage } from '../storage';

const router = Router();

/**
 * Stripe webhook handler
 */
router.post('/webhook/stripe', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const event = await verifyWebhookSignature(
      (req as any).rawBody,
      sig
    );

    if (!event) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { userId, planId, isTopup } = session.metadata || {};

        if (!userId) {
          console.error('No userId in session metadata');
          return res.status(400).json({ error: 'Missing userId' });
        }

        if (isTopup === 'true') {
          // Handle topup purchase
          await processTopupSuccess(userId, session);
        } else if (planId) {
          // Handle subscription creation
          const plan = PLANS[planId as keyof typeof PLANS];
          if (!plan) {
            console.error('Invalid planId:', planId);
            return res.status(400).json({ error: 'Invalid plan' });
          }

          // Update user with Stripe customer ID and subscription
          await storage.updateUser(userId, {
            plan: planId as any,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            trialExpiresAt: null, // Clear trial
          });

          // Log payment
          if (supabaseAdmin) {
            await supabaseAdmin
              .from('payments')
              .insert({
                user_id: userId,
                stripe_payment_id: session.payment_intent as string,
                amount: session.amount_total,
                currency: session.currency,
                status: 'completed',
                plan: planId,
                payment_link: session.url,
                webhook_payload: event,
              });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userId = await getUserIdFromStripeCustomer(subscription.customer);
        
        if (userId) {
          // Update subscription status
          const status = subscription.status;
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          // Determine plan from subscription
          const planId = getPlanFromSubscription(subscription);
          
          await storage.updateUser(userId, {
            plan: status === 'active' ? planId : 'trial',
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = await getUserIdFromStripeCustomer(subscription.customer);
        
        if (userId) {
          // Downgrade to trial
          await storage.updateUser(userId, {
            plan: 'trial',
            stripeSubscriptionId: null,
            trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day grace period
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const userId = await getUserIdFromStripeCustomer(invoice.customer);
        
        if (userId && supabaseAdmin) {
          // Create notification for failed payment
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'billing_issue',
              title: 'Payment Failed',
              message: 'Your payment failed. Please update your payment method to continue using premium features.',
              action_url: '/dashboard/pricing',
            });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Lemon Squeezy webhook handler
 */
router.post('/webhook/lemonsqueezy', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return res.status(400).json({ error: 'Missing signature or secret' });
    }

    // Verify signature (simplified - in production use proper crypto)
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { meta, data } = req.body;
    const eventName = meta.event_name;

    switch (eventName) {
      case 'order_created': {
        const { user_email, user_name, product_id, variant_id } = data.attributes;
        
        // Find user by email
        const user = await storage.getUserByEmail(user_email);
        if (!user) {
          console.error('User not found:', user_email);
          return res.status(404).json({ error: 'User not found' });
        }

        // Map Lemon Squeezy product/variant to plan
        const plan = mapLemonSqueezyToPlan(product_id, variant_id);
        
        // Update user plan
        await storage.updateUser(user.id, {
          plan: plan as any,
          trialExpiresAt: null,
        });

        // Log payment
        if (supabaseAdmin) {
          await supabaseAdmin
            .from('payments')
            .insert({
              user_id: user.id,
              stripe_payment_id: data.id, // Use Lemon Squeezy order ID
              amount: data.attributes.total,
              currency: data.attributes.currency,
              status: 'completed',
              plan: plan,
              webhook_payload: req.body,
            });
        }
        break;
      }

      case 'subscription_created':
      case 'subscription_updated': {
        const { user_email, status, product_id, variant_id } = data.attributes;
        
        const user = await storage.getUserByEmail(user_email);
        if (!user) break;

        const plan = mapLemonSqueezyToPlan(product_id, variant_id);
        
        await storage.updateUser(user.id, {
          plan: status === 'active' ? plan as any : 'trial',
        });
        break;
      }

      case 'subscription_cancelled': {
        const { user_email } = data.attributes;
        
        const user = await storage.getUserByEmail(user_email);
        if (!user) break;

        await storage.updateUser(user.id, {
          plan: 'trial',
          trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Lemon Squeezy webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Generic payment webhook (for custom integrations)
 */
router.post('/webhook/payment', async (req: Request, res: Response) => {
  try {
    const { provider } = req.query;

    if (provider === 'stripe') {
      // Delegate to Stripe handler
      return router.handle(req, res);
    } else if (provider === 'lemonsqueezy') {
      // Delegate to Lemon Squeezy handler
      return router.handle(req, res);
    } else {
      return res.status(400).json({ error: 'Unknown payment provider' });
    }
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper functions
async function getUserIdFromStripeCustomer(customerId: string): Promise<string | null> {
  const user = await storage.getUserByStripeCustomerId(customerId);
  return user?.id || null;
}

function getPlanFromSubscription(subscription: any): string {
  // Map Stripe price IDs to plans
  const priceId = subscription.items.data[0]?.price.id;
  const priceToPlan: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID || '']: 'starter',
    [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'enterprise',
  };
  
  return priceToPlan[priceId] || 'trial';
}

function mapLemonSqueezyToPlan(productId: string, variantId: string): string {
  // Map Lemon Squeezy products/variants to plans
  // This mapping would be configured based on your Lemon Squeezy products
  const mapping: Record<string, string> = {
    '12345_starter': 'starter',
    '12345_pro': 'pro',
    '12345_enterprise': 'enterprise',
  };
  
  return mapping[`${productId}_${variantId}`] || 'trial';
}

export default router;