import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';
import { detectBuyingIntent, generateSalesmanDM } from '../lib/ai/video-comment-monitor';
import { InstagramProvider } from '../lib/providers/instagram';

const router = Router();

/**
 * Get user's Instagram videos for selection
 * GET /api/video-automation/videos
 */
router.get('/videos', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;

    // Get user's Instagram media
    const integrations = await storage.getIntegrations(userId);
    const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);

    if (!igIntegration) {
      return res.status(400).json({ error: 'Instagram not connected' });
    }

    // Fetch user's recent videos from Instagram Graph API
    const { decrypt } = await import('../lib/crypto/encryption');
    const meta = JSON.parse(decrypt(igIntegration.encryptedMeta));

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${meta.pageId}/media?fields=id,media_type,media_url,caption,timestamp,permalink&limit=20`,
      {
        headers: { Authorization: `Bearer ${meta.accessToken}` }
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch Instagram videos' });
    }

    const data = await response.json();
    const videos = data.data
      .filter((item: any) => item.media_type === 'VIDEO' || item.media_type === 'CAROUSEL_ALBUM')
      .map((item: any) => ({
        id: item.id,
        url: item.permalink,
        mediaUrl: item.media_url,
        caption: item.caption || '',
        timestamp: item.timestamp
      }));

    res.json({ videos });
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch videos' });
  }
});

/**
 * Create new video monitor configuration
 * POST /api/video-automation/monitors
 */
router.post('/monitors', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { videoId, videoUrl, productLink, ctaText, metadata } = req.body;

    if (!videoId || !productLink || !ctaText) {
      return res.status(400).json({ 
        error: 'Missing required fields: videoId, productLink, ctaText' 
      });
    }

    // Check if user has paid plan
    const user = await storage.getUserById(userId);
    if (!user || user.plan === 'trial') {
      return res.status(403).json({ 
        error: 'Premium feature - Upgrade to a paid plan to access Video Comment Automation' 
      });
    }

    const monitor = await storage.createVideoMonitor({
      userId,
      videoId,
      videoUrl,
      productLink,
      ctaText,
      isActive: true,
      autoReplyEnabled: true,
      metadata: metadata || {}
    });

    res.json({
      success: true,
      monitor,
      message: 'AI is now monitoring comments on this video 24/7'
    });
  } catch (error: any) {
    console.error('Error creating video monitor:', error);
    res.status(500).json({ error: error.message || 'Failed to create monitor' });
  }
});

/**
 * Get all video monitors for user
 * GET /api/video-automation/monitors
 */
router.get('/monitors', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const monitors = await storage.getVideoMonitors(userId);
    res.json({ monitors });
  } catch (error: any) {
    console.error('Error fetching monitors:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch monitors' });
  }
});

/**
 * Update video monitor
 * PATCH /api/video-automation/monitors/:id
 */
router.patch('/monitors/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getCurrentUserId(req)!;
    const updates = req.body;

    // Check if user has paid plan
    const user = await storage.getUserById(userId);
    if (!user || user.plan === 'trial') {
      return res.status(403).json({ 
        error: 'Premium feature - Upgrade to a paid plan to access Video Comment Automation' 
      });
    }

    // Validate productLink if provided
    if (updates.productLink && typeof updates.productLink === 'string') {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(updates.productLink)) {
        return res.status(400).json({ error: 'Invalid URL format for productLink' });
      }
    }

    const monitor = await storage.updateVideoMonitor(id, userId, updates);

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json({ success: true, monitor });
  } catch (error: any) {
    console.error('Error updating monitor:', error);
    res.status(500).json({ error: error.message || 'Failed to update monitor' });
  }
});

/**
 * Delete video monitor
 * DELETE /api/video-automation/monitors/:id
 */
router.delete('/monitors/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getCurrentUserId(req)!;

    // Check if user has paid plan
    const user = await storage.getUserById(userId);
    if (!user || user.plan === 'trial') {
      return res.status(403).json({ 
        error: 'Premium feature - Upgrade to a paid plan to access Video Comment Automation' 
      });
    }

    await storage.deleteVideoMonitor(id, userId);
    res.json({ success: true, message: 'Monitor deleted' });
  } catch (error: any) {
    console.error('Error deleting monitor:', error);
    res.status(500).json({ error: error.message || 'Failed to delete monitor' });
  }
});

/**
 * Test comment intent detection
 * POST /api/video-automation/test-intent
 */
router.post('/test-intent', requireAuth, async (req: Request, res: Response) => {
  try {
    const { comment, videoContext } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const intent = await detectBuyingIntent(comment, videoContext || '');

    res.json({
      intent,
      recommendation: intent.shouldDM 
        ? `AI will DM this lead with personalized sales message`
        : `No action needed - ${intent.intentType}`
    });
  } catch (error: any) {
    console.error('Intent test error:', error);
    res.status(500).json({ error: error.message || 'Intent detection failed' });
  }
});

export default router;