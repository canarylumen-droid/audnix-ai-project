/* @ts-nocheck */
import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get current period stats for dashboard
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const user = await storage.getUserById(userId);
    const leads = await storage.getLeads({ userId, limit: 10000 });
    const messages = await storage.getMessages(leads.map(l => l.id).slice(0, 100));

    // Get current period stats (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newLeads = leads.filter(l => new Date(l.createdAt) > sevenDaysAgo).length;
    const activeLeads = leads.filter(l => l.status === 'active').length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const totalMessages = messages?.length || 0;

    res.json({
      totalLeads: leads.length,
      newLeads,
      activeLeads,
      convertedLeads,
      conversionRate: leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : 0,
      totalMessages,
      averageResponseTime: '2.5h', // Placeholder
      emailsThisMonth: leads.filter(l => l.channel === 'email').length,
      whatsappThisMonth: leads.filter(l => l.channel === 'whatsapp').length,
      instagramThisMonth: leads.filter(l => l.channel === 'instagram').length,
      plan: user?.plan || 'trial',
      trialDaysLeft: user?.trialExpiresAt ? Math.ceil((new Date(user.trialExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/dashboard/stats/previous
 * Get previous period stats for comparison
 */
router.get('/stats/previous', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const leads = await storage.getLeads({ userId, limit: 10000 });

    // Get previous period stats (7-14 days ago)
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const previousLeads = leads.filter(l => {
      const createdAt = new Date(l.createdAt);
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
    }).length;

    res.json({
      totalLeads: previousLeads,
      newLeads: previousLeads,
      activeLeads: leads.filter(l => l.status === 'active').length,
      convertedLeads: leads.filter(l => l.status === 'converted').length,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch previous stats' });
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity feed for dashboard
 */
router.get('/activity', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const leads = await storage.getLeads({ userId, limit: 100 });
    const activities = leads
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 10)
      .map(lead => ({
        id: lead.id,
        type: lead.status === 'converted' ? 'lead_converted' : 'lead_updated',
        title: lead.status === 'converted' ? `${lead.name} converted` : `${lead.name} updated`,
        description: `From ${lead.channel}`,
        timestamp: lead.updatedAt || lead.createdAt,
        channel: lead.channel,
        leadId: lead.id,
      }));

    res.json({ activities });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

/**
 * GET /api/user/profile
 * Get current user profile (alias for /api/auth/me)
 */
router.get('/user/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        businessName: user.businessName,
        trialExpiresAt: user.trialExpiresAt,
        metadata: user.metadata,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
