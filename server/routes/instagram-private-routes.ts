
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

    // Password is encrypted with AES-256-GCM immediately after login
    // Even if database is hacked, password cannot be decrypted without ENCRYPTION_KEY
    await instagramPrivateService.initializeClient(userId, username, password);

    res.json({
      success: true,
      message: 'Instagram connected successfully',
      security_warnings: {
        api_status: 'UNOFFICIAL - This uses reverse-engineered Instagram API',
        ban_risk: 'HIGH - Instagram may ban accounts using unofficial APIs',
        recommendation: 'Use official Graph API with Business/Creator account instead',
        credentials_discarded: true,
        encryption: 'AES-256-GCM with end-to-end encryption',
        rate_limits: '50 DMs per hour (safer limit)',
        note: 'Session tokens stored encrypted. Use at your own risk.',
      },
    });
  } catch (error: any) {
    console.error('Instagram connection error:', error);
    
    // Check if it's 2FA/OTP challenge
    if (error.message?.includes('challenge') || error.message?.includes('checkpoint')) {
      return res.status(400).json({
        error: 'Instagram requires verification',
        code: 'CHALLENGE_REQUIRED',
        message: 'Please verify your account on Instagram app first, then try connecting again',
      });
    }

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
    const { recipientUsername, message, leadId, priority } = req.body;

    if (!recipientUsername || !message) {
      return res.status(400).json({
        error: 'Recipient username and message are required',
      });
    }

    await instagramPrivateService.sendMessage(
      userId, 
      recipientUsername, 
      message,
      priority || 'cold'
    );

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
