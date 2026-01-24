/**
 * Outreach API Routes - Trigger & manage humanized lead outreach campaigns
 */

import { Router } from 'express';
import { createOutreachCampaign, validateCampaignSafety, formatCampaignMetrics } from '../lib/sales-engine/outreach-engine.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyDomainDns } from '../lib/email/dns-verification.js';
import { generateExpertOutreach } from '../lib/ai/conversation-ai.js';

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

export default router;
