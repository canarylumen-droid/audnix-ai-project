import { db } from '../../db.js';
import { bounceTracker, leads, Lead } from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { storage } from '../../storage.js';
import { wsSync } from '../websocket-sync.js';

/**
 * Bounce Handling System
 * 
 * Types of bounces:
 * - Hard bounce: Invalid email, account deleted, domain doesn't exist (permanent)
 * - Soft bounce: Mailbox full, server error, temporary issue (retry later)
 * - Spam: Marked as spam/abuse (stop sending to this email)
 * 
 * Actions:
 * - Hard bounce: Mark lead as cold, disable email channel
 * - Soft bounce: Retry after 3 days
 * - Spam: Mark as not interested, stop all sends
 */

interface BounceEvent {
  userId: string;
  leadId: string;
  email: string;
  bounceType: 'hard' | 'soft' | 'spam';
  reason?: string;
}

class BounceHandler {
  /**
   * Record a bounce event
   */
  async recordBounce(event: BounceEvent): Promise<void> {
    if (!db) return;

    try {
      // Save bounce record
      await db.insert(bounceTracker).values({
        userId: event.userId,
        leadId: event.leadId,
        bounceType: event.bounceType,
        email: event.email,
        metadata: {
          reason: event.reason,
          recordedAt: new Date().toISOString()
        }
      });

      // Get the lead
      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, event.leadId))
        .limit(1);

      if (!lead) return;

      // Handle based on bounce type
      switch (event.bounceType) {
        case 'hard':
          await this.handleHardBounce(lead);
          break;
        case 'soft':
          await this.handleSoftBounce(lead);
          break;
        case 'spam':
          await this.handleSpamBounce(lead);
          break;
      }

      console.log(`📧 ${event.bounceType.toUpperCase()} bounce recorded: ${event.email}`);

      // Stop any active campaign for this lead
      const { campaignLeads } = await import('../../../shared/schema.js');
      await db.update(campaignLeads)
        .set({ 
          status: 'failed', 
          error: `${event.bounceType.toUpperCase()} bounce: ${event.reason || 'No reason provided'}` 
        })
        .where(eq(campaignLeads.leadId, event.leadId));

      // Notify UI in real-time
      wsSync.notifyActivityUpdated(event.userId, {
        type: 'email_bounce',
        bounceType: event.bounceType,
        leadId: event.leadId,
        email: event.email
      });

      // Create audit log for activity feed
      await storage.createAuditLog({
        userId: event.userId,
        leadId: event.leadId,
        action: 'email_bounce',
        details: {
          message: `${event.bounceType.toUpperCase()} bounce from ${event.email}`,
          bounceType: event.bounceType,
          reason: event.reason
        }
      });

      // Create persistent notification
      await storage.createNotification({
        userId: event.userId,
        type: 'email_bounce',
        title: '⚠️ Email Delivery Failed',
        message: `${event.bounceType.toUpperCase()} bounce from ${event.email}. Lead marked as cold.`,
        actionUrl: `/dashboard/inbox?leadId=${event.leadId}`
      });
    } catch (error) {
      console.error('Error recording bounce:', error);
    }
  }

  /**
   * Handle hard bounce (permanent failure)
   */
  private async handleHardBounce(lead: Lead): Promise<void> {
    if (!db) return;

    try {
      // Mark lead's email as cold (invalid) - using 'cold' as the closest valid status
      await db
        .update(leads)
        .set({
          status: 'cold',
          metadata: {
            ...(lead.metadata as Record<string, unknown>),
            hard_bounce: true,
            hard_bounce_date: new Date().toISOString(),
            invalid_reason: 'Email bounced permanently'
          }
        })
        .where(eq(leads.id, lead.id));

      console.log(`🚫 Hard bounce: Lead ${lead.id} marked as cold (invalid email)`);
    } catch (error) {
      console.error('Error handling hard bounce:', error);
    }
  }

  /**
   * Handle soft bounce (temporary failure - retry later)
   */
  private async handleSoftBounce(lead: Lead): Promise<void> {
    if (!db) return;

    try {
      const leadMetadata = lead.metadata as Record<string, unknown>;
      const softBounceCount = (typeof leadMetadata?.soft_bounce_count === 'number'
        ? leadMetadata.soft_bounce_count
        : 0) + 1;

      // After 3 soft bounces, mark as cold
      if (softBounceCount >= 3) {
        await db
          .update(leads)
          .set({
            status: 'cold',
            metadata: {
              ...leadMetadata,
              soft_bounce_count: softBounceCount,
              too_many_soft_bounces: true,
              disabled_date: new Date().toISOString()
            }
          })
          .where(eq(leads.id, lead.id));

        console.log(`🚫 Soft bounce: Lead ${lead.id} disabled after ${softBounceCount} bounces`);
      } else {
        // Just increment the counter for retry later
        await db
          .update(leads)
          .set({
            metadata: {
              ...leadMetadata,
              soft_bounce_count: softBounceCount,
              last_soft_bounce: new Date().toISOString()
            }
          })
          .where(eq(leads.id, lead.id));

        console.log(`⏸️  Soft bounce: Lead ${lead.id} retry count ${softBounceCount}/3`);
      }
    } catch (error) {
      console.error('Error handling soft bounce:', error);
    }
  }

  /**
   * Handle spam bounce (marked as spam)
   */
  private async handleSpamBounce(lead: Lead): Promise<void> {
    if (!db) return;

    try {
      // Mark as not interested and block all sends
      await db
        .update(leads)
        .set({
          status: 'not_interested',
          metadata: {
            ...(lead.metadata as Record<string, unknown>),
            marked_as_spam: true,
            marked_spam_date: new Date().toISOString(),
            do_not_contact: true
          }
        })
        .where(eq(leads.id, lead.id));

      console.log(`🚫 Spam bounce: Lead ${lead.id} marked as do-not-contact`);
    } catch (error) {
      console.error('Error handling spam bounce:', error);
    }
  }

  /**
   * Check if email should receive more sends
   */
  async shouldSkipBounceEmail(email: string, userId: string): Promise<boolean> {
    if (!db) return false;

    try {
      const bounces = await db
        .select()
        .from(bounceTracker)
        .where(
          and(
            eq(bounceTracker.email, email),
            eq(bounceTracker.userId, userId),
            eq(bounceTracker.bounceType, 'hard')
          )
        )
        .limit(1);

      if (bounces.length > 0) {
        return true; // Skip hard bounced emails
      }

      // Check spam bounces
      const spamBounces = await db
        .select()
        .from(bounceTracker)
        .where(
          and(
            eq(bounceTracker.email, email),
            eq(bounceTracker.userId, userId),
            eq(bounceTracker.bounceType, 'spam')
          )
        )
        .limit(1);

      return spamBounces.length > 0;
    } catch (error) {
      console.error('Error checking bounce status:', error);
      return false;
    }
  }

  /**
   * Get bounce statistics for a user
   */
  async getBounceStats(userId: string): Promise<{
    hardBounces: number;
    softBounces: number;
    spamBounces: number;
    totalBounces: number;
    bounceRate: number; // percentage
  }> {
    if (!db) return { hardBounces: 0, softBounces: 0, spamBounces: 0, totalBounces: 0, bounceRate: 0 };

    try {
      const bounces = await db
        .select()
        .from(bounceTracker)
        .where(eq(bounceTracker.userId, userId));

      const hardBounces = bounces.filter((b: { bounceType: string }) => b.bounceType === 'hard').length;
      const softBounces = bounces.filter((b: { bounceType: string }) => b.bounceType === 'soft').length;
      const spamBounces = bounces.filter((b: { bounceType: string }) => b.bounceType === 'spam').length;
      const totalBounces = bounces.length;

      // Get total leads to calculate bounce rate
      const userLeads = await storage.getLeads({ userId, limit: 10000 });
      const bounceRate = userLeads.length > 0
        ? Math.round((totalBounces / userLeads.length) * 100)
        : 0;

      return {
        hardBounces,
        softBounces,
        spamBounces,
        totalBounces,
        bounceRate
      };
    } catch (error) {
      console.error('Error getting bounce stats:', error);
      return { hardBounces: 0, softBounces: 0, spamBounces: 0, totalBounces: 0, bounceRate: 0 };
    }
  }
}

export const bounceHandler = new BounceHandler();
export type { BounceEvent };
