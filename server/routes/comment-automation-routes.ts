/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import { processCommentAutomation, detectCommentIntent } from '../lib/ai/comment-detection';
import { requireAuth, getCurrentUserId } from '../middleware/auth';

const router = Router();

/**
 * Process a comment and trigger DM automation
 * POST /api/automation/comment
 */
router.post('/comment', requireAuth, async (req: Request, res: Response) => {
  try {
    const { comment, username, channel, postContext } = req.body;
    const userId = getCurrentUserId(req)!;

    if (!comment || !username || !channel) {
      return res.status(400).json({ 
        error: 'Missing required fields: comment, username, channel' 
      });
    }

    const result = await processCommentAutomation(
      userId,
      comment,
      username,
      channel,
      postContext || 'New post'
    );

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: 'Comment does not indicate DM interest - no automation triggered'
      });
    }

    res.json({
      success: true,
      lead: result.lead,
      message: 'Initial DM sent and 6-hour follow-up scheduled',
      followUpScheduled: result.followUpScheduled
    });
  } catch (error: any) {
    console.error('Comment automation error:', error);
    res.status(500).json({ error: error.message || 'Comment automation failed' });
  }
});

/**
 * Analyze a comment to see if it indicates DM intent
 * POST /api/automation/analyze-comment
 */
router.post('/analyze-comment', requireAuth, async (req: Request, res: Response) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const intent = await detectCommentIntent(comment);

    res.json({
      wantsDM: intent.wantsDM,
      intent: intent.intent,
      confidence: intent.confidence,
      recommendation: intent.wantsDM 
        ? 'Trigger DM automation for this comment' 
        : 'No DM automation needed'
    });
  } catch (error: any) {
    console.error('Comment analysis error:', error);
    res.status(500).json({ error: error.message || 'Comment analysis failed' });
  }
});

/**
 * Manually trigger comment automation for a specific comment
 * POST /api/automation/manual-trigger
 */
router.post('/manual-trigger', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId, postContext } = req.body;
    const userId = getCurrentUserId(req)!;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID required' });
    }

    // This would integrate with your existing follow-up system
    res.json({
      success: true,
      message: 'Manual follow-up triggered',
      scheduledIn: '6 hours'
    });
  } catch (error: any) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ error: error.message || 'Manual trigger failed' });
  }
});

export default router;