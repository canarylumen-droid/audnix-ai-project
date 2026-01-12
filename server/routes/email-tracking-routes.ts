import { Router, Request, Response } from 'express';
import { recordEmailEvent, getEmailStats } from '../lib/email/email-tracking.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
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

    // Safety check: Only allow redirects to same domain or relative paths
    // MUST prevent protocol-relative URLs (starting with //) which browsers treat as same-protocol redirects
    const isRelative = decodedUrl.startsWith('/') && !decodedUrl.startsWith('//');
    const isSafeDomain = decodedUrl.startsWith('https://www.audnixai.com') ||
      decodedUrl.startsWith('https://audnixai.com');

    if (!isRelative && !isSafeDomain) {
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
