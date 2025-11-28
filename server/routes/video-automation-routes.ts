import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { detectBuyingIntent, generateSalesmanDM } from '../lib/ai/video-comment-monitor.js';
import { InstagramProvider } from '../lib/providers/instagram.js';

interface InstagramMediaItem {
  id: string;
  media_type: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  media_url?: string;
  caption?: string;
  timestamp: string;
  permalink: string;
}

interface InstagramMediaResponse {
  data: InstagramMediaItem[];
}

const router = Router();

/**
 * Get user's Instagram videos for selection
 * GET /api/video-automation/videos
 */
router.get('/videos', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    // Get user's Instagram media
    const integrations = await storage.getIntegrations(userId);
    const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);

    if (!igIntegration) {
      res.status(400).json({ error: 'Instagram not connected' });
      return;
    }

    // Fetch user's recent videos from Instagram Graph API
    const { decrypt } = await import('../lib/crypto/encryption');
    const meta = JSON.parse(decrypt(igIntegration.encryptedMeta)) as { pageId: string; accessToken: string };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${meta.pageId}/media?fields=id,media_type,media_url,caption,timestamp,permalink&limit=20`,
      {
        headers: { Authorization: `Bearer ${meta.accessToken}` }
      }
    );

    if (!response.ok) {
      res.status(500).json({ error: 'Failed to fetch Instagram videos' });
      return;
    }

    const data = await response.json() as InstagramMediaResponse;
    const videos = data.data
      .filter((item: InstagramMediaItem) => item.media_type === 'VIDEO' || item.media_type === 'CAROUSEL_ALBUM')
      .map((item: InstagramMediaItem) => ({
        id: item.id,
        url: item.permalink,
        mediaUrl: item.media_url,
        caption: item.caption || '',
        timestamp: item.timestamp
      }));

    res.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch videos';
    res.status(500).json({ error: message });
  }
});

/**
 * Create new video monitor configuration
 * POST /api/video-automation/monitors
 */
router.post('/monitors', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { videoId, videoUrl, productLink, ctaText, metadata } = req.body as {
      videoId: string;
      videoUrl?: string;
      productLink: string;
      ctaText: string;
      metadata?: Record<string, unknown>;
    };

    if (!videoId || !productLink || !ctaText) {
      res.status(400).json({ 
        error: 'Missing required fields: videoId, productLink, ctaText' 
      });
      return;
    }

    // Check if user has paid plan
    const user = await storage.getUserById(userId);
    if (!user || user.plan === 'trial') {
      res.status(403).json({ 
        error: 'Premium feature - Upgrade to a paid plan to access Video Comment Automation' 
      });
      return;
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
  } catch (error) {
    console.error('Error creating video monitor:', error);
    const message = error instanceof Error ? error.message : 'Failed to create monitor';
    res.status(500).json({ error: message });
  }
});

/**
 * Get all video monitors for user
 * GET /api/video-automation/monitors
 */
router.get('/monitors', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const monitors = await storage.getVideoMonitors(userId);
    res.json({ monitors });
  } catch (error) {
    console.error('Error fetching monitors:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch monitors';
    res.status(500).json({ error: message });
  }
});

/**
 * Update video monitor
 * PATCH /api/video-automation/monitors/:id
 */
router.patch('/monitors/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = getCurrentUserId(req)!;
    const updates = req.body as Record<string, unknown>;

    // Check if user has paid plan
    const user = await storage.getUserById(userId);
    if (!user || user.plan === 'trial') {
      res.status(403).json({ 
        error: 'Premium feature - Upgrade to a paid plan to access Video Comment Automation' 
      });
      return;
    }

    // Validate productLink if provided
    if (updates.productLink && typeof updates.productLink === 'string') {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(updates.productLink)) {
        res.status(400).json({ error: 'Invalid URL format for productLink' });
        return;
      }
    }

    const monitor = await storage.updateVideoMonitor(id, userId, updates);

    if (!monitor) {
      res.status(404).json({ error: 'Monitor not found' });
      return;
    }

    res.json({ success: true, monitor });
  } catch (error) {
    console.error('Error updating monitor:', error);
    const message = error instanceof Error ? error.message : 'Failed to update monitor';
    res.status(500).json({ error: message });
  }
});

/**
 * Delete video monitor
 * DELETE /api/video-automation/monitors/:id
 */
router.delete('/monitors/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = getCurrentUserId(req)!;

    // Check if user has paid plan
    const user = await storage.getUserById(userId);
    if (!user || user.plan === 'trial') {
      res.status(403).json({ 
        error: 'Premium feature - Upgrade to a paid plan to access Video Comment Automation' 
      });
      return;
    }

    await storage.deleteVideoMonitor(id, userId);
    res.json({ success: true, message: 'Monitor deleted' });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete monitor';
    res.status(500).json({ error: message });
  }
});

/**
 * Test comment intent detection
 * POST /api/video-automation/test-intent
 */
router.post('/test-intent', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { comment, videoContext } = req.body as { comment?: string; videoContext?: string };

    if (!comment) {
      res.status(400).json({ error: 'Comment text required' });
      return;
    }

    const intent = await detectBuyingIntent(comment, videoContext || '');

    res.json({
      intent,
      recommendation: intent.shouldDM 
        ? `AI will DM this lead with personalized sales message`
        : `No action needed - ${intent.intentType}`
    });
  } catch (error) {
    console.error('Intent test error:', error);
    const message = error instanceof Error ? error.message : 'Intent detection failed';
    res.status(500).json({ error: message });
  }
});

export default router;