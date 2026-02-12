import { Router, Request, Response } from 'express';
import { recordEmailEvent, getEmailStats } from '../lib/email/email-tracking.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { isValidUUID } from '../lib/utils/validation.js';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';

const router = Router();

const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

router.get('/track/open/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).send('Invalid token');
      return;
    }

    await recordEmailEvent({
      type: 'open',
      messageId: token,
      timestamp: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_1X1_GIF.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.send(TRANSPARENT_1X1_GIF);
  } catch (error) {
    console.error('Error tracking email open:', error);
    res.set('Content-Type', 'image/gif');
    res.send(TRANSPARENT_1X1_GIF);
  }
});

router.get('/track/click/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { url } = req.query;

    if (!token || !url || typeof url !== 'string') {
      res.status(400).send('Invalid request');
      return;
    }

    const decodedUrl = decodeURIComponent(url);
    let isSafe = false;

    try {
      if (decodedUrl.startsWith('//')) {
        isSafe = false;
      } else if (decodedUrl.startsWith('/')) {
        isSafe = true;
      } else {
        const parsed = new URL(decodedUrl);
        const safeHostnames = ['www.audnixai.com', 'audnixai.com', 'localhost'];
        isSafe = safeHostnames.includes(parsed.hostname) ||
          parsed.hostname.endsWith('.vercel.app') ||
          parsed.hostname.endsWith('.replit.dev');
      }
    } catch (e) {
      isSafe = false;
    }

    if (!isSafe) {
      res.status(400).send('Invalid redirect URL (External domains not allowed)');
      return;
    }

    await recordEmailEvent({
      type: 'click',
      messageId: token,
      timestamp: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      linkUrl: decodedUrl,
    });

    res.redirect(302, decodedUrl);
  } catch (error) {
    console.error('Error tracking email click:', error);
    res.status(400).send('Invalid request');
  }
});

router.get('/stats', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const days = parseInt(req.query.days as string) || 30;

    const stats = await getEmailStats(userId, days);

    res.json({
      success: true,
      stats,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Error getting email stats:', error);
    res.status(500).json({ error: 'Failed to get email stats' });
  }
});

router.get('/tracking/:leadId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadId } = req.params;

    if (!isValidUUID(leadId)) {
      res.status(400).json({ error: 'Invalid lead ID format' });
      return;
    }

    const result = await db.execute(sql`
      SELECT 
        et.id,
        et.subject,
        et.recipient_email,
        et.sent_at,
        et.first_opened_at,
        et.first_clicked_at,
        et.open_count,
        et.click_count
      FROM email_tracking et
      WHERE et.user_id = ${userId}
      AND et.lead_id = ${leadId}
      ORDER BY et.sent_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      emails: result.rows,
    });
  } catch (error) {
    console.error('Error getting lead email tracking:', error);
    res.status(500).json({ error: 'Failed to get tracking data' });
  }
});

export default router;
