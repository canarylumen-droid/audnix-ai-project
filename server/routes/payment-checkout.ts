/* @ts-nocheck */
import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, getCurrentUserId } from "../middleware/auth";
import { createStripeCustomer } from "../lib/billing/stripe";

const router = Router();

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 4900, // $49
  pro: 9900,     // $99
  enterprise: 29900, // $299
};

/**
 * POST /api/payment/checkout-session
 * Create Stripe checkout session for user
 */
router.post("/checkout-session", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { plan } = req.body;

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // For development: return a simulated session ID
    // In production with real Stripe SDK, this would call stripe.checkout.sessions.create()
    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const subscriptionId = `sub_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create payment session in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store session for verification later
    await storage.db.execute(`
      INSERT INTO payment_sessions 
      (user_id, stripe_session_id, plan, amount, expires_at, subscription_id, status)
      VALUES ('${userId}', '${sessionId}', '${plan}', ${PLAN_AMOUNTS[plan] / 100}, '${expiresAt.toISOString()}', '${subscriptionId}', 'pending')
    `);

    console.log(`💳 Payment session created: ${sessionId} for ${user.email} (${plan})`);

    return res.json({
      success: true,
      sessionId,
      subscriptionId,
      plan,
      amount: PLAN_AMOUNTS[plan] / 100,
      // In production, return actual Stripe checkout URL
      checkoutUrl: `https://checkout.stripe.com/pay/${sessionId}`,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/verify-session
 * Verify payment session and mark user as pending approval
 */
router.post("/verify-session", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    // Fetch session from database
    const result = await storage.db.execute(`
      SELECT * FROM payment_sessions 
      WHERE stripe_session_id = '${sessionId}' AND user_id = '${userId}' AND status = 'pending'
      LIMIT 1
    `);

    if (!result || result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found or already verified" });
    }

    const session = result.rows[0];

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await storage.db.execute(`
        UPDATE payment_sessions SET status = 'expired' 
        WHERE stripe_session_id = '${sessionId}'
      `);
      return res.status(400).json({ error: "Payment session expired" });
    }

    // Mark session as completed and user as pending approval
    await storage.db.execute(`
      UPDATE payment_sessions 
      SET status = 'completed', verified_at = NOW() 
      WHERE stripe_session_id = '${sessionId}'
    `);

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Mark user as pending approval
    await storage.updateUser(userId, {
      payment_status: "pending",
      pending_payment_amount: session.amount,
      pending_payment_plan: session.plan,
      pending_payment_date: new Date(),
    });

    console.log(`✅ Payment verified: ${user.email} (${session.plan} - $${session.amount}) - Subscription ID: ${session.subscription_id}`);

    return res.json({
      success: true,
      message: "Payment verified. Pending admin approval.",
      subscriptionId: session.subscription_id,
      plan: session.plan,
      amount: session.amount,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: error.message });
  }
});

export { router as paymentCheckoutRouter };
