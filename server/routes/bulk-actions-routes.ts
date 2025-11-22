/* @ts-nocheck */
import { Router, type Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';
import { generateAIReply, scheduleFollowUp } from '../lib/ai/conversation-ai';
import { calculateLeadScore } from '../lib/ai/lead-scoring';

const router = Router();

/**
 * Bulk update lead status
 * POST /api/bulk/update-status
 */
router.post('/update-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadIds, status } = req.body;
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds must be a non-empty array' });
    }

    if (!['new', 'open', 'replied', 'converted', 'not_interested', 'cold'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const results = [];
    const errors = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        await storage.updateLead(leadId, { status });
        results.push({ leadId, success: true });
      } catch (error: any) {
        errors.push({ leadId, error: error.message });
      }
    }

    res.json({
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: any) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk add tags
 * POST /api/bulk/add-tags
 */
router.post('/add-tags', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadIds, tags } = req.body;
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds must be a non-empty array' });
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'tags must be a non-empty array' });
    }

    const results = [];
    const errors = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        const existingTags = lead.tags || [];
        const newTags = Array.from(new Set([...existingTags, ...tags]));

        await storage.updateLead(leadId, { tags: newTags });
        results.push({ leadId, success: true, tags: newTags });
      } catch (error: any) {
        errors.push({ leadId, error: error.message });
      }
    }

    res.json({
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: any) {
    console.error('Bulk tag update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk send AI message
 * POST /api/bulk/send-message
 */
router.post('/send-message', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadIds, message } = req.body;
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds must be a non-empty array' });
    }

    const results = [];
    const errors = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        const messageBody = message || (await generateAIReply(
          lead,
          await storage.getMessagesByLeadId(leadId),
          lead.channel as any
        )).text;

        const msg = await storage.createMessage({
          leadId,
          userId,
          provider: lead.channel as any,
          direction: 'outbound',
          body: messageBody,
          metadata: { bulk_action: true }
        });

        await storage.updateLead(leadId, { lastMessageAt: new Date() });
        results.push({ leadId, success: true, messageId: msg.id });
      } catch (error: any) {
        errors.push({ leadId, error: error.message });
      }
    }

    res.json({
      success: errors.length === 0,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: any) {
    console.error('Bulk message send error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk score leads
 * POST /api/bulk/score-leads
 */
router.post('/score-leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadIds } = req.body;
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds must be a non-empty array' });
    }

    const results = [];
    const errors = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        const scoreData = await calculateLeadScore(leadId);
        
        await storage.updateLead(leadId, {
          score: scoreData.score,
          warm: scoreData.temperature !== 'cold',
          metadata: {
            ...lead.metadata,
            scoreBreakdown: scoreData.breakdown,
            temperature: scoreData.temperature,
            priority: scoreData.priority
          }
        });

        results.push({ 
          leadId, 
          success: true, 
          score: scoreData.score,
          temperature: scoreData.temperature
        });
      } catch (error: any) {
        errors.push({ leadId, error: error.message });
      }
    }

    res.json({
      success: errors.length === 0,
      scored: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: any) {
    console.error('Bulk scoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk delete leads
 * POST /api/bulk/delete
 */
router.post('/delete', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadIds } = req.body;
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds must be a non-empty array' });
    }

    const results = [];
    const errors = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        // Note: Actual deletion would require a delete method in storage
        // For now, we'll mark as cold/archived
        await storage.updateLead(leadId, { 
          status: 'cold',
          tags: [...(lead.tags || []), 'archived']
        });
        
        results.push({ leadId, success: true });
      } catch (error: any) {
        errors.push({ leadId, error: error.message });
      }
    }

    res.json({
      success: errors.length === 0,
      deleted: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
