/**
 * Outreach API Routes - Trigger & manage humanized lead outreach campaigns
 */

import { Router } from 'express';
import { createOutreachCampaign, validateCampaignSafety, formatCampaignMetrics } from '../lib/sales-engine/outreach-engine.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyDomainDns } from '../lib/email/dns-verification.js';
import { generateExpertOutreach } from '../lib/ai/conversation-ai.js';
import { outreachCampaigns, campaignLeads, messages } from '../../shared/schema.js';
import { db } from '../db.js';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/outreach/preview
 * Generate a high-fidelity outreach preview for a lead
 */
router.post('/preview', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId!;
    const { lead } = req.body;

    if (!lead) {
      return res.status(400).json({ error: 'Lead data required for preview' });
    }

    const preview = await generateExpertOutreach(lead, userId);

    return res.json({
      success: true,
      preview
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Failed to generate neural preview' });
  }
});

/**
 * POST /api/outreach/campaign/create
 * Create a new outreach campaign from leads
 */
router.post('/campaign/create', requireAuth, async (req, res) => {
  try {
    const { leads, campaignName } = req.body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'Leads array required' });
    }

    if (!campaignName) {
      return res.status(400).json({ error: 'Campaign name required' });
    }

    // --- NEW: PRE-FLIGHT NEURAL CHECK ---
    const filteredLeads = [];
    let blockedCount = 0;

    for (const lead of leads) {
      if (lead.email) {
        const domain = lead.email.split('@')[1];
        if (domain) {
          const dnsCheck = await verifyDomainDns(domain);
          if (dnsCheck.overallStatus === 'poor' || !dnsCheck.mx.found) {
            blockedCount++;
            continue;
          }
        }
      }
      filteredLeads.push(lead);
    }

    if (filteredLeads.length === 0) {
      return res.status(400).json({ error: 'No deliverable leads in batch after neural filtering' });
    }

    // Create campaign with filtered leads
    const campaign = await createOutreachCampaign(filteredLeads, campaignName);

    // Validate safety
    const safety = validateCampaignSafety(campaign);

    console.log('✅ Campaign created:', {
      campaignId: campaign.campaignId,
      totalLeads: campaign.totalLeads,
      estimatedRevenue: campaign.estimatedRevenue,
      safety,
    });

    return res.json({
      success: true,
      campaign,
      safety,
      blockedByNeuralFilter: blockedCount,
      metrics: formatCampaignMetrics(campaign),
    });
  } catch (error: any) {
    console.error('❌ Campaign creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/outreach/campaigns
 * List all campaigns for the user
 */
router.get('/campaigns', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const campaigns = await db.select()
      .from(outreachCampaigns)
      .where(eq(outreachCampaigns.userId, userId));

    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outreach/campaigns
 * Standard campaign creation endpoint used by frontend
 */
router.post('/campaigns', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, config, template, leads } = req.body;

    if (!name || !config || !template || !leads) {
      return res.status(400).json({ error: 'Missing required campaign data' });
    }

    const [campaign] = await db.insert(outreachCampaigns).values({
      userId,
      name,
      config,
      template,
      status: 'draft'
    }).returning();

    // Link leads to campaign
    if (leads && Array.isArray(leads)) {
      const leadLinks = leads.map(leadId => ({
        campaignId: campaign.id,
        leadId,
        status: 'pending' as const
      }));

      // Batch insert in chunks of 50 to avoid parameter limits if leads is huge
      for (let i = 0; i < leadLinks.length; i += 50) {
        await db.insert(campaignLeads).values(leadLinks.slice(i, i + 50)).onConflictDoNothing();
      }
    }

    res.json(campaign);
  } catch (error: any) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outreach/campaigns/:id/start
 * Start a draft campaign
 */
router.post('/campaigns/:id/start', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [campaign] = await db.update(outreachCampaigns)
      .set({ status: 'active', updatedAt: new Date() })
      .where(and(eq(outreachCampaigns.id, id), eq(outreachCampaigns.userId, userId)))
      .returning();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/outreach/strategy
 * Get current outreach strategy info
 */
router.get('/strategy', requireAuth, async (req, res) => {
  try {
    const { OUTREACH_STRATEGY, REVENUE_PROJECTION } = await import('../lib/sales-engine/outreach-strategy.js');

    res.json({
      strategy: OUTREACH_STRATEGY,
      projections: REVENUE_PROJECTION,
      description: 'Bulletproof humanized outreach: 5-day rollout, $15k-$61k revenue target',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/outreach/guide
 * Get outreach strategy guide
 */
router.get('/guide', async (req, res) => {
  try {
    // Return guide markdown (could be from file or generated)
    const guide = `
📊 OUTREACH STRATEGY GUIDE

This endpoint returns the humanized outreach strategy.
See: OUTREACH_STRATEGY_GUIDE.md in project root

Key points:
- 5-day rollout across segments
- Randomized timing to avoid spam flags
- Message rotation (5 hook variations)
- Follow-up sequences by tier
- Safety guardrails prevent reputation damage
- Revenue projection: $15k-$61k in 5 days

To launch:
1. Create campaign via POST /api/outreach/campaign/create
2. Review pre-flight safety checks
3. Start campaign
4. Monitor dashboard
5. Optimize based on real-time data
    `;

    res.json({ guide });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outreach/demo-hvac
 * Run demo HVAC outreach campaign (no auth required for testing)
 * Creates test user if needed and sends 8 emails with 6-hour follow-ups
 */
router.post('/demo-hvac', async (req, res) => {
  try {
    const { storage } = await import('../storage.js');
    const { runDemoOutreach } = await import('../lib/outreach/outreach-runner.js');

    console.log('🚀 Starting HVAC demo outreach campaign...');

    // Find or create test user
    let user = await storage.getUserByEmail('canarylumen1@gmail.com');

    if (!user) {
      console.log('📝 Creating test user: canarylumen1@gmail.com');
      user = await storage.createUser({
        email: 'canarylumen1@gmail.com',
        username: 'canarylumen',
        password: '$2a$10$demoasheddpassword', // Placeholder - not for production
        plan: 'enterprise'
      });
    }

    console.log(`✅ Using user ID: ${user.id}`);

    // Run the HVAC demo outreach
    const result = await runDemoOutreach(user.id);

    // Create completion notification
    await storage.createNotification({
      userId: user.id,
      type: 'insight',
      title: '🚀 HVAC Outreach Campaign Complete',
      message: `Sent ${result.summary.sent}/${result.summary.total} emails to HVAC leads. ${result.summary.failed} failed. 6-hour follow-ups scheduled.`,
      metadata: {
        activityType: 'outreach_campaign_complete',
        sent: result.summary.sent,
        failed: result.summary.failed,
        total: result.summary.total,
        followUpHours: 6
      }
    });

    console.log(`✅ Campaign complete: ${result.summary.sent}/${result.summary.total} sent`);

    res.json({
      success: true,
      message: `HVAC outreach campaign completed! ${result.summary.sent} of ${result.summary.total} emails sent.`,
      ...result
    });
  } catch (error: any) {
    console.error('HVAC demo outreach error:', error);
    res.status(500).json({ error: error.message });
  }
});


// -- New Manual Campaign Routes --

// Manual Campaign Routes logic follows...

/**
 * GET /api/outreach/campaigns
 * List all manual campaigns
 */
router.get('/campaigns', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId!;
    const campaigns = await db.select().from(outreachCampaigns)
      .where(eq(outreachCampaigns.userId, userId))
      .orderBy(desc(outreachCampaigns.createdAt));
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outreach/campaigns
 * Create a new manual campaign
 */
router.post('/campaigns', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId!;
    const { name, config, template, leads } = req.body;

    if (!name || !config || !template) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create campaign
    const [campaign] = await db.insert(outreachCampaigns).values({
      userId,
      name,
      config,
      template,
      status: 'draft',
      stats: { total: leads?.length || 0, sent: 0, replied: 0, bounced: 0 }
    }).returning();

    // Add leads if provided
    if (leads && Array.isArray(leads) && leads.length > 0) {
      await db.insert(campaignLeads).values(
        leads.map((leadId: string) => ({
          campaignId: campaign.id,
          leadId,
          status: 'pending'
        }))
      );
    }

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/outreach/campaigns/:id
 * Get campaign details
 */
router.get('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [campaign] = await db.select().from(outreachCampaigns).where(eq(outreachCampaigns.id, id));

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Get live stats
    const leadStats = await db.select({
      status: campaignLeads.status,
      count: sql<number>`count(*)`
    })
      .from(campaignLeads)
      .where(eq(campaignLeads.campaignId, id))
      .groupBy(campaignLeads.status);

    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      replied: 0
    };

    leadStats.forEach((s: any) => {
      stats.total += Number(s.count);
      // @ts-ignore
      if (stats[s.status] !== undefined) stats[s.status] += Number(s.count);
    });

    res.json({ ...campaign, liveStats: stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outreach/campaigns/:id/start
 * Start campaign
 */
router.post('/campaigns/:id/start', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [campaign] = await db.update(outreachCampaigns)
      .set({ status: 'active' })
      .where(eq(outreachCampaigns.id, id))
      .returning();
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outreach/campaigns/:id/pause
 * Pause campaign
 */
router.post('/campaigns/:id/pause', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [campaign] = await db.update(outreachCampaigns)
      .set({ status: 'active' })
      .where(eq(outreachCampaigns.id, id))
      .returning();

    // Trigger immediate worker processing if campaign is active
    if (campaign) {
      const { followUpWorker } = await import('../lib/ai/follow-up-worker.js');
      // We don't await this as it might take time, just trigger it
      followUpWorker.processQueue().catch(err => console.error('Immediate queue processing failed:', err));
    }

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/outreach/track/:trackingId
 * Tracking pixel endpoint for email opens
 */
router.get('/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { wsSync } = await import('../lib/websocket-sync.js');

    // Update openedAt for the message
    const [message] = await db.update(messages)
      .set({
        openedAt: new Date(),
        isRead: true
      })
      .where(eq(messages.trackingId, trackingId))
      .returning();

    if (message) {
      console.log(`👁️ Email opened: trackingId=${trackingId}, userId=${message.userId}`);
      // Notify UI in real-time
      wsSync.notifyMessagesUpdated(message.userId, {
        type: 'UPDATE',
        messageId: message.id,
        event: 'opened'
      });
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.end(pixel);
  } catch (error) {
    console.error('Tracking pixel error:', error);
    // Still return the pixel even on error to avoid broken images
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set('Content-Type', 'image/gif');
    return res.end(pixel);
  }
});

export default router;

