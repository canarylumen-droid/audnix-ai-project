
import { Router } from 'express';
import { instagramPrivateService } from '../lib/integrations/instagram-private';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

router.post('/connect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    await instagramPrivateService.initializeClient(userId, username, password);

    res.json({
      success: true,
      message: 'Instagram connected successfully',
    });
  } catch (error: any) {
    console.error('Instagram connection error:', error);
    res.status(500).json({
      error: error.message || 'Failed to connect Instagram',
    });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const status = instagramPrivateService.getStatus(userId);

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    await instagramPrivateService.disconnect(userId);

    res.json({
      success: true,
      message: 'Instagram disconnected',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

router.post('/send', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { recipientUsername, message, leadId } = req.body;

    if (!recipientUsername || !message) {
      return res.status(400).json({
        error: 'Recipient username and message are required',
      });
    }

    await instagramPrivateService.sendMessage(userId, recipientUsername, message);

    if (leadId) {
      await storage.createMessage({
        leadId,
        userId,
        provider: 'instagram',
        direction: 'outbound',
        body: message,
        metadata: {
          sent_via: 'instagram_private',
          sent_at: new Date().toISOString(),
        },
      });
    }

    const status = instagramPrivateService.getStatus(userId);

    res.json({
      success: true,
      message: 'Message sent successfully',
      rateLimit: {
        sent: status.messagesThisHour,
        remaining: status.remainingThisHour,
        resetTime: status.resetTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to send message',
    });
  }
});

router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const limit = parseInt(req.query.limit as string) || 20;

    const messages = await instagramPrivateService.getInbox(userId, limit);

    res.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

export default router;
