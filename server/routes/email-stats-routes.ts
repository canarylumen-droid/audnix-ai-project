/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { bounceHandler } from '../lib/email/bounce-handler';
import { smtpAbuseProtection } from '../lib/email/smtp-abuse-protection';
import { emailWarmupWorker } from '../lib/email/email-warmup-worker';

const router = Router();

/**
 * Get email bounce statistics
 */
router.get('/bounces/stats', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const stats = await bounceHandler.getBounceStats(userId);

    res.json({
      success: true,
      bounceStats: {
        hardBounces: stats.hardBounces,
        softBounces: stats.softBounces,
        spamBounces: stats.spamBounces,
        totalBounces: stats.totalBounces,
        bounceRate: `${stats.bounceRate}%`
      }
    });
  } catch (error: any) {
    console.error('Error getting bounce stats:', error);
    res.status(500).json({ error: 'Failed to get bounce statistics' });
  }
});

/**
 * Get SMTP rate limit status
 */
router.get('/sending/limits', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const stats = await smtpAbuseProtection.getStats(userId);
    const canSend = await smtpAbuseProtection.canSendEmail(userId);

    res.json({
      success: true,
      sending: {
        plan: stats.plan,
        sentThisHour: stats.sentThisHour,
        sentToday: stats.sentToday,
        hourlyLimit: stats.hourlyLimit,
        dailyLimit: stats.dailyLimit,
        canSendNow: canSend.allowed,
        remainingReason: !canSend.allowed ? canSend.reason : null,
        retryAfter: canSend.delay
      }
    });
  } catch (error: any) {
    console.error('Error getting sending limits:', error);
    res.status(500).json({ error: 'Failed to get sending limits' });
  }
});

/**
 * Get email warm-up schedule
 */
router.get('/warmup/status', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const todayLimit = await emailWarmupWorker.getTodaysSendLimit(userId);

    res.json({
      success: true,
      warmup: {
        todayEmailsAllowed: todayLimit,
        status: todayLimit > 0 ? 'active' : 'pending',
        message: todayLimit > 0 
          ? `Send up to ${todayLimit} emails today for optimal warm-up`
          : 'Warmup schedule not yet initialized'
      }
    });
  } catch (error: any) {
    console.error('Error getting warmup status:', error);
    res.status(500).json({ error: 'Failed to get warmup status' });
  }
});

export default router;
