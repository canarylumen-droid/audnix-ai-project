import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const deals = await storage.getDeals({ userId });
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

router.get('/analytics', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const revenue = await storage.calculateRevenue(userId);
    const deals = revenue.deals;

    const openDeals = deals.filter((d: any) => d.status === 'open');
    const wonDeals = deals.filter((d: any) => d.status === 'closed_won');
    const lostDeals = deals.filter((d: any) => d.status === 'closed_lost');

    res.json({
      totalRevenue: revenue.total,
      thisMonthRevenue: revenue.thisMonth,
      dealCount: deals.length,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      winRate: deals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100) : 0,
      pipelineValue: openDeals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0),
    });
  } catch (error) {
    console.error('Error fetching deal analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const deal = await storage.createDeal({
      userId,
      ...req.body
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

router.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const deal = await storage.updateDeal(req.params.id, userId, req.body);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    res.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

export default router;
