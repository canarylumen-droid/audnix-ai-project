import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, getCurrentUserId } from "../middleware/auth";

const router = Router();

/**
 * GET /api/payment-approval/pending
 * Admin: Get all pending payment approvals (NO API KEY NEEDED)
 */
router.get("/pending", requireAuth, async (req: Request, res: Response) => {
  try {
    const adminId = getCurrentUserId(req);
    const admin = await storage.getUserById(adminId!);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    // Query database for pending payments (no API key needed)
    const users = await storage.getAllUsers();
    const pending = users
      .filter((u: any) => u.paymentStatus === "pending")
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.pendingPaymentPlan,
        amount: u.pendingPaymentAmount,
        pendingDate: u.pendingPaymentDate,
        subscriptionId: u.subscriptionId,
        sessionId: u.stripeSessionId,
      }));

    return res.json({ pending });
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payment-approval/stats
 * Admin: Get payment statistics
 */
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const adminId = getCurrentUserId(req);
    const admin = await storage.getUserById(adminId!);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const users = await storage.getAllUsers();
    const stats = {
      trial_users: users.filter((u: any) => u.plan === "trial").length,
      starter_users: users.filter((u: any) => u.plan === "starter").length,
      pro_users: users.filter((u: any) => u.plan === "pro").length,
      enterprise_users: users.filter((u: any) => u.plan === "enterprise").length,
      total_users: users.length,
      pending_approvals: users.filter((u: any) => u.paymentStatus === "pending").length,
      approved_payments: users.filter((u: any) => u.paymentStatus === "approved").length,
    };

    return res.json({ stats });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment-approval/approve/:userId
 * Admin: Approve a pending payment and upgrade user
 * NO API KEY NEEDED - only database operations
 */
router.post("/approve/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const adminId = getCurrentUserId(req);
    const { userId } = req.params;

    // Verify admin
    const admin = await storage.getUserById(adminId!);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    // Get user
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.paymentStatus !== "pending") {
      return res.status(400).json({ error: "User is not pending approval" });
    }

    const plan = user.pendingPaymentPlan as any;

    // Upgrade user - store in database only
    await storage.updateUser(userId, {
      plan,
      paymentStatus: "approved",
      pendingPaymentPlan: null,
      pendingPaymentAmount: null,
      pendingPaymentDate: null,
      paymentApprovedAt: new Date(),
    });

    console.log(`✅ Admin ${admin.email} approved payment for ${user.email} → ${plan} plan`);

    res.json({
      success: true,
      message: `User upgraded to ${plan} plan`,
      user: {
        id: user.id,
        email: user.email,
        plan,
      },
    });
  } catch (error: any) {
    console.error("Error approving payment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment-approval/reject/:userId
 * Admin: Reject a pending payment
 */
router.post("/reject/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const adminId = getCurrentUserId(req);
    const { userId } = req.params;
    const { reason } = req.body;

    // Verify admin
    const admin = await storage.getUserById(adminId!);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    // Get user
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Mark as rejected (stays in trial)
    await storage.updateUser(userId, {
      paymentStatus: "rejected",
      pendingPaymentPlan: null,
      pendingPaymentAmount: null,
      pendingPaymentDate: null,
    });

    console.log(`❌ Admin ${admin.email} rejected payment for ${user.email}. Reason: ${reason}`);

    res.json({
      success: true,
      message: "Payment rejected",
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (error: any) {
    console.error("Error rejecting payment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment-approval/mark-pending
 * Internal: Mark payment as pending (called after user initiates payment)
 * NO API KEY NEEDED
 */
router.post("/mark-pending", async (req: Request, res: Response) => {
  try {
    const { userId, plan, amount, sessionId, subscriptionId } = req.body;

    if (!userId || !plan || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store pending payment in database
    await storage.updateUser(userId, {
      paymentStatus: "pending",
      pendingPaymentPlan: plan,
      pendingPaymentAmount: amount,
      pendingPaymentDate: new Date(),
      stripeSessionId: sessionId || null,
      subscriptionId: subscriptionId || null,
    });

    console.log(`💳 Payment marked as pending for user ${userId} → ${plan} plan ($${amount})`);

    res.json({
      success: true,
      message: "Payment pending admin approval",
    });
  } catch (error: any) {
    console.error("Error marking payment pending:", error);
    res.status(500).json({ error: error.message });
  }
});

export const paymentApprovalRouter = router;
