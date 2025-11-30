import { storage } from "../../storage.js";

interface AutoApprovalStats {
  checked: number;
  approved: number;
  errors: number;
  lastRun: Date;
}

class PaymentAutoApprovalWorker {
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private stats: AutoApprovalStats = {
    checked: 0,
    approved: 0,
    errors: 0,
    lastRun: new Date(),
  };
  private isProcessing = false;

  /**
   * Start the auto-approval worker
   * Runs every 5 seconds to check and auto-upgrade pending payments
   */
  start() {
    if (this.processingInterval) {
      console.warn("Auto-approval worker already running");
      return;
    }

    console.log("🚀 Payment auto-approval worker started (runs every 5 seconds)");

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processPendingPayments();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop the auto-approval worker
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("⏹️  Payment auto-approval worker stopped");
    }
  }

  /**
   * Process all pending payments and auto-approve them
   */
  private async processPendingPayments() {
    try {
      this.isProcessing = true;
      const now = new Date();

      // Get all users
      const users = await storage.getAllUsers();
      const pendingUsers = users.filter(
        (u: any) => u.paymentStatus === "pending" && u.pendingPaymentPlan
      );

      this.stats.checked += 1;

      if (pendingUsers.length === 0) {
        // Only log every 30 seconds to avoid spam
        if (this.stats.checked % 6 === 0) {
          console.log(`✅ Auto-approval check: 0 pending payments found`);
        }
        return;
      }

      console.log(
        `🔍 Auto-approval: Found ${pendingUsers.length} pending payment(s)`
      );

      // Auto-approve each pending payment
      for (const user of pendingUsers) {
        try {
          const plan = (user.pendingPaymentPlan || "starter") as "trial" | "starter" | "pro" | "enterprise";
          const email = user.email;

          // Upgrade user immediately
          await storage.updateUser(user.id, {
            plan,
            paymentStatus: "approved",
            pendingPaymentPlan: null,
            pendingPaymentAmount: null,
            pendingPaymentDate: null,
            paymentApprovedAt: now,
          });

          this.stats.approved += 1;

          console.log(
            `✅ AUTO-APPROVED: ${email} → ${plan} plan (upgraded immediately, no admin needed)`
          );
        } catch (error: any) {
          this.stats.errors += 1;
          console.error(
            `❌ Error auto-approving user ${user.id}:`,
            error.message
          );
        }
      }

      this.stats.lastRun = now;
    } catch (error: any) {
      this.stats.errors += 1;
      console.error("❌ Error in payment auto-approval worker:", error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      ...this.stats,
      status: this.processingInterval ? "running" : "stopped",
      uptime: new Date().getTime() - this.stats.lastRun.getTime(),
    };
  }
}

// Export singleton instance
export const paymentAutoApprovalWorker = new PaymentAutoApprovalWorker();
