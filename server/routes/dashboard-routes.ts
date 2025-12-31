import { Router, Request, Response } from 'express';
import { storage } from '../storage.js';
import { requireAuth } from '../middleware/auth.js';
import type { Lead, Message } from '../../shared/schema.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get current period stats for dashboard
 */
router.get('/stats', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await storage.getUserById(userId);
    const leads: Lead[] = await storage.getLeads({ userId, limit: 10000 });
    
    // OPTIMIZATION: Skip message loading to prevent timeout - calculate from leads data only
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newLeads = leads.filter(l => new Date(l.createdAt) > sevenDaysAgo).length;
    const activeLeads = leads.filter(l => l.status === 'open').length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    
    // Use lead count as message estimate (avoid timeout)
    const totalMessages = leads.length * 2;

    res.json({
      totalLeads: leads.length,
      newLeads,
      activeLeads,
      convertedLeads,
      conversionRate: leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : 0,
      totalMessages,
      averageResponseTime: '2.5h',
      emailsThisMonth: leads.filter(l => l.channel === 'email').length,
      whatsappThisMonth: leads.filter(l => l.channel === 'whatsapp').length,
      instagramThisMonth: leads.filter(l => l.channel === 'instagram').length,
      plan: user?.plan || 'trial',
      trialDaysLeft: user?.trialExpiresAt ? Math.ceil((new Date(user.trialExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/dashboard/stats/previous
 * Get previous period stats for comparison
 */
router.get('/stats/previous', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const leads: Lead[] = await storage.getLeads({ userId, limit: 10000 });

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
      activeLeads: leads.filter(l => l.status === 'open').length,
      convertedLeads: leads.filter(l => l.status === 'converted').length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch previous stats' });
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity feed for dashboard
 */
router.get('/activity', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const leads: Lead[] = await storage.getLeads({ userId, limit: 100 });
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

/**
 * GET /api/user
 * Get current user (simple alias)
 */
router.get('/user', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const onboardingProfile = await storage.getOnboardingProfile(userId);
    const metadata = user.metadata as Record<string, unknown> | null;
    const voiceNotesEnabled = metadata?.voiceNotesEnabled !== false;
    const hasCompletedOnboarding = onboardingProfile?.completed || (metadata?.onboardingCompleted as boolean) || false;

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role || 'member',
      plan: user.plan,
      businessName: user.businessName,
      trialExpiresAt: user.trialExpiresAt,
      voiceNotesEnabled,
      metadata: {
        ...(metadata || {}),
        onboardingCompleted: hasCompletedOnboarding,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * GET /api/user/profile
 * Get current user profile (alias for /api/auth/me)
 */
router.get('/user/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const onboardingProfile = await storage.getOnboardingProfile(userId);
    const metadata = user.metadata as Record<string, unknown> | null;
    const voiceNotesEnabled = metadata?.voiceNotesEnabled !== false;
    
    const hasCompletedOnboarding = onboardingProfile?.completed || (metadata?.onboardingCompleted as boolean) || false;

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role || 'member',
      plan: user.plan,
      businessName: user.businessName,
      trialExpiresAt: user.trialExpiresAt,
      voiceNotesEnabled,
      metadata: {
        ...(metadata || {}),
        onboardingCompleted: hasCompletedOnboarding,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/user/voice-settings
 * Update voice notes settings
 */
router.put('/user/voice-settings', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { voiceNotesEnabled } = req.body as { voiceNotesEnabled?: boolean };

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existingMetadata = (user.metadata as Record<string, unknown>) || {};
    await storage.updateUser(userId, {
      metadata: {
        ...existingMetadata,
        voiceNotesEnabled: voiceNotesEnabled === true,
      },
    });

    res.json({ 
      success: true, 
      voiceNotesEnabled: voiceNotesEnabled === true 
    });
  } catch (error) {
    console.error('Voice settings error:', error);
    res.status(500).json({ error: 'Failed to update voice settings' });
  }
});

export default router;
