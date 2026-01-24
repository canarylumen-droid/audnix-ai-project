import { db } from '../../db.js';
import { emailWarmupSchedules } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Email Warm-up Engine
 * Gradually ramps up email sending to build domain reputation
 * 
 * Schedule:
 * Day 1: 30 emails
 * Day 2: 50 emails
 * Day 3: 80 emails
 * Day 4: 120 emails
 * Day 5: 200 emails
 * Days 6-30: Continue scaling based on engagement
 */

export async function initializeWarmupSchedule(userId: string): Promise<void> {
  const schedule = generateWarmupSchedule();

  for (const day of schedule) {
    await db.insert(emailWarmupSchedules).values({
      userId,
      day: day.day,
      dailyLimit: day.limit,
      randomDelay: true
    });
  }
}

export function generateWarmupSchedule(): Array<{ day: number; limit: number }> {
  return [
    { day: 1, limit: 300 },
    { day: 2, limit: 450 },
    { day: 3, limit: 500 },
    { day: 4, limit: 500 },
    { day: 5, limit: 500 },
    ...Array.from({ length: 25 }, (_, i) => ({
      day: 6 + i,
      limit: 500 + i * 50
    }))
  ];
}

export async function getDailyLimit(userId: string, day: number): Promise<number> {
  try {
    const result = await db
      .select()
      .from(emailWarmupSchedules)
      .where(
        eq(emailWarmupSchedules.userId, userId) &&
        eq(emailWarmupSchedules.day, day)
      )
      .limit(1);

    if (result.length > 0) {
      return result[0].dailyLimit;
    }
  } catch (error) {
    console.error('Error getting daily limit:', error);
  }

  // Default: moderate sending
  return 150;
}

export async function getRandomDelay(): Promise<number> {
  // Random delay between 2-12 seconds
  return Math.floor(Math.random() * (12000 - 2000 + 1)) + 2000;
}
