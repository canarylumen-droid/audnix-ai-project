/* @ts-nocheck */
import { db } from '../../db';
import { emailWarmupSchedules, users } from '@shared/schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import { storage } from '../../storage';
import { smtpAbuseProtection } from './smtp-abuse-protection';

/**
 * Email Warm-up System
 * 
 * Gradually increases sending volume to build sender reputation:
 * - Day 1: 30 emails
 * - Day 2: 50 emails
 * - Day 3: 80 emails
 * - Day 4: 120 emails
 * - Day 5: 150 emails
 * - Day 6-10: 200 emails (plateau)
 * - Auto-adjusts based on bounce rate
 */

interface WarmupSchedule {
  day: number;
  emailsToSend: number;
}

const WARMUP_SCHEDULE: WarmupSchedule[] = [
  { day: 1, emailsToSend: 30 },
  { day: 2, emailsToSend: 50 },
  { day: 3, emailsToSend: 80 },
  { day: 4, emailsToSend: 120 },
  { day: 5, emailsToSend: 150 },
  { day: 6, emailsToSend: 200 },
  { day: 7, emailsToSend: 200 },
  { day: 8, emailsToSend: 200 },
  { day: 9, emailsToSend: 200 },
  { day: 10, emailsToSend: 200 },
];

class EmailWarmupWorker {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Start the email warm-up worker
   */
  start() {
    if (this.isRunning) {
      console.log('Email warmup worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🔥 Email warmup worker started');

    // Check every hour if we need to update daily limits
    this.checkInterval = setInterval(() => {
      this.checkAndUpdateWarmupLimits();
    }, 60 * 60 * 1000); // Every hour

    // Run immediately on start
    this.checkAndUpdateWarmupLimits();
  }

  /**
   * Stop the worker
   */
  stop() {
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
  private async checkAndUpdateWarmupLimits() {
    if (!db) return;

    try {
      // Get all active users
      const activeUsers = await db
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
   */
  private async updateUserWarmupSchedule(userId: string) {
    if (!db) return;

    try {
      const now = new Date();
      const today = now.getDate();

      // Get or create today's schedule
      const [existingSchedule] = await db
        .select()
        .from(emailWarmupSchedules)
        .where(
          and(
            eq(emailWarmupSchedules.userId, userId),
            eq(emailWarmupSchedules.day, today)
          )
        )
        .limit(1);

      if (existingSchedule) {
        return; // Already scheduled for today
      }

      // Calculate which day of warm-up we're on
      const user = await storage.getUserById(userId);
      if (!user?.createdAt) return;

      const daysSinceCreated = Math.floor(
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1; // +1 because day 1 is creation date

      // Cap at day 10 (maintenance phase)
      const warmupDay = Math.min(daysSinceCreated, 10);
      const schedule = WARMUP_SCHEDULE[warmupDay - 1] || WARMUP_SCHEDULE[9];

      // Create schedule with random delay enabled
      await db.insert(emailWarmupSchedules).values({
        userId,
        day: today,
        dailyLimit: schedule.emailsToSend,
        randomDelay: true // Enable 2-12s random delays
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
      const [schedule] = await db
        .select()
        .from(emailWarmupSchedules)
        .where(
          and(
            eq(emailWarmupSchedules.userId, userId),
            eq(emailWarmupSchedules.day, today)
          )
        )
        .limit(1);

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
    try {
      const [schedule] = await db
        .select()
        .from(emailWarmupSchedules)
        .where(eq(emailWarmupSchedules.userId, userId))
        .limit(1);

      if (!schedule?.randomDelay) {
        return 0; // No delay needed
      }

      // Random delay between 2-12 seconds
      const delay = Math.floor(Math.random() * 10000) + 2000;
      return delay;
    } catch (error) {
      console.error('Error applying warmup delay:', error);
      return 0;
    }
  }
}

export const emailWarmupWorker = new EmailWarmupWorker();
