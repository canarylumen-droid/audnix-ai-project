
/**
 * QuotaService tracks the database quota status in-memory.
 * It provides a centralized way for background workers to check if they
 * should pause or slow down due to database restrictions (e.g. Neon's transfer quota).
 */
class QuotaService {
  private isOverQuota: boolean = false;
  private lastQuotaErrorAt: Date | null = null;
  private readonly QUOTA_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes default recovery window

  /**
   * Updates the quota status based on observed database errors.
   */
  public reportDbError(error: any): void {
    const errorMessage = (error?.message || String(error)).toLowerCase();
    
    // Detect Neon's quota exceeded error (XX000 with specific message)
    if (errorMessage.includes('exceeded the data transfer quota') || 
        errorMessage.includes('quota exceeded') ||
        (error?.code === 'XX000' && errorMessage.includes('quota'))) {
      
      if (!this.isOverQuota) {
        console.error('🚨 [QuotaService] Database quota exceeded detected! Throttling background workers.');
      }
      
      this.isOverQuota = true;
      this.lastQuotaErrorAt = new Date();
    }
  }

  /**
   * Resets the quota status manually (e.g. via admin action or automated check).
   */
  public resetQuota(): void {
    if (this.isOverQuota) {
      console.log('✅ [QuotaService] Database quota restriction reset.');
    }
    this.isOverQuota = false;
    this.lastQuotaErrorAt = null;
  }

  /**
   * Checks if the system is currently under quota restrictions.
   * Automatically recovers after the cooldown period if no new errors are reported.
   */
  public isRestricted(): boolean {
    if (!this.isOverQuota) return false;

    // Auto-recovery check
    if (this.lastQuotaErrorAt) {
      const elapsed = Date.now() - this.lastQuotaErrorAt.getTime();
      if (elapsed > this.QUOTA_COOLDOWN_MS) {
        this.resetQuota();
        return false;
      }
    }

    return true;
  }

  /**
   * Returns the time remaining until auto-recovery.
   */
  public getRemainingCooldownMs(): number {
    if (!this.isOverQuota || !this.lastQuotaErrorAt) return 0;
    const elapsed = Date.now() - this.lastQuotaErrorAt.getTime();
    return Math.max(0, this.QUOTA_COOLDOWN_MS - elapsed);
  }
}

export const quotaService = new QuotaService();
