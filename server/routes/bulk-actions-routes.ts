import { Router, type Request, type Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { generateAIReply } from '../lib/ai/conversation-ai.js';
import { calculateLeadScore } from '../lib/ai/lead-scoring.js';
import type { ChannelType, ProviderType, LeadStatus } from '../../shared/types.js';

const router = Router();

// Add missing import-bulk endpoint for compatibility
router.post('/import-bulk', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leads: leadsData, channel = 'email', aiPaused = false } = req.body as {
      leads: Array<{ name?: string; email?: string; phone?: string; company?: string }>;
      channel?: 'email' | 'instagram';
      aiPaused?: boolean;
    };

    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      res.status(400).json({ error: "No leads data provided" });
      return;
    }

    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const results = {
      leadsImported: 0,
      leadsUpdated: 0,
      leadsFiltered: 0,
      errors: [] as string[]
    };

    const { mapCsvToLeadMetadata } = await import('../lib/imports/lead-importer.js');

    const importedIdentifiers = new Set<string>();

    for (let i = 0; i < leadsData.length; i++) {
      const leadData = leadsData[i];
      try {
        const metadata = mapCsvToLeadMetadata(leadData);
        const email = metadata.email || leadData.email;
        const name = metadata.name || leadData.name;
        const identifier = email || name || 'unknown';

        if (!email && !name) {
          results.errors.push(`Row ${i + 1}: Missing name and email`);
          results.leadsFiltered++;
          continue;
        }

        if (importedIdentifiers.has(identifier.toLowerCase())) {
          results.errors.push(`Row ${i + 1}: Duplicate in upload batch`);
          continue;
        }

        const existingLead = existingLeads.find(l => 
          (leadData.email && l.email?.toLowerCase() === leadData.email.toLowerCase())
        );

        if (existingLead) {
          const updates: Record<string, any> = {};
          if (!existingLead.email && leadData.email) updates.email = leadData.email;
          if ((!existingLead.name || existingLead.name === 'Unknown') && leadData.name) updates.name = leadData.name;
          
          if (Object.keys(updates).length > 0) {
            await storage.updateLead(existingLead.id, updates);
            results.leadsUpdated++;
          }
          continue;
        }

        await storage.createLead({
          userId,
          name: name || 'Unknown',
          email: email || null,
          phone: metadata.phone || leadData.phone || null,
          company: metadata.company || leadData.company || null,
          channel: channel as any,
          status: 'new',
          aiPaused: aiPaused,
          metadata: { ...leadData, ...metadata }
        });

        results.leadsImported++;
        importedIdentifiers.add(identifier.toLowerCase());
      } catch (err: any) {
        results.errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      leadsImported: results.leadsImported,
      leadsUpdated: results.leadsUpdated,
      leadsFiltered: results.leadsFiltered,
      errors: results.errors,
      totalCount: (await storage.getLeads({ userId, limit: 1 })).length, // Just a hint for frontend
      message: `Imported ${results.leadsImported} leads. Updated ${results.leadsUpdated} existing.`
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

interface BulkResult {
  leadId: string;
  success: boolean;
  messageId?: string;
  tags?: string[];
  score?: number;
  temperature?: string;
}

interface BulkError {
  leadId: string;
  error: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function channelToProvider(channel: ChannelType): ProviderType {
  if (channel === 'instagram') return 'instagram';
  return 'email';
}

/**
 * Bulk update lead status
 * POST /api/bulk/update-status
 */
router.post('/update-status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds, status } = req.body as { leadIds: string[]; status: LeadStatus };
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({ error: 'leadIds must be a non-empty array' });
      return;
    }

    const validStatuses: LeadStatus[] = ['new', 'open', 'replied', 'converted', 'not_interested', 'cold'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const results: BulkResult[] = [];
    const errors: BulkError[] = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        await storage.updateLead(leadId, { status });
        results.push({ leadId, success: true });
      } catch (error: unknown) {
        errors.push({ leadId, error: getErrorMessage(error) });
      }
    }

    res.json({
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: unknown) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * Bulk add tags
 * POST /api/bulk/add-tags
 */
router.post('/add-tags', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds, tags } = req.body as { leadIds: string[]; tags: string[] };
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({ error: 'leadIds must be a non-empty array' });
      return;
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      res.status(400).json({ error: 'tags must be a non-empty array' });
      return;
    }

    const results: BulkResult[] = [];
    const errors: BulkError[] = [];

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
      } catch (error: unknown) {
        errors.push({ leadId, error: getErrorMessage(error) });
      }
    }

    res.json({
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: unknown) {
    console.error('Bulk tag update error:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * Bulk send AI message
 * POST /api/bulk/send-message
 */
router.post('/send-message', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds, message } = req.body as { leadIds: string[]; message?: string };
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({ error: 'leadIds must be a non-empty array' });
      return;
    }

    const results: BulkResult[] = [];
    const errors: BulkError[] = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        const channel = lead.channel as ChannelType;
        const messageBody = message || (await generateAIReply(
          lead,
          await storage.getMessagesByLeadId(leadId),
          channel
        )).text;

        const msg = await storage.createMessage({
          leadId,
          userId,
          provider: channelToProvider(channel),
          direction: 'outbound',
          body: messageBody,
          metadata: { bulk_action: true }
        });

        await storage.updateLead(leadId, { lastMessageAt: new Date() });
        results.push({ leadId, success: true, messageId: msg.id });
      } catch (error: unknown) {
        errors.push({ leadId, error: getErrorMessage(error) });
      }
    }

    res.json({
      success: errors.length === 0,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: unknown) {
    console.error('Bulk message send error:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * Bulk score leads
 * POST /api/bulk/score-leads
 */
router.post('/score-leads', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds } = req.body as { leadIds: string[] };
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({ error: 'leadIds must be a non-empty array' });
      return;
    }

    const results: BulkResult[] = [];
    const errors: BulkError[] = [];

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
      } catch (error: unknown) {
        errors.push({ leadId, error: getErrorMessage(error) });
      }
    }

    res.json({
      success: errors.length === 0,
      scored: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: unknown) {
    console.error('Bulk scoring error:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * Bulk delete leads
 * POST /api/bulk/delete
 */
router.post('/delete', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds } = req.body as { leadIds: string[] };
    const userId = getCurrentUserId(req)!;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({ error: 'leadIds must be a non-empty array' });
      return;
    }

    const results: BulkResult[] = [];
    const errors: BulkError[] = [];

    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLeadById(leadId);
        if (!lead || lead.userId !== userId) {
          errors.push({ leadId, error: 'Lead not found or unauthorized' });
          continue;
        }

        await storage.updateLead(leadId, {
          status: 'cold',
          tags: [...(lead.tags || []), 'archived']
        });

        results.push({ leadId, success: true });
      } catch (error: unknown) {
        errors.push({ leadId, error: getErrorMessage(error) });
      }
    }

    res.json({
      success: errors.length === 0,
      deleted: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error: unknown) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * Export all leads as CSV
 * GET /api/bulk/export
 */
router.get('/export', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const leads = await storage.getLeads({ userId, limit: 10000 });

    if (leads.length === 0) {
      res.status(404).json({ error: 'No data to export' });
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Channel', 'Status', 'Score', 'Warm', 'Created At'];
    const rows = leads.map(l => [
      l.id,
      l.name,
      l.email || '',
      l.phone || '',
      l.channel,
      l.status,
      l.score || 0,
      l.warm ? 'Yes' : 'No',
      new Date(l.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audnix_leads_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csvContent);
  } catch (error: unknown) {
    console.error('Export error:', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
