import { db } from '../../db.js';
import { emailWarmupSchedules, users, type EmailWarmupSchedule, type User } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { storage } from '../../storage.js';

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
   */
  private async updateUserWarmupSchedule(userId: string): Promise<void> {
    if (!db) return;

    try {
      const now = new Date();
      const today = now.getDate();

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
        return;
      }

      const user = await storage.getUserById(userId);
      if (!user?.createdAt) return;

      const daysSinceCreated = Math.floor(
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      const warmupDay = Math.min(daysSinceCreated, 10);
      const schedule = WARMUP_SCHEDULE[warmupDay - 1] || WARMUP_SCHEDULE[9];

      await db.insert(emailWarmupSchedules).values({
        userId,
        day: today,
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
