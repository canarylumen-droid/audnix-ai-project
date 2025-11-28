import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import { stripe, verifyWebhookSignature, processTopupSuccess, PLANS } from '../lib/billing/stripe.js';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { storage } from '../storage.js';
import { handleCalendlyWebhook, handleCalendlyVerification, verifyCalendlySignature } from '../lib/webhooks/calendly-webhook.js';
import type { PlanType } from '../../shared/types.js';

const router = Router();

interface LemonSqueezyWebhookMeta {
  event_name: string;
  custom_data?: Record<string, unknown>;
}

interface LemonSqueezyOrderAttributes {
  user_email: string;
  user_name?: string;
  product_id: string;
  variant_id: string;
  total: number;
  currency: string;
  status?: string;
}

interface LemonSqueezySubscriptionAttributes {
  user_email: string;
  status: string;
  product_id: string;
  variant_id: string;
}

interface LemonSqueezyWebhookData {
  id: string;
  attributes: LemonSqueezyOrderAttributes | LemonSqueezySubscriptionAttributes;
}

interface LemonSqueezyWebhookPayload {
  meta: LemonSqueezyWebhookMeta;
  data: LemonSqueezyWebhookData;
}

interface CheckoutSessionMetadata {
  userId?: string;
  planKey?: string;
  topupType?: string;
  topupAmount?: string;
}

/**
 * Calendly webhook handler
 */
router.post('/webhook/calendly', async (req: Request, res: Response): Promise<void> => {
  if (req.body?.webhook_used_for_testing) {
    handleCalendlyVerification(req, res);
    return;
  }

  await handleCalendlyWebhook(req, res);
});

/**
 * Stripe webhook handler
 */
router.post('/webhook/stripe', async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    const event = verifyWebhookSignature(
      req.body as string | Buffer,
      sig
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = (session.metadata || {}) as CheckoutSessionMetadata;
        const { userId, planKey, topupType } = metadata;

        if (!userId) {
          console.error('No userId in session metadata');
          res.status(400).json({ error: 'Missing userId' });
          return;
        }

        if (topupType) {
          const topupAmount = metadata.topupAmount;
          await processTopupSuccess(userId, topupType, parseInt(topupAmount || '0'));
        } else if (planKey) {
          const plan = PLANS[planKey as keyof typeof PLANS];
          if (!plan) {
            console.error('Invalid planKey:', planKey);
            res.status(400).json({ error: 'Invalid plan' });
            return;
          }

          const stripeCustomerId = typeof session.customer === 'string' 
            ? session.customer 
            : (session.customer as Stripe.Customer | Stripe.DeletedCustomer | null)?.id ?? undefined;
          const stripeSubscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : (session.subscription as Stripe.Subscription | null)?.id ?? undefined;
          
          await storage.updateUser(userId, {
            plan: planKey as PlanType,
            stripeCustomerId,
            stripeSubscriptionId,
            trialExpiresAt: null,
          });

          console.log(`✓ User ${userId} upgraded to ${planKey} plan - features unlocked`);

          const planNames: Record<string, string> = {
            starter: 'Starter ($49)',
            pro: 'Pro ($99)',
            enterprise: 'Enterprise ($199)',
          };

          if (supabaseAdmin) {
            await supabaseAdmin
              .from('payments')
              .insert({
                user_id: userId,
                stripe_payment_id: session.payment_intent ?? undefined,
                amount: session.amount_total,
                currency: session.currency,
                status: 'completed',
                plan: planKey,
                payment_link: session.url,
                webhook_payload: event,
              });

            await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: userId,
                type: 'system',
                title: `Upgraded to ${planNames[planKey] || planKey} Plan`,
                message: `Congratulations! Your payment was successful and you've been upgraded to the ${planNames[planKey] || planKey} plan. All premium features are now unlocked.`,
                action_url: '/dashboard',
                metadata: { plan: planKey, upgrade: true },
              });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : (subscription.customer as Stripe.Customer).id;
        const userId = await getUserIdFromStripeCustomer(customerId);
        
        if (userId) {
          const status = subscription.status;
          const planId = getPlanFromSubscription(subscription);
          
          await storage.updateUser(userId, {
            plan: status === 'active' ? planId as PlanType : 'trial',
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : (subscription.customer as Stripe.Customer).id;
        const userId = await getUserIdFromStripeCustomer(customerId);
        
        if (userId) {
          await storage.updateUser(userId, {
            plan: 'trial',
            stripeSubscriptionId: null,
            trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' 
          ? invoice.customer 
          : (invoice.customer as Stripe.Customer)?.id;
        
        if (customerId) {
          const userId = await getUserIdFromStripeCustomer(customerId);
          
          if (userId && supabaseAdmin) {
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
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('signature') || errorMessage.includes('STRIPE_WEBHOOK_SECRET')) {
      res.status(400).json({ error: 'Webhook signature verification failed' });
      return;
    }
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Lemon Squeezy webhook handler
 */
router.post('/webhook/lemonsqueezy', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-signature'] as string;
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      res.status(400).json({ error: 'Missing signature or secret' });
      return;
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const payload = req.body as LemonSqueezyWebhookPayload;
    const { meta, data } = payload;
    const eventName = meta.event_name;

    switch (eventName) {
      case 'order_created': {
        const attributes = data.attributes as LemonSqueezyOrderAttributes;
        const { user_email, product_id, variant_id } = attributes;
        
        const user = await storage.getUserByEmail(user_email);
        if (!user) {
          console.error('User not found:', user_email);
          res.status(404).json({ error: 'User not found' });
          return;
        }

        const plan = mapLemonSqueezyToPlan(product_id, variant_id);
        
        await storage.updateUser(user.id, {
          plan: plan as PlanType,
          trialExpiresAt: null,
        });

        if (supabaseAdmin) {
          await supabaseAdmin
            .from('payments')
            .insert({
              user_id: user.id,
              stripe_payment_id: data.id,
              amount: attributes.total,
              currency: attributes.currency,
              status: 'completed',
              plan: plan,
              webhook_payload: req.body,
            });
        }
        break;
      }

      case 'subscription_created':
      case 'subscription_updated': {
        const attributes = data.attributes as LemonSqueezySubscriptionAttributes;
        const { user_email, status, product_id, variant_id } = attributes;
        
        const user = await storage.getUserByEmail(user_email);
        if (!user) break;

        const plan = mapLemonSqueezyToPlan(product_id, variant_id);
        
        await storage.updateUser(user.id, {
          plan: status === 'active' ? plan as PlanType : 'trial',
        });
        break;
      }

      case 'subscription_cancelled': {
        const attributes = data.attributes as LemonSqueezySubscriptionAttributes;
        const { user_email } = attributes;
        
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
  } catch (error: unknown) {
    console.error('Lemon Squeezy webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Generic payment webhook (for custom integrations)
 */
router.post('/webhook/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.query;

    if (provider === 'stripe') {
      req.url = '/webhook/stripe';
      return;
    } else if (provider === 'lemonsqueezy') {
      req.url = '/webhook/lemonsqueezy';
      return;
    } else {
      res.status(400).json({ error: 'Unknown payment provider' });
      return;
    }
  } catch (error: unknown) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function getUserIdFromStripeCustomer(customerId: string): Promise<string | null> {
  try {
    const users = await storage.getAllUsers();
    const user = users.find(u => u.stripeCustomerId === customerId);
    return user?.id || null;
  } catch (error: unknown) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }
}

function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id;
  const priceToPlan: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID || '']: 'starter',
    [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'enterprise',
  };
  
  return priceToPlan[priceId] || 'trial';
}

function mapLemonSqueezyToPlan(productId: string, variantId: string): string {
  const mapping: Record<string, string> = {
    '12345_starter': 'starter',
    '12345_pro': 'pro',
    '12345_enterprise': 'enterprise',
  };
  
  return mapping[`${productId}_${variantId}`] || 'trial';
}

export default router;
