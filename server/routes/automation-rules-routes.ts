import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../db.js';
import { automationRules, contentLibrary } from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

function getCurrentUserId(req: Request): string | null {
  return req.session?.userId || null;
}

// ========== AUTOMATION RULES ==========

router.get('/rules', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    
    const rules = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.userId, userId))
      .orderBy(desc(automationRules.createdAt));
    
    res.json({ rules });
  } catch (error: any) {
    console.error('Error fetching automation rules:', error.message);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

router.post('/rules', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { 
      name, 
      channel, 
      minIntentScore, 
      maxIntentScore, 
      minConfidence,
      allowedActions,
      cooldownMinutes,
      maxActionsPerDay,
      escalateOnLowConfidence,
      requireHumanApproval
    } = req.body;
    
    if (!name || !channel) {
      res.status(400).json({ error: 'Name and channel required' });
      return;
    }
    
    const [rule] = await db
      .insert(automationRules)
      .values({
        userId,
        name,
        channel,
        minIntentScore: minIntentScore ?? 50,
        maxIntentScore: maxIntentScore ?? 100,
        minConfidence: minConfidence ?? 0.6,
        allowedActions: allowedActions ?? ['reply'],
        cooldownMinutes: cooldownMinutes ?? 60,
        maxActionsPerDay: maxActionsPerDay ?? 10,
        escalateOnLowConfidence: escalateOnLowConfidence ?? true,
        requireHumanApproval: requireHumanApproval ?? false,
      })
      .returning();
    
    res.json({ rule });
  } catch (error: any) {
    console.error('Error creating automation rule:', error.message);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

router.put('/rules/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { id } = req.params;
    const updates = req.body;
    
    const [rule] = await db
      .update(automationRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)))
      .returning();
    
    if (!rule) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    
    res.json({ rule });
  } catch (error: any) {
    console.error('Error updating automation rule:', error.message);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

router.delete('/rules/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { id } = req.params;
    
    await db
      .delete(automationRules)
      .where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)));
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting automation rule:', error.message);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// ========== CONTENT LIBRARY ==========

router.get('/content', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { type } = req.query;
    
    let query = db
      .select()
      .from(contentLibrary)
      .where(eq(contentLibrary.userId, userId))
      .orderBy(desc(contentLibrary.createdAt));
    
    const content = await query;
    
    // Filter by type if specified
    const filtered = type 
      ? content.filter(c => c.type === type)
      : content;
    
    res.json({ content: filtered });
  } catch (error: any) {
    console.error('Error fetching content library:', error.message);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.post('/content', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { 
      type, 
      name, 
      content,
      intentTags,
      objectionTags,
      channelRestriction,
      linkedVideoId,
      linkedCtaLink
    } = req.body;
    
    if (!type || !name || !content) {
      res.status(400).json({ error: 'Type, name, and content required' });
      return;
    }
    
    const [item] = await db
      .insert(contentLibrary)
      .values({
        userId,
        type,
        name,
        content,
        intentTags: intentTags ?? [],
        objectionTags: objectionTags ?? [],
        channelRestriction: channelRestriction ?? 'all',
        linkedVideoId,
        linkedCtaLink,
      })
      .returning();
    
    res.json({ item });
  } catch (error: any) {
    console.error('Error creating content:', error.message);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

router.put('/content/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { id } = req.params;
    const updates = req.body;
    
    const [item] = await db
      .update(contentLibrary)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(contentLibrary.id, id), eq(contentLibrary.userId, userId)))
      .returning();
    
    if (!item) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }
    
    res.json({ item });
  } catch (error: any) {
    console.error('Error updating content:', error.message);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

router.delete('/content/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { id } = req.params;
    
    await db
      .delete(contentLibrary)
      .where(and(eq(contentLibrary.id, id), eq(contentLibrary.userId, userId)));
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting content:', error.message);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

export default router;
