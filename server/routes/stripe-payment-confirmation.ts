/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

const router = Router();

// Only initialize Stripe if API key is provided
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey, {
  apiVersion: '2023-10-16',
}) : null;

/**
 * POST /api/stripe/confirm-payment
 * Real-time payment confirmation (no Replit dependency)
 * Works anywhere: Vercel, local, any server
 */
router.post('/confirm-payment', async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const { sessionId, subscriptionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: session.payment_status,
      });
    }

    // Get subscription details
    let subscription = null;
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    }

    res.json({
      success: true,
      paymentStatus: session.payment_status,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        items: subscription.items.data.map(item => ({
          priceId: item.price.id,
          product: item.price.product,
          amount: item.price.unit_amount,
          currency: item.price.currency,
        })),
      } : null,
      customerEmail: session.customer_details?.email,
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Confirmation failed',
    });
  }
});

/**
 * POST /api/stripe/verify-subscription
 * Verify user subscription status
 */
router.post('/verify-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    res.json({
      success: true,
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan: subscription.items.data[0]?.price?.nickname,
    });
  } catch (error: any) {
    console.error('Subscription verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/stripe/admin/bypass-check
 * Admin dashboard: Check if payment bypass attempted
 * Returns: payment was legitimate or fraudulent
 */
router.post('/admin/bypass-check', async (req: Request, res: Response) => {
  try {
    const { sessionId, expectedAmount } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify amount matches expected
    const amountMismatch = expectedAmount && session.amount_total !== expectedAmount * 100;

    // Check for fraud indicators
    const fraudIndicators = {
      paymentStatusNotPaid: session.payment_status !== 'paid',
      amountMismatch,
      noCustomer: !session.customer_details?.email,
      sessionExpired: new Date(session.created * 1000).getTime() < Date.now() - 24 * 60 * 60 * 1000,
    };

    const isFraudulent = Object.values(fraudIndicators).some(v => v);

    res.json({
      success: true,
      legitimate: !isFraudulent,
      fraudIndicators,
      sessionDetails: {
        id: session.id,
        paymentStatus: session.payment_status,
        amount: session.amount_total / 100,
        currency: session.currency,
        customer: session.customer_details?.email,
        createdAt: new Date(session.created * 1000),
      },
    });
  } catch (error: any) {
    console.error('Bypass check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
