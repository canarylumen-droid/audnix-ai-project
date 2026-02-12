/**
 * Outreach API Routes - Trigger & manage humanized lead outreach campaigns
 */

import { Router } from 'express';
import { createOutreachCampaign, validateCampaignSafety, formatCampaignMetrics } from '../lib/sales-engine/outreach-engine.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidUUID } from '../lib/utils/validation.js';
import { verifyDomainDns } from '../lib/email/dns-verification.js';
import { generateExpertOutreach } from '../lib/ai/conversation-ai.js';
import { outreachCampaigns, campaignLeads, messages, campaignEmails } from '../../shared/schema.js';
import { storage } from '../storage.js';
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

// Merged with /api/outreach/campaigns

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

router.post('/campaigns', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, config, template, leads } = req.body;

    if (!name || !leads) {
      return res.status(400).json({ error: 'Missing required campaign data' });
    }

    // Default config and template if missing (for the "Neural Filter" style calls)
    const campaignConfig = config || { dailyLimit: 50 };
    const campaignTemplate = template || { subject: 'Re connecting', body: 'Hey {lead_name}, reaching out.' };

    // Enforce 500 emails/day limit
    if (campaignConfig.dailyLimit) {
      campaignConfig.dailyLimit = Math.min(parseInt(campaignConfig.dailyLimit) || 50, 500);
    }

    const [campaign] = await db.insert(outreachCampaigns).values({
      userId,
      name,
      config: campaignConfig,
      template: campaignTemplate,
      status: 'draft',
      stats: { total: leads?.length || 0, sent: 0, replied: 0, bounced: 0 }
    }).returning();

    // Link leads to campaign (with auto-upsert for non-UUIDs)
    let addedCount = 0;
    if (leads && Array.isArray(leads)) {
      const finalLeadIds: string[] = [];

      for (const leadItem of leads) {
        // 1. If it's a valid UUID, use it directly
        if (typeof leadItem === 'string' && isValidUUID(leadItem)) {
          finalLeadIds.push(leadItem);
          continue;
        }

        // 2. If it's an object with an ID that's a valid UUID
        if (typeof leadItem === 'object' && leadItem !== null && leadItem.id && isValidUUID(leadItem.id)) {
          finalLeadIds.push(leadItem.id);
          continue;
        }

        // 3. Auto-Upsert: If it's an email string or object with email
        const email = typeof leadItem === 'string' ? leadItem : leadItem?.email;
        const name = typeof leadItem === 'object' ? leadItem?.name : (email?.split('@')[0] || 'Unknown');

        if (email && email.includes('@')) {
          try {
            // Check if lead already exists by email
            let existingLead = await storage.getLeadByEmail(email, userId);
            
            if (!existingLead) {
              // Create new lead
              existingLead = await storage.createLead({
                userId,
                name: name || 'Unknown',
                email: email,
                channel: 'email',
                status: 'new',
                aiPaused: false,
                metadata: { 
                  auto_created: true, 
                  campaign_id: campaign.id,
                  import_date: new Date().toISOString() 
                }
              });
              console.log(`[Campaign] Auto-created lead: ${email}`);
            } else if (existingLead.userId !== userId) {
                continue;
            }

            // --- Deduplication Check (Phase 1 Requirement) ---
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const lastContacted = existingLead.lastMessageAt ? new Date(existingLead.lastMessageAt) : null;
            const hasReplied = existingLead.status === 'replied' || existingLead.status === 'converted';
            
            if (hasReplied) {
              console.log(`[Campaign] Skipping lead ${email}: Already replied/converted.`);
              continue;
            }

            if (lastContacted && lastContacted > thirtyDaysAgo) {
              console.log(`[Campaign] Skipping lead ${email}: Contacted in the last 30 days.`);
              continue;
            }
            
            finalLeadIds.push(existingLead.id);
          } catch (err) {
            console.error(`[Campaign] Failed to auto-upsert/dedupe lead ${email}:`, err);
          }
        }
      }

      const leadLinks = finalLeadIds.map(leadId => ({
        campaignId: campaign.id,
        leadId,
        status: 'pending' as const
      }));
      addedCount = leadLinks.length;

      // Batch insert in chunks of 50 to avoid parameter limits
      for (let i = 0; i < leadLinks.length; i += 50) {
        await db.insert(campaignLeads).values(leadLinks.slice(i, i + 50)).onConflictDoNothing();
      }
    }

    // Calculate metrics/safety for response (parity with old /campaign/create)
    const metricsResult = await createOutreachCampaign(leads, name);
    const safety = validateCampaignSafety(metricsResult);

    res.json({ 
      ...campaign, 
      addedLeads: addedCount,
      safety,
      metrics: formatCampaignMetrics(metricsResult)
    });
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
 * POST /api/outreach/campaigns/:id/pause
 * Pause an active campaign
 */
router.post('/campaigns/:id/pause', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [campaign] = await db.update(outreachCampaigns)
      .set({ status: 'paused', updatedAt: new Date() })
      .where(and(eq(outreachCampaigns.id, id), eq(outreachCampaigns.userId, userId)))
      .returning();

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outreach/campaigns/:id/resume
 * Resume a paused campaign
 */
router.post('/campaigns/:id/resume', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [campaign] = await db.update(outreachCampaigns)
      .set({ status: 'active', updatedAt: new Date() })
      .where(and(eq(outreachCampaigns.id, id), eq(outreachCampaigns.userId, userId)))
      .returning();

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/outreach/campaigns/:id
 * Get campaign details with live stats
 */
router.get('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [campaign] = await db.select().from(outreachCampaigns)
      .where(and(eq(outreachCampaigns.id, id), eq(outreachCampaigns.userId, userId)));

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




/**
 * GET /api/outreach/track/:trackingId
 * Tracking pixel endpoint for email opens
 */
router.get('/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { wsSync } = await import('../lib/websocket-sync.js');

    // 1. Update openedAt for the message in unified inbox
    const [message] = await db.update(messages)
      .set({
        openedAt: new Date(),
        isRead: true
      })
      .where(eq(messages.trackingId, trackingId))
      .returning();

    // 2. Update campaign_emails status for detailed campaign tracking
    const [campaignEmail] = await db.update(campaignEmails)
      .set({ 
        status: 'opened',
        metadata: sql`jsonb_set(metadata, '{openedAt}', ${JSON.stringify(new Date().toISOString())}::jsonb)`
      })
      .where(and(eq(campaignEmails.messageId, trackingId), ne(campaignEmails.status, 'opened')))
      .returning();

    // 3. Roll up stats to campaign level
    if (campaignEmail?.campaignId) {
      await db.update(outreachCampaigns)
        .set({
          stats: sql`jsonb_set(stats, '{opened}', (COALESCE((stats->>'opened')::int, 0) + 1)::text::jsonb)`,
          updatedAt: new Date()
        })
        .where(eq(outreachCampaigns.id, campaignEmail.campaignId));
      
      console.log(`📊 Campaign stat updated: campaignId=${campaignEmail.campaignId}, stat=opened`);
    }

    if (message) {
      console.log(`👁️ Email opened: trackingId=${trackingId}, userId=${message.userId}`);
      // Notify UI in real-time
      wsSync.notifyMessagesUpdated(message.userId, {
        type: 'UPDATE',
        messageId: message.id,
        event: 'opened'
      });
      wsSync.notifyActivityUpdated(message.userId, {
        type: 'email_opened',
        messageId: message.id,
        leadId: message.leadId,
        trackingId
      });

      // Create audit log for activity feed
      await storage.createAuditLog({
        userId: message.userId,
        leadId: message.leadId,
        action: 'email_opened',
        details: {
          message: `Email opened by lead`,
          messageId: message.id,
          trackingId
        }
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

