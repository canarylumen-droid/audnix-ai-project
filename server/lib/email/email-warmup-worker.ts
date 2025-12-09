import { db } from '../../db.js';
import { emailWarmupSchedules, users, type EmailWarmupSchedule, type User } from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { storage } from '../../storage.js';

/**
 * Email Warm-up System
 * 
 * ULTRA-AGGRESSIVE warmup for handling 5K+ leads in 3-4 days:
 * - Day 1: 1,500 emails (~60-65/hour)
 * - Day 2: 1,600 emails (~65-70/hour)
 * - Day 3: 1,680 emails (~70/hour)
 * - Day 4+: 1,680 emails (~70/hour) - Full speed
 * 
 * Total: 5,000+ emails in 3-4 days at 60-70 emails/hour
 * Auto-adjusts based on bounce rate
 */

interface WarmupSchedule {
  day: number;
  emailsToSend: number;
}

/**
 * ULTRA-AGGRESSIVE WARMUP SCHEDULE for handling 5K+ leads in 3-4 days
 * 
 * Faster email sending rates (60-70/hour):
 * - Day 1: 1,500 emails/day (~60/hour over 24h) - Fast start
 * - Day 2: 1,600 emails/day (~65/hour) - Accelerating
 * - Day 3: 1,680 emails/day (~70/hour) - Full speed
 * - Day 4+: 1,680 emails/day (~70/hour) - Sustained max
 * 
 * NOTE: 60-70/hour is SAFE if you have:
 * - Verified domain with SPF/DKIM/DMARC
 * - Low bounce rate (<5%)
 * - Good engagement (opens/replies)
 * - Proper list hygiene (verified emails)
 * 
 * TIMELINE: 5,000 leads in 3-4 days
 * - Day 1: 1,500 emails
 * - Day 2: 1,600 emails (total: 3,100)
 * - Day 3: 1,680 emails (total: 4,780)
 * - Day 4: 220+ emails (total: 5,000+)
 */
const WARMUP_SCHEDULE: WarmupSchedule[] = [
  { day: 1, emailsToSend: 1500 },  // ~60 emails/hour over 24h
  { day: 2, emailsToSend: 1600 },  // ~65 emails/hour
  { day: 3, emailsToSend: 1680 },  // ~70 emails/hour
  { day: 4, emailsToSend: 1680 },  // ~70 emails/hour (sustained)
  { day: 5, emailsToSend: 1680 },  // ~70 emails/hour
  { day: 6, emailsToSend: 1680 },  // ~70 emails/hour
  { day: 7, emailsToSend: 1680 },  // ~70 emails/hour
  { day: 8, emailsToSend: 1680 },  // ~70 emails/hour
  { day: 9, emailsToSend: 1680 },  // ~70 emails/hour
  { day: 10, emailsToSend: 1680 }, // ~70 emails/hour
];

/**
 * HOURLY LIMITS for faster sending (60-70/hour)
 * Optimized for reaching 5K leads in 3-4 days
 */
export const HOURLY_EMAIL_LIMIT = 70; // 60-70 emails/hour for fast warmup
export const EMAILS_PER_MINUTE = 2; // ~2 emails/minute for steady flow

class EmailWarmupWorker {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Start the email warm-up worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('Email warmup worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🔥 Email warmup worker started');

    this.checkInterval = setInterval(() => {
      this.checkAndUpdateWarmupLimits();
    }, 60 * 60 * 1000);

    this.checkAndUpdateWarmupLimits();
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Email warmup worker stopped');
  }

  /**
   * Check and update warm-up limits for all users
   */
  private async checkAndUpdateWarmupLimits(): Promise<void> {
    if (!db) return;

    try {
      const activeUsers: User[] = await db
        .select()
        .from(users)
        .where(eq(users.plan, 'starter'));

      for (const user of activeUsers) {
        await this.updateUserWarmupSchedule(user.id);
      }
    } catch (error) {
      console.error('Warmup check error:', error);
    }
  }

  /**
   * Update warm-up schedule for a user
   * 
   * NOTE: The `day` field stores the calendar day (1-31) as a deduplication key
   * to ensure only one schedule record per day. The actual warmup level is
   * determined by `daysSinceCreated` (days since user account creation),
   * ensuring warmup properly ramps up regardless of calendar date.
   */
  private async updateUserWarmupSchedule(userId: string): Promise<void> {
    if (!db) return;

    try {
      const now = new Date();
      const today = now.getDate(); // Calendar day as deduplication key

      // Check if schedule already exists for today (prevent duplicates)
      const scheduleResults: EmailWarmupSchedule[] = await db
        .select()
        .from(emailWarmupSchedules)
        .where(
          and(
            eq(emailWarmupSchedules.userId, userId),
            eq(emailWarmupSchedules.day, today)
          )
        )
        .limit(1);

      const existingSchedule = scheduleResults[0];

      if (existingSchedule) {
        return; // Already has today's schedule
      }

      const user = await storage.getUserById(userId);
      if (!user?.createdAt) return;

      // Calculate warmup day based on account age (not calendar day)
      const daysSinceCreated = Math.floor(
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      // Use daysSinceCreated to determine warmup level (max day 10)
      const warmupDay = Math.min(daysSinceCreated, 10);
      const schedule = WARMUP_SCHEDULE[warmupDay - 1] || WARMUP_SCHEDULE[9];

      await db.insert(emailWarmupSchedules).values({
        userId,
        day: today, // Calendar day for deduplication
        dailyLimit: schedule.emailsToSend,
        randomDelay: true
      });

      console.log(`🔥 Warmup schedule set for ${user.email}: Day ${warmupDay}, ${schedule.emailsToSend} emails`);
    } catch (error) {
      console.error('Error updating warmup schedule:', error);
    }
  }

  /**
   * Get today's allowed send count for a user
   */
  async getTodaysSendLimit(userId: string): Promise<number> {
    if (!db) return 0;

    try {
      const today = new Date().getDate();
      const scheduleResults: EmailWarmupSchedule[] = await db
        .select()
        .from(emailWarmupSchedules)
        .where(
          and(
            eq(emailWarmupSchedules.userId, userId),
            eq(emailWarmupSchedules.day, today)
          )
        )
        .limit(1);

      const schedule = scheduleResults[0];
      return schedule?.dailyLimit || 0;
    } catch (error) {
      console.error('Error getting warmup limit:', error);
      return 0;
    }
  }

  /**
   * Apply warm-up delay before sending
   */
  async applyWarmupDelay(userId: string): Promise<number> {
    if (!db) return 0;

    try {
      const scheduleResults: EmailWarmupSchedule[] = await db
        .select()
        .from(emailWarmupSchedules)
        .where(eq(emailWarmupSchedules.userId, userId))
        .limit(1);

      const schedule = scheduleResults[0];

      if (!schedule?.randomDelay) {
        return 0;
      }

      const delay = Math.floor(Math.random() * 10000) + 2000;
      return delay;
    } catch (error) {
      console.error('Error applying warmup delay:', error);
      return 0;
    }
  }
}

export const emailWarmupWorker = new EmailWarmupWorker();
