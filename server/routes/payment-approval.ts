/* @ts-nocheck */
import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, getCurrentUserId } from "../middleware/auth";

const router = Router();

/**
 * GET /api/payment-approval/pending
 * Admin: Get all pending payment approvals
 */
router.get("/pending", requireAuth, async (req: Request, res: Response) => {
  try {
    const adminId = getCurrentUserId(req);
    const admin = await storage.getUserById(adminId!);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    // Get all pending payments
    const pendingUsers = await storage.db.query.users.findMany({
      where: (users, { eq }) => eq(users.payment_status, "pending"),
    });

    return res.json({
      pending: pendingUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.pending_payment_plan,
        amount: u.pending_payment_amount,
        pendingDate: u.pending_payment_date,
      }))
    });
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment-approval/approve/:userId
 * Admin: Approve a pending payment and upgrade user
 */
router.post("/approve/:userId", requireAuth, async (req: Request, res: Response) => {
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

    if (user.payment_status !== "pending") {
      return res.status(400).json({ error: "User is not pending approval" });
    }

    const plan = user.pending_payment_plan as any;
    const amount = user.pending_payment_amount;

    // Upgrade user
    const voiceMinutes = {
      starter: 100,
      pro: 400,
      enterprise: 1000,
    }[plan] || 100;

    await storage.updateUser(userId, {
      plan,
      payment_status: "approved",
      pending_payment_amount: null,
      pending_payment_plan: null,
      pending_payment_date: null,
      payment_approved_date: new Date(),
      voiceMinutesUsed: 0,
    });

    // Log admin action (stored in metadata for now)
    // TODO: Create admin_payment_approvals table for audit trail

    console.log(`✅ Admin ${admin.email} approved payment for ${user.email} → ${plan} plan`);

    // Send notification to user
    // TODO: Email notification: "Your payment has been approved! Access your features now."

    res.json({ 
      success: true, 
      message: `User upgraded to ${plan} plan`,
      user: {
        id: user.id,
        email: user.email,
        plan,
      }
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

    if (user.payment_status !== "pending") {
      return res.status(400).json({ error: "User is not pending approval" });
    }

    const plan = user.pending_payment_plan;
    const amount = user.pending_payment_amount;

    // Reject and reset
    await storage.updateUser(userId, {
      payment_status: "rejected",
      pending_payment_amount: null,
      pending_payment_plan: null,
      pending_payment_date: null,
    });

    // Log admin action (stored in metadata for now)
    // TODO: Create admin_payment_approvals table for audit trail

    console.log(`❌ Admin ${admin.email} rejected payment for ${user.email}`);

    res.json({ 
      success: true, 
      message: "Payment rejected",
    });
  } catch (error: any) {
    console.error("Error rejecting payment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment-approval/mark-pending/:userId
 * User: Mark themselves as paid (after clicking payment link)
 * This is how the admin knows they paid
 */
router.post("/mark-pending/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { userId } = req.params;
    const { amount, plan } = req.body;

    // Users can only mark themselves
    if (currentUserId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Mark as pending approval
    await storage.updateUser(userId, {
      payment_status: "pending",
      pending_payment_amount: amount,
      pending_payment_plan: plan,
      pending_payment_date: new Date(),
    });

    console.log(`⏳ User ${user.email} marked as pending approval (${plan} - $${amount})`);

    // TODO: Email notification to admins: "User {name} ({email}) paid ${amount} for {plan} plan. Awaiting approval."

    res.json({ 
      success: true, 
      message: "Payment pending admin approval. You'll get access soon!",
    });
  } catch (error: any) {
    console.error("Error marking pending:", error);
    res.status(500).json({ error: error.message });
  }
});

export { router as paymentApprovalRouter };
