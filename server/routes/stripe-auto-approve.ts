/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Only initialize Stripe if API key is provided
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey, {
  apiVersion: '2023-10-16',
}) : null;

// Track pending approvals in memory (or use database for persistence)
const pendingApprovals = new Map<string, { sessionId: string; userId: string; email: string; amount: number; createdAt: Date }>();

/**
 * POST /api/stripe/admin/pending-approvals
 * Get all payments waiting for admin approval
 */
router.get('/admin/pending-approvals', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const approvals = Array.from(pendingApprovals.values());

    res.json({
      success: true,
      count: approvals.length,
      approvals: approvals.map(a => ({
        sessionId: a.sessionId,
        email: a.email,
        amount: a.amount,
        createdAt: a.createdAt,
        timeAgo: Math.floor((Date.now() - a.createdAt.getTime()) / 1000),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/stripe/admin/auto-approve
 * Admin approves payment → User instantly upgraded (NO POLLER)
 * Button auto-approves within 5 seconds
 */
router.post('/admin/auto-approve', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }
    const { sessionId, userId } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({ error: 'Session ID and User ID required' });
    }

    // Step 1: Verify payment was completed
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        status: session.payment_status,
      });
    }

    // Step 2: Get or create subscription
    let subscriptionId = session.subscription as string;

    if (!subscriptionId && session.line_items) {
      // If no subscription yet, create one (for manual subscriptions)
      const items = await stripe.checkout.sessions.listLineItems(sessionId);
      const priceId = items.data[0]?.price?.id;

      if (priceId) {
        const subscription = await stripe.subscriptions.create({
          customer: session.customer as string,
          items: [{ price: priceId }],
        });
        subscriptionId = subscription.id;
      }
    }

    // Step 3: Update user plan in database
    const planMap: Record<string, string> = {
      'price_starter': 'starter',
      'price_pro': 'pro',
      'price_enterprise': 'enterprise',
    };

    const priceId = session.line_items?.data[0]?.price?.id || '';
    const plan = planMap[priceId] || 'pro';

    const user = await storage.updateUser(userId, {
      plan,
      subscriptionId,
      trialEndsAt: null, // Remove trial
      paidAt: new Date().toISOString(),
    });

    // Step 4: Remove from pending approvals
    pendingApprovals.delete(sessionId);

    // Step 5: Return success (auto-click happens in 5 seconds on frontend)
    res.json({
      success: true,
      message: 'User upgraded instantly',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        subscriptionId: subscriptionId,
      },
      autoClickIn: '5 seconds',
    });

    console.log(`✅ Admin approved payment for ${user.email} → Plan: ${plan}`);
  } catch (error: any) {
    console.error('Auto-approve error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/stripe/admin/mark-pending
 * Internal: Mark payment as pending approval (called after payment completion)
 */
router.post('/admin/mark-pending', async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, email, amount } = req.body;

    if (!sessionId || !userId || !email || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    pendingApprovals.set(sessionId, {
      sessionId,
      userId,
      email,
      amount,
      createdAt: new Date(),
    });

    res.json({ success: true, message: 'Payment marked as pending approval' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
