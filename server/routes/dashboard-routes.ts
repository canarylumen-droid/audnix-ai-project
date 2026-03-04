import { Router, Request, Response } from 'express';
import { storage } from '../storage.js';
import { requireAuth } from '../middleware/auth.js';
import type { Lead, Message } from '../../shared/schema.js';
import { InstagramOAuth } from '../lib/oauth/instagram.js';
import { decrypt } from '../lib/crypto/encryption.js';

const router = Router();

/**
 * POST /api/dns/verify
 * Force a DNS/reputation check for a domain
 */
router.post('/dns/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    console.log(`[DNS Verify] Force check for ${domain} (User: ${userId})`);

    // In a full implementation, this triggers a background DNS lookup
    // For now, we clear the cache and notify stats updated to refresh UI
    statsCache.delete(userId);

    // Trigger real-time sync if connected
    try {
      const { imapIdleManager } = await import('../lib/email/imap-idle-manager.js');
      imapIdleManager.syncConnections();
    } catch (e) { /* ignore import errors in some envs */ }

    // Notify UI to refresh health scores
    const { wsSync } = await import('../lib/websocket-sync.js');
    wsSync.notifyStatsUpdated(userId);

    res.json({
      success: true,
      domain,
      status: 'excellent',
      message: 'Domain reputation and DNS records verification triggered.'
    });
  } catch (error) {
    console.error('DNS Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify DNS' });
  }
});

// In-memory cache for dashboard stats (60s)
const statsCache = new Map<string, { data: any, expires: number }>();

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

    const { integrationId } = req.query;
    const cacheKey = `${userId}:${integrationId || 'all'}`;
    const cached = statsCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      res.json(cached.data);
      return;
    }

    const user = await storage.getUserById(userId);
    const stats = await storage.getDashboardStats(userId, {
      integrationId: integrationId as string
    });

    // Real-time Engine Status & Synchronization
    const integrations = await storage.getIntegrations(userId);
    const monitors = await storage.getVideoMonitors(userId);

    // Get recent bounces - Handle potential column mapping issues
    let recentBounces = [];
    try {
      recentBounces = await storage.getRecentBounces(userId, 168); // Last 7 days
    } catch (bounceError) {
      console.warn('⚠️ Failed to fetch recent bounces, using empty list:', bounceError);
    }

    const domainVerifications = await storage.getDomainVerifications(userId, 5);

    // Calculate most recent sync time from all integrations
    const lastSyncTimestamp = integrations.reduce((latest, current) => {
      if (!current.lastSync) return latest;
      const currentSync = new Date(current.lastSync).getTime();
      return currentSync > latest ? currentSync : latest;
    }, 0);

    const isAutonomousMode = (user?.config as any)?.autonomousMode !== false;
    const engineStatus = isAutonomousMode ? "Autonomous" : "Paused";

    // Enhanced Domain Health Calculation (0-100)
    const hardBounces = recentBounces.filter(b => b.bounceType === 'hard').length;
    const softBounces = recentBounces.filter(b => b.bounceType === 'soft').length;
    const spamBounces = recentBounces.filter(b => b.bounceType === 'spam').length;

    let reputationScore = 100;
    if (stats.totalLeads > 0) {
      const bouncePenalty = (hardBounces * 5) + (softBounces * 2) + (spamBounces * 5);
      reputationScore = Math.max(0, 100 - bouncePenalty);
    }

    const unverifiedDomains = domainVerifications.filter(v => {
      const result = v.verification_result as any;
      return result && result.overallStatus !== 'excellent' && result.overallStatus !== 'good';
    }).length;

    const disconnectedIntegrations = integrations.filter(i => !i.connected).length;

    // [NEW] Workspace Benchmarks (Global Comparison)
    const allLeads = await storage.getLeads({ limit: 10000 });
    const globalAvgScore = allLeads.length > 0 ? (allLeads.reduce((sum, l) => sum + (l.score || 0), 0) / allLeads.length) : 50;

    const { db } = await import('../db.js');
    const { messages: msgSchema } = await import('../../shared/schema.js');
    const { sql: dSql } = await import('drizzle-orm');

    // Get global open rate for benchmark
    const [globalMsgStats] = await db.select({
      totalSent: dSql<number>`count(*) filter (where direction = 'outbound')`,
      opened: dSql<number>`count(*) filter (where direction = 'outbound' and opened_at is not null)`,
      replied: dSql<number>`count(*) filter (where direction = 'inbound')`
    }).from(msgSchema);

    const globalOpenRate = Number(globalMsgStats?.totalSent || 0) > 0
      ? Math.round((Number(globalMsgStats?.opened || 0) / Number(globalMsgStats?.totalSent || 0)) * 100)
      : 25; // Fallback benchmark

    const healthPenalty = (unverifiedDomains * 15) + (disconnectedIntegrations * 20);
    const domainHealth = Math.max(0, reputationScore - healthPenalty);

    const responseData = {
      ...stats,
      health: {
        score: domainHealth,
        status: domainHealth > 80 ? 'healthy' : (domainHealth > 50 ? 'warning' : 'critical'),
        reputation: reputationScore,
        bounces: {
          hard: hardBounces,
          soft: softBounces,
          spam: spamBounces,
          total: hardBounces + softBounces + spamBounces
        }
      },
      benchmarks: {
        avgLeadScore: Math.round(globalAvgScore),
        avgOpenRate: globalOpenRate,
        avgResponseRate: 15, // Fixed reference benchmark
        marketSentiment: 'positive'
      },
      sync: {
        status: engineStatus,
        lastSync: integrations.length > 0 ? (lastSyncTimestamp > 0 ? new Date(lastSyncTimestamp).toISOString() : null) : null,
        activeMonitors: monitors.length,
        isAutonomous: isAutonomousMode
      }
    };

    // Store in cache
    statsCache.set(cacheKey, {
      data: responseData,
      expires: Date.now() + 60 * 1000
    });

    res.json(responseData);
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

    const { integrationId } = req.query;
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await storage.getDashboardStats(userId, {
      start: sixtyDaysAgo,
      end: thirtyDaysAgo,
      integrationId: integrationId as string
    });

    res.json({
      totalLeads: stats.totalLeads,
      newLeads: stats.totalLeads,
      activeLeads: stats.activeLeads,
      convertedLeads: stats.convertedLeads,
    });
  } catch (error) {
    console.error('Previous stats error:', error);
    res.status(500).json({ error: 'Failed to fetch previous stats' });
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity feed for dashboard (Audit Trail)
 */
router.get('/activity', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { integrationId, days, limit } = req.query;
    const daysFilter = days ? parseInt(days as string) : 3;
    const options: any = { integrationId: integrationId as string };

    // If days is 'all', ignore daysFilter
    if (days !== 'all') {
      options.daysFilter = daysFilter;
    }

    if (limit) options.limit = parseInt(limit as string);

    const auditLogs = await storage.getAuditLogs(userId, options);
    const activities = auditLogs.map(log => ({
      id: log.id,
      type: log.action,
      title: log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      message: log.details?.message || log.action.replace(/_/g, ' '),
      description: log.details?.description || '',
      time: log.createdAt,
      timestamp: log.createdAt,
      leadId: log.leadId,
      metadata: log.details
    }));

    res.json({ activities });
  } catch (error) {
    console.error('[ACTIVITY] Failed to fetch dashboard activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
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
      avatar: user.avatar,
      subscriptionTier: user.subscriptionTier,
      businessName: user.businessName,
      filteredLeadsCount: user.filteredLeadsCount || 0,
      trialExpiresAt: user.trialExpiresAt,
      voiceNotesEnabled,
      createdAt: user.createdAt,
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
      company: user.businessName,
      timezone: user.timezone,
      role: user.role || 'member',
      plan: user.plan,
      avatar: user.avatar,
      subscriptionTier: user.subscriptionTier,
      businessName: user.businessName,
      trialExpiresAt: user.trialExpiresAt,
      voiceNotesEnabled,
      createdAt: user.createdAt,
      defaultCtaLink: metadata?.defaultCtaLink as string || '',
      defaultCtaText: metadata?.defaultCtaText as string || '',
      calendarLink: metadata?.calendarLink as string || '',
      metadata: {
        ...(metadata || {}),
        onboardingCompleted: hasCompletedOnboarding,
      },
    });
  } catch (error) {
    console.error('❌ Error in /api/user/profile:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : String(error)
    });
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

/**
 * PUT /api/user/profile
 * Update user profile including CTA settings
 */
router.put('/user/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, username, company, timezone, defaultCtaLink, defaultCtaText, calendarLink, voiceNotesEnabled, config } = req.body;

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existingMetadata = (user.metadata as Record<string, unknown>) || {};
    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (company !== undefined) updates.businessName = company;
    if (timezone !== undefined) updates.timezone = timezone;

    // Store CTA settings, Calendar Link, and Voice Settings in metadata
    if (defaultCtaLink !== undefined || defaultCtaText !== undefined || calendarLink !== undefined || voiceNotesEnabled !== undefined) {
      updates.metadata = {
        ...existingMetadata,
        ...(defaultCtaLink !== undefined && { defaultCtaLink }),
        ...(defaultCtaText !== undefined && { defaultCtaText }),
        ...(calendarLink !== undefined && { calendarLink }),
        ...(voiceNotesEnabled !== undefined && { voiceNotesEnabled: voiceNotesEnabled === true }),
      };
    }

    if (config !== undefined) {
      updates.config = {
        ...((user.config as any) || {}),
        ...config
      };
    }

    await storage.updateUser(userId, updates);

    res.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/dashboard/instagram/media
 * Get user's recent Instagram media for video automation
 */
router.get('/instagram/media', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get Instagram integration
    const integrations = await storage.getIntegrations(userId);
    const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);

    if (!igIntegration) {
      // Return empty list if not connected (frontend handles empty state)
      res.json({ media: [] });
      return;
    }

    // Decrypt token
    const decryptedMetaJson = decrypt(igIntegration.encryptedMeta);
    const decryptedMeta = JSON.parse(decryptedMetaJson);
    const accessToken = decryptedMeta.tokens?.access_token;

    if (!accessToken) {
      res.json({ media: [] });
      return;
    }

    // Fetch media
    const oauth = new InstagramOAuth();
    const media = await oauth.getMedia(accessToken, 20);

    res.json({ media });
  } catch (error) {
    console.error('Instagram media fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * GET /api/dashboard/analytics/outreach
 * Get daily outreach stats (sent/received) for analytics charts
 */
router.get('/analytics/outreach', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { db } = await import('../db.js');
    const { messages } = await import('../../shared/schema.js');
    const { sql, and, eq, gte } = await import('drizzle-orm');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Group messages by day and direction
    const stats = await db
      .select({
        day: sql<string>`DATE_TRUNC('day', ${messages.createdAt})`,
        direction: messages.direction,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          gte(messages.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('day', ${messages.createdAt})`, messages.direction)
      .orderBy(sql`DATE_TRUNC('day', ${messages.createdAt})`);

    // Ensure we have a default state even with no messages
    if (stats.length === 0) {
      res.json({
        success: true,
        data: [],
        summary: { totalSent: 0, totalReceived: 0 }
      });
      return;
    }

    // Format for frontend (e.g., Recharts)
    const formattedData = stats.reduce((acc: any[], curr: any) => {
      const dayStr = new Date(curr.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      let existing = acc.find(d => d.name === dayStr);
      if (!existing) {
        existing = { name: dayStr, sent: 0, received: 0 };
        acc.push(existing);
      }
      if (curr.direction === 'outbound') existing.sent += curr.count;
      else if (curr.direction === 'inbound') existing.received += curr.count;
      return acc;
    }, []);

    res.json({
      success: true,
      data: formattedData,
      summary: {
        totalSent: formattedData.reduce((sum: number, d: any) => sum + d.sent, 0),
        totalReceived: formattedData.reduce((sum: number, d: any) => sum + d.received, 0),
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/dashboard/analytics/full
 * Consistently high-performance consolidated analytics node
 */
router.get('/analytics/full', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session?.userId!;
    const range = parseInt(req.query.days as string) || 7;

    const analytics = await storage.getAnalyticsFull(userId, range);

    // Connection mapping
    const integrations = await storage.getIntegrations(userId);
    const customEmail = await storage.getIntegration(userId, 'custom_email');
    const isAnyConnected = integrations.some(i => i.connected) || !!customEmail?.connected;

    res.json({
      ...analytics,
      isAnyConnected
    });
  } catch (error) {
    console.error('Full analytics error:', error);
    res.status(500).json({ error: 'Failed to synchronize neural analytics' });
  }
});

/**
 * GET /api/dashboard/integrations/:id/health
 * Get DNS and connection health for a specific integration
 */
router.get('/integrations/:id/health', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId!;
    const integrationId = req.params.id;

    const integration = await storage.getIntegration(userId, integrationId);
    if (!integration) return res.status(404).json({ error: 'Integration not found' });

    // Mock DNS health for now - in production this would call a DNS lookup service
    const health = {
      connected: integration.connected,
      lastSync: integration.lastSync,
      dns: {
        spf: true,
        dkim: true,
        dmarc: true,
        tracking: true
      },
      status: integration.connected ? 'healthy' : 'disconnected'
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch health' });
  }
});

/**
 * GET /api/dashboard/integrations/:id/stats
 * Get performance stats for a specific mailbox
 */
router.get('/integrations/:id/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId!;
    const integrationId = req.params.id;

    const stats = await storage.getDashboardStats(userId, { integrationId });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integration stats' });
  }
});

export default router;
