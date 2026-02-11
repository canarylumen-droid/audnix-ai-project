import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { storage } from "../storage.js";
import { requireAuth, getCurrentUserId } from "../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage() });
import {
  generateAIReply,
  generateVoiceScript,
  scheduleFollowUp,
  detectConversationStatus,
  saveConversationToMemory,
  getConversationContext,
  autoUpdateLeadStatus
} from '../lib/ai/conversation-ai.js';
import { generateSmartReplies } from '../lib/ai/smart-replies.js';
import { calculateLeadScore, updateAllLeadScores } from '../lib/ai/lead-scoring.js';
import { generateAnalyticsInsights } from '../lib/ai/analytics-engine.js';
import { getCompetitorAnalytics } from '../lib/ai/competitor-detection.js';
import { learnOptimalDiscount } from '../lib/ai/price-negotiation.js';
import { importInstagramLeads, importGmailLeads, importManychatLeads } from "../lib/imports/lead-importer.js";
import { createCalendarBookingLink, generateMeetingLinkMessage } from "../lib/calendar/google-calendar.js";
import { processPDF } from "../lib/pdf-processor.js";
import { EmailVerifier } from "../lib/scraping/email-verifier.js";
import { mapCSVColumnsToSchema, extractLeadFromRow, extractExtraFieldsAsMetadata, type LeadColumnMapping } from "../lib/ai/csv-mapper.js";
import { parseEmailBody } from "../lib/ai/body-parser.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_LATEST_MODEL } from "../lib/ai/model-config.js";

const verifier = new EmailVerifier();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Robust verification of key presence and format
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing from environment variables");
} else if (!process.env.GEMINI_API_KEY.startsWith("AIza")) {
  console.error("GEMINI_API_KEY appears to be in an invalid format (should start with AIza)");
}
import type { ProviderType, ChannelType } from '../../shared/types.js';

type NotificationType = 'webhook_error' | 'billing_issue' | 'conversion' | 'lead_reply' | 'system' | 'insight';

const router = Router();

/**
 * GET /api/leads
 * Get all leads for the authenticated user with pagination and filtering
 */
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { channel, status, limit = "50", offset = "0", search } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 500);
    const offsetNum = parseInt(offset as string) || 0;

    const allLeadsFiltered = await storage.getLeads({
      userId,
      channel: channel as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
      limit: 1000000, // Unlimited to ensure all leads are displayed
    });

    const leads = allLeadsFiltered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      leads: leads,
      total: allLeadsFiltered.length,
      hasMore: offsetNum + leads.length < allLeadsFiltered.length,
    });
  } catch (error: unknown) {
    console.error("Get leads error:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

/**
 * Get advanced AI insights
 * GET /api/ai/insights
 */
router.get("/insights", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { period = '30d' } = req.query;

    const insights = await generateAnalyticsInsights(userId, period as string);

    res.json(insights);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate insights";
    console.error("Advanced insights error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get AI-powered insights and analytics
 * GET /api/ai/analytics
 */
router.get("/analytics", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { period = '30d' } = req.query;

    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const allLeads = await storage.getLeads({ userId, limit: 10000 });

    const leads = allLeads.filter(l => new Date(l.createdAt) >= startDate);

    const byStatus = leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const byChannel = leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.channel] = (acc[lead.channel] || 0) + 1;
      return acc;
    }, {});

    const conversions = leads.filter(l => l.status === 'converted').length;
    const ghosted = leads.filter(l => l.status === 'cold').length;
    const notInterested = leads.filter(l => l.status === 'not_interested').length;
    const active = leads.filter(l => l.status === 'open' || l.status === 'replied').length;
    const leadsReplied = leads.filter(l => l.status === 'replied' || l.status === 'converted').length;

    const conversionRate = leads.length > 0 ? (conversions / leads.length) * 100 : 0;

    let bestReplyHour: number | null = null;
    const replyHours: Record<number, number> = {};
    for (const lead of leads) {
      if (lead.lastMessageAt) {
        const hour = new Date(lead.lastMessageAt).getHours();
        replyHours[hour] = (replyHours[hour] || 0) + 1;
      }
    }
    if (Object.keys(replyHours).length > 0) {
      bestReplyHour = parseInt(Object.entries(replyHours).sort((a, b) => b[1] - a[1])[0][0]);
    }

    const channelBreakdown = Object.entries(byChannel).map(([channel, count]) => ({
      channel,
      count,
      percentage: leads.length > 0 ? (count / leads.length) * 100 : 0
    }));

    const statusBreakdown = Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
      percentage: leads.length > 0 ? (count / leads.length) * 100 : 0
    }));

    const timeline: Array<{ date: string; leads: number; conversions: number }> = [];
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLeads = leads.filter(l => {
        const createdAt = new Date(l.createdAt);
        return createdAt >= date && createdAt < nextDate;
      });

      timeline.push({
        date: date.toISOString().split('T')[0],
        leads: dayLeads.length,
        conversions: dayLeads.filter(l => l.status === 'converted').length
      });
    }

    const positiveStatuses = ['replied', 'converted', 'open'];
    const negativeStatuses = ['not_interested', 'cold'];
    const positiveLeads = leads.filter(l => positiveStatuses.includes(l.status)).length;
    const negativeLeads = leads.filter(l => negativeStatuses.includes(l.status)).length;
    const totalWithSentiment = positiveLeads + negativeLeads;
    const positiveSentimentRate = totalWithSentiment > 0
      ? ((positiveLeads / totalWithSentiment) * 100).toFixed(1)
      : '0';

    res.json({
      period,
      summary: {
        totalLeads: leads.length,
        conversions,
        conversionRate: conversionRate.toFixed(1),
        active,
        ghosted,
        notInterested,
        leadsReplied,
        bestReplyHour
      },
      channelBreakdown,
      statusBreakdown,
      timeline,
      behaviorInsights: {
        bestReplyHour,
        replyRate: leads.length > 0 ? ((leadsReplied / leads.length) * 100).toFixed(1) : '0',
        avgResponseTime: await (await import('../lib/ai/analytics-engine.js')).calculateAvgResponseTime(userId),
        positiveSentimentRate
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate analytics";
    console.error("Analytics error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Update all lead scores
 * POST /api/ai/score-all
 */
router.post("/score-all", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    await updateAllLeadScores(userId);

    res.json({
      success: true,
      message: "All leads scored successfully"
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to score leads";
    console.error("Bulk scoring error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Import leads from CSV file upload
 * POST /api/leads/import-csv
 */
router.post("/import-csv", requireAuth, upload.single('csv'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const file = req.file;
    const previewMode = req.query.preview === 'true';
    const aiPaused = req.body.aiPaused === 'true';

    if (!file) {
      res.status(400).json({ error: "No CSV file uploaded" });
      return;
    }

    const results: any[] = [];
    const stream = Readable.from(file.buffer.toString('utf-8'));

    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          if (results.length === 0) {
            res.status(400).json({ error: "CSV file is empty" });
            return;
          }

          // 1. Map Columns using AI
          const headers = Object.keys(results[0]);
          const mappingResult = await mapCSVColumnsToSchema(headers, results.slice(0, 3));
          const mapping = mappingResult.mapping;

          // 2. Extract Leads
          const processedLeads = results.map(row => {
            const basicLead = extractLeadFromRow(row, mapping);
            // Skip empty rows
            if (!basicLead.name && !basicLead.email) return null;

            const metadata = extractExtraFieldsAsMetadata(row, mapping);
            if (mappingResult.unmappedColumns.length > 0) {
              metadata._unmapped_cols = mappingResult.unmappedColumns.join(',');
            }

            return {
              ...basicLead,
              metadata
            };
          }).filter(l => l !== null);

          // 3. Handle Preview vs Output
          if (previewMode) {
            res.json({
              preview: true,
              total: processedLeads.length,
              mapping: mappingResult.mapping,
              confidence: mappingResult.confidence,
              leads: processedLeads.slice(0, 10), // Return sample
              allLeads: processedLeads // Frontend might need all for "confirm" step if we don't re-upload
            });
            return;
          }

          // 4. Save to DB (if not preview, though usually frontend calls import-bulk after preview)
          // But if called directly without preview:
          const savedLeads = [];
          for (const leadData of processedLeads) {
             if (!leadData) continue;
             // Basic de-dupe check done in bulk-import usually, but simple one here:
             // actually, let's just use the bulk-import logic if possible, but for now duplicate the create logic
             // to ensure this route works standalone.
             const lead = await storage.createLead({
                userId,
                name: leadData.name || 'Unknown',
                email: leadData.email,
                phone: leadData.phone,
                company: leadData.company,
                channel: 'email',
                status: 'new',
                aiPaused,
                metadata: {
                  ...leadData.metadata,
                  imported_via: 'csv_upload',
                  import_date: new Date().toISOString()
                }
             });
             savedLeads.push(lead);
          }

          res.json({
            success: true,
            leadsImported: savedLeads.length,
            leads: savedLeads
          });

          console.log(`[CSV Import] Success: Processed ${results.length} rows, extracted ${processedLeads.length} leads, saved ${savedLeads.length} leads (Standalone Mode)`);

        } catch (error: any) {
           console.error("CSV Processing Error:", error);
           res.status(500).json({ error: "Failed to process CSV rows" });
        }
      });

  } catch (error: any) {
    console.error("CSV Import API Error:", error);
    res.status(500).json({ error: error.message });
  }
});
/**
 * Update lead details (status, aiPaused, etc.)
 * PATCH /api/leads/:leadId
 */
router.patch("/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadId } = req.params;
    const updates = req.body;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Sanitize updates
    const allowedUpdates: Partial<typeof lead> = {};
    if (typeof updates.aiPaused === 'boolean') allowedUpdates.aiPaused = updates.aiPaused;
    if (updates.status) allowedUpdates.status = updates.status;
    if (updates.name) allowedUpdates.name = updates.name;
    if (updates.email) allowedUpdates.email = updates.email;
    if (updates.phone) allowedUpdates.phone = updates.phone;
    if (updates.metadata) allowedUpdates.metadata = updates.metadata;

    if (Object.keys(allowedUpdates).length === 0) {
      res.status(400).json({ error: "No valid updates provided" });
      return;
    }

    const updatedLead = await storage.updateLead(leadId, {
      ...allowedUpdates
    });

    // Notify via WebSocket
    const { wsSync } = await import('../lib/websocket-sync.js');
    wsSync.notifyLeadsUpdated(userId, { type: 'lead_updated', lead: updatedLead });

    res.json(updatedLead);
  } catch (error: unknown) {
    console.error("Update lead error:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

/**
 * GET /api/leads/:leadId
 * Get a single lead by ID
 */
router.get("/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadId } = req.params;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    res.json(lead);
  } catch (error: unknown) {
    console.error("Get lead error:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});


/**
 * Send AI-generated reply to a lead
 * POST /api/ai/reply/:leadId
 */
router.post("/reply/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId } = req.params;
    const { manualMessage } = req.body;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead) {
      console.warn(`[AI-Reply] Lead not found: ${leadId}`);
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Allow owner or admin
    if (lead.userId !== userId) {
      const user = await storage.getUserById(userId);
      const isAdmin = user?.role?.toLowerCase() === 'admin';

      console.log(`[AI-Reply] Auth check: lead.userId=${lead.userId}, session.userId=${userId}, user.role=${user?.role}, orgId=${lead.organizationId}`);

      if (!isAdmin) {
        if (!lead.organizationId) {
          console.warn(`[AI-Reply] 403 Unauthorized: User ${userId} is not lead owner and lead has no organization.`);
          res.status(403).json({ error: "Unauthorized (No Org)" });
          return;
        }

        const orgMembers = await storage.getOrganizationMembers(lead.organizationId);
        const isMember = orgMembers.some(m => m.userId === userId);

        if (!isMember) {
          console.warn(`[AI-Reply] 403 Unauthorized: User ${userId} is not lead owner, admin, or org member for lead ${leadId}`);
          res.status(403).json({ error: "Unauthorized (Not in Org)" });
          return;
        }
      }
    }


    const messages = await storage.getMessagesByLeadId(leadId);

    const user = await storage.getUserById(userId);
    const userContext = {
      businessName: user?.company || undefined,
      brandVoice: user?.replyTone || 'professional'
    };

    const aiResponse = await generateAIReply(
      lead,
      messages,
      lead.channel as ChannelType,
      userContext
    );

    const messageBody = manualMessage || aiResponse.text;

    const message = await storage.createMessage({
      leadId,
      userId,
      provider: lead.channel as ProviderType,
      direction: "outbound",
      body: messageBody,
      audioUrl: null,
      metadata: {
        ai_generated: !manualMessage,
        should_use_voice: aiResponse.useVoice,
        detections: aiResponse.detections
      }
    });

    const statusDetection = detectConversationStatus([...messages, message]);
    const oldStatus = lead.status;
    const newStatus = statusDetection.status;

    const updatedLead = await storage.updateLead(leadId, {
      status: newStatus,
      lastMessageAt: new Date()
    });

    // Notify via WebSocket
    const { wsSync } = await import('../lib/websocket-sync.js');
    wsSync.notifyMessagesUpdated(userId, { leadId, message });
    wsSync.notifyLeadsUpdated(userId, { type: 'lead_updated', lead: updatedLead });

    if (oldStatus !== newStatus) {
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType: NotificationType = 'system';

      if (newStatus === 'converted') {
        notificationTitle = '🎉 New Conversion!';
        notificationMessage = `${lead.name} from ${lead.channel} has converted! ${statusDetection.reason || ''}`;
        notificationType = 'conversion';
      } else if (newStatus === 'replied') {
        notificationTitle = '💬 Lead Reply';
        notificationMessage = `${lead.name} just replied to your message`;
        notificationType = 'lead_reply';
      } else if (newStatus === 'not_interested') {
        notificationTitle = '😔 Lead Not Interested';
        notificationMessage = `${lead.name} declined: ${statusDetection.reason || 'No interest shown'}`;
      } else if (newStatus === 'cold') {
        notificationTitle = '❄️ Lead Went Cold';
        notificationMessage = `${lead.name}: ${statusDetection.reason || 'No recent engagement'}`;
      }

      if (notificationTitle) {
        await storage.createNotification({
          userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          metadata: {
            leadId,
            leadName: lead.name,
            oldStatus,
            newStatus,
            reason: statusDetection.reason,
            channel: lead.channel,
            activityType: 'status_change'
          }
        });
      }
    }

    const updatedMessages = [...messages, message];
    await saveConversationToMemory(userId, lead, updatedMessages);

    if (statusDetection.status !== 'converted' && statusDetection.status !== 'not_interested') {
      const followUpTime = await scheduleFollowUp(userId, leadId, lead.channel, 'followup');

      res.json({
        message,
        aiSuggestion: aiResponse.text,
        useVoice: aiResponse.useVoice,
        nextFollowUp: followUpTime,
        leadStatus: statusDetection.status
      });
    } else {
      res.json({
        message,
        leadStatus: statusDetection.status
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate reply";
    console.error("AI reply error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Generate voice note script for warm lead
 * POST /api/ai/voice/:leadId
 */
router.post("/voice/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId } = req.params;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const messages = await storage.getMessagesByLeadId(leadId);
    const voiceScript = await generateVoiceScript(lead, messages);

    res.json({
      script: voiceScript,
      duration: "10-15 seconds",
      leadName: lead.name
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate voice script";
    console.error("Voice generation error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Import leads from connected platforms
 * POST /api/ai/import/:provider
 */
router.post("/import/:provider", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = getCurrentUserId(req)!;

    let results: { leadsImported: number; messagesImported: number; errors: string[] };

    switch (provider) {
      case 'instagram':
        results = await importInstagramLeads(userId);
        break;
      case 'gmail':
        results = await importGmailLeads(userId);
        break;

      case 'manychat':
        results = await importManychatLeads(userId);
        break;
      default:
        res.status(400).json({ error: "Invalid provider" });
        return;
    }

    res.json({
      success: results.errors.length === 0,
      leadsImported: results.leadsImported,
      messagesImported: results.messagesImported,
      errors: results.errors
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to import leads";
    console.error("Import error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Bulk import leads from JSON
 * POST /api/ai/import-bulk
 */
router.post("/import-bulk", requireAuth, async (req: Request, res: Response): Promise<void> => {
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

    const user = await storage.getUserById(userId);
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const currentLeadCount = existingLeads.length;

    const maxLeads = 1000000; // Unlimited as per request

    if (currentLeadCount >= maxLeads) {
      res.status(400).json({
        error: `You've reached your plan's limit of ${maxLeads} leads. Delete some leads or upgrade your plan to add more.`,
        limitReached: true
      });
      return;
    }

    const { verifyDomainDns } = await (eval('import("../lib/email/dns-verification.js")') as Promise<any>);
    const { generateContextAwareMessage } = await import("../lib/ai/universal-sales-agent-integrated.js");

    const results = {
      leadsImported: 0,
      leadsUpdated: 0,
      leadsFiltered: 0,
      errors: [] as string[]
    };

    const leadsToImport = Math.min(leadsData.length, maxLeads - currentLeadCount);
    const importedIdentifiers = new Set<string>();

    for (let i = 0; i < leadsToImport; i++) {
      const leadData = leadsData[i];

      try {
        const email = leadData.email;
        const name = leadData.name;

        // Fix: identifier needed for deduplication
        const identifier = email || name || 'unknown';

        // Check if lead data is valid
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
          // Improve Deduplication: Merge strategy (fill missing fields only)
          const updates: Record<string, any> = {};
          if (!existingLead.email && leadData.email) updates.email = leadData.email;
          if ((!existingLead.name || existingLead.name === 'Unknown') && leadData.name) updates.name = leadData.name;

          const existingMeta = existingLead.metadata as Record<string, any> || {};
          if (!existingMeta.company && leadData.company) {
            updates.metadata = { ...existingMeta, company: leadData.company };
          }

          if (Object.keys(updates).length > 0) {
            await storage.updateLead(existingLead.id, updates);
            results.leadsUpdated++;
          }
          // Don't count as imported (new lead), but don't error.
          continue;
        }

        // --- NEW: NEURAL FILTER (Real-time DNS Check) ---
        if (leadData.email) {
          const domain = leadData.email.split('@')[1];
          if (domain) {
            const dnsCheck = await verifyDomainDns(domain);
            // If domain is 'poor' or has no MX records, filter it out
            if (dnsCheck.overallStatus === 'poor' || !dnsCheck.mx.found) {
              results.leadsFiltered++;
              console.log(`[IMPORT] Skipping lead ${leadData.email}: Poor domain quality/No MX record`);
              results.errors.push(`Row ${i + 1} (${leadData.email}): Undeliverable domain (Neural Filter)`);
              continue;
            }
          }

          // Also use our existing verifier for deep-level mailbox checks
          const verification = await verifier.verify(leadData.email);
          if (!verification.valid) {
            results.leadsFiltered++;
            console.log(`[IMPORT] Skipping lead ${leadData.email}: ${verification.reason || 'Invalid email'}`);
            results.errors.push(`Row ${i + 1} (${leadData.email}): ${verification.reason || 'Invalid email format'} (Verification Filter)`);
            continue;
          }
        }

        await storage.createLead({
          userId,
          name: leadData.name || identifier.split('@')[0] || 'Unknown',
          email: leadData.email || null,
          phone: leadData.phone || null,
          channel: channel as 'email' | 'instagram',
          status: 'new', // Leads are "good" now if they pass here
          aiPaused: aiPaused,
          metadata: {
            imported_from_csv: true,
            company: leadData.company,
            import_date: new Date().toISOString(),
            deliverability: 'verified'
          }
        });

        importedIdentifiers.add(identifier.toLowerCase());
        results.leadsImported++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    // UPDATE: Persist filtered count in user profile for long-term tracking
    if (results.leadsFiltered > 0) {
      const dbUser = await storage.getUserById(userId);
      if (dbUser) {
        await storage.updateUser(userId, {
          filteredLeadsCount: (dbUser.filteredLeadsCount || 0) + results.leadsFiltered
        });
      }
    }

    if (leadsData.length > leadsToImport) {
      results.errors.push(`${leadsData.length - leadsToImport} leads not imported due to plan limit`);
    }

    res.json({
      success: results.leadsImported > 0 || results.leadsUpdated > 0,
      leadsImported: results.leadsImported,
      leadsUpdated: results.leadsUpdated,
      leadsFiltered: results.leadsFiltered,
      errors: results.errors,
      message: `Imported ${results.leadsImported} leads. Updated ${results.leadsUpdated} existing. Filtered ${results.leadsFiltered} low-quality.`
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to import leads";
    console.error("CSV Import error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Parse raw email body into structured JSON
 * POST /api/ai/parse-body
 */
router.post("/parse-body", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = req.body;
    if (!body) {
      res.status(400).json({ error: "No email body provided" });
      return;
    }

    const parsedData = await parseEmailBody(body);
    res.json(parsedData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to parse email body";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Create calendar booking link for lead
 * POST /api/ai/calendar/:leadId
 */
router.post("/calendar/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId } = req.params;
    const { sendMessage = true, createEvent = false, startTime, duration = 30 } = req.body;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    let bookingLink = await createCalendarBookingLink(userId, lead.name, duration);
    let eventData: { id?: string; hangoutLink?: string; htmlLink?: string } | null = null;

    if (createEvent && startTime) {
      try {
        const { GoogleCalendarOAuth } = await import('../lib/oauth/google-calendar.js');

        const integration = await storage.getIntegration(userId, 'google_calendar');

        if (integration && integration.connected && integration.encryptedMeta) {
          const { decrypt } = await import('../lib/crypto/encryption.js');
          const tokensStr = await decrypt(integration.encryptedMeta);
          const tokens = JSON.parse(tokensStr);
          const googleCalendar = new GoogleCalendarOAuth();

          const requestedStart = new Date(startTime);
          const leadTimezone = (lead.metadata as Record<string, unknown>)?.timezone as string || 'America/New_York';

          const availabilityCheck = await googleCalendar.findNextAvailableSlot(
            tokens.accessToken,
            requestedStart,
            duration,
            leadTimezone
          );

          eventData = await googleCalendar.createEvent(tokens.accessToken, {
            summary: `Meeting with ${lead.name}`,
            description: `AI Scheduled meeting with lead ${lead.name}`,
            startTime: availabilityCheck.suggestedStart,
            endTime: availabilityCheck.suggestedEnd,
            attendeeEmail: lead.email || undefined,
          });

          bookingLink = eventData?.hangoutLink || eventData?.htmlLink || bookingLink;

          if (!availabilityCheck.isOriginalTimeAvailable) {
            await storage.createMessage({
              leadId,
              userId,
              provider: lead.channel as ProviderType,
              direction: "outbound",
              body: availabilityCheck.message,
              metadata: {
                rescheduled: true,
                originalTime: requestedStart.toISOString(),
                newTime: availabilityCheck.suggestedStart.toISOString()
              }
            });
          }

          await storage.createNotification({
            userId,
            type: 'system',
            title: '📅 Meeting Booked',
            message: `Meeting scheduled with ${lead.name} for ${availabilityCheck.suggestedStart.toLocaleString()}${!availabilityCheck.isOriginalTimeAvailable ? ' (rescheduled)' : ''}`,
            metadata: {
              leadId,
              leadName: lead.name,
              meetingTime: availabilityCheck.suggestedStart.toISOString(),
              meetingUrl: bookingLink,
              activityType: 'meeting_booked',
              wasRescheduled: !availabilityCheck.isOriginalTimeAvailable
            }
          });
        }
      } catch (eventError) {
        console.error("Error creating calendar event:", eventError);
      }
    }

    const messageText = generateMeetingLinkMessage(
      lead.name,
      bookingLink,
      lead.channel as ChannelType
    );

    if (sendMessage) {
      const message = await storage.createMessage({
        leadId,
        userId,
        provider: lead.channel as ProviderType,
        direction: "outbound",
        body: messageText,
        metadata: {
          booking_link: bookingLink,
          event_id: eventData?.id,
          event_link: eventData?.htmlLink
        }
      });

      res.json({
        bookingLink,
        messageSent: true,
        message,
        event: eventData
      });
    } else {
      res.json({
        bookingLink,
        suggestedMessage: messageText,
        messageSent: false,
        event: eventData
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create booking link";
    console.error("Calendar booking error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Generate smart reply suggestions
 * GET /api/ai/smart-replies/:leadId
 */
router.get("/smart-replies/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId } = req.params;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const messages = await storage.getMessagesByLeadId(leadId);
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.direction !== 'inbound') {
      res.status(400).json({ error: "No inbound message to reply to" });
      return;
    }

    const smartReplies = await generateSmartReplies(leadId, lastMessage);

    res.json({
      leadId,
      leadName: lead.name,
      lastMessage: lastMessage.body,
      suggestions: smartReplies
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate smart replies";
    console.error("Smart replies error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get lead score
 * GET /api/ai/score/:leadId
 */
router.get("/score/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId } = req.params;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const scoreData = await calculateLeadScore(leadId);

    res.json({
      leadId,
      leadName: lead.name,
      ...scoreData
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to calculate lead score";
    console.error("Lead scoring error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Update all lead scores
 * POST /api/ai/score-all
 */
router.post("/score-all", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    await updateAllLeadScores(userId);

    res.json({
      success: true,
      message: "All leads scored successfully"
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to score leads";
    console.error("Bulk scoring error:", error);
    res.status(500).json({ error: errorMessage });
  }
});


/**
 * Get competitor analytics
 * GET /api/ai/competitor-analytics
 */
router.get("/competitor-analytics", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    const analytics = await getCompetitorAnalytics(userId);

    res.json(analytics);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to get competitor analytics";
    console.error("Competitor analytics error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get optimal discount percentage
 * GET /api/ai/optimal-discount
 */
router.get("/optimal-discount", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    const optimalDiscount = await learnOptimalDiscount(userId);

    res.json({
      optimalDiscount,
      message: `Based on your conversion history, ${optimalDiscount}% is the sweet spot`
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to calculate optimal discount";
    console.error("Optimal discount error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Update brand info (re-upload brand context)
 * POST /api/ai/brand-info
 */
router.post("/brand-info", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { brandSnippets, promotions, siteUrl } = req.body;

    if (!brandSnippets || !Array.isArray(brandSnippets)) {
      res.status(400).json({ error: "brandSnippets array required" });
      return;
    }

    const { db } = await import('../db.js');
    const { brandEmbeddings } = await import('../../shared/schema.js');
    const { embed } = await import('../lib/ai/openai.js');

    await db.delete(brandEmbeddings).where(eq(brandEmbeddings.userId, userId));

    for (const snippet of brandSnippets as string[]) {
      const embedding = await embed(snippet);
      await db.insert(brandEmbeddings).values({
        userId,
        snippet,
        embedding,
        metadata: {
          promotions: promotions || [],
          siteUrl: siteUrl || null,
          updatedAt: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      message: "Brand info updated! AI will now use this in all responses",
      snippetsCount: (brandSnippets as string[]).length
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update brand info";
    console.error("Brand info update error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Import leads from CSV file upload
 * POST /api/leads/import-csv
 */
router.post("/import-csv", requireAuth, upload.single("csv"), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    if (!req.file) {
      res.status(400).json({ error: "No CSV file provided" });
      return;
    }

    const user = await storage.getUserById(userId);
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const currentLeadCount = existingLeads.length;

    const planLimits: Record<string, number> = {
      'free': 500,
      'trial': 500,
      'starter': 2500,
      'pro': 7000,
      'enterprise': 20000
    };
    const maxLeads = planLimits[user?.subscriptionTier || user?.plan || 'trial'] || 500;

    if (currentLeadCount >= maxLeads) {
      res.status(400).json({
        error: `You've reached your plan's limit of ${maxLeads} leads. Delete some leads or upgrade your plan to add more.`,
        limitReached: true
      });
      return;
    }

    const previewMode = req.query.preview === 'true';

    const results = {
      leadsImported: 0,
      leadsFound: 0,
      errors: [] as string[],
      leads: [] as any[]
    };

    const leadsData: Array<Record<string, string>> = [];

    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(req.file!.buffer);
      stream
        .pipe(csvParser())
        .on('data', (row: Record<string, string>) => {
          // Log first row to verify headers
          if (leadsData.length === 0) console.log("First row:", JSON.stringify(row));
          leadsData.push(row);
        })
        .on('end', () => {
          console.log(`✅ CSV Parsing complete. Found ${leadsData.length} rows.`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ CSV Parsing error:`, err);
          reject(err);
        });

      // Log buffer info
      console.log("Input buffer size:", req.file!.buffer.length);
    });

    if (leadsData.length === 0) {
      console.warn("⚠️ CSV file parsed but yielded 0 rows. Content length:", req.file!.buffer.length);
      res.status(400).json({
        error: "No lead data provided or CSV format not recognized",
        details: "Ensure your CSV has headers and at least one row of data."
      });
      return;
    }

    // Get headers from first row and use AI to map columns
    const headers = Object.keys(leadsData[0]);
    console.log(`📊 CSV headers detected: ${headers.join(', ')}`);

    let mapping: LeadColumnMapping;
    try {
      const mappingResult = await mapCSVColumnsToSchema(headers, leadsData.slice(0, 3));
      mapping = mappingResult.mapping;
      console.log(`🤖 AI column mapping: ${JSON.stringify(mapping)} (confidence: ${mappingResult.confidence})`);

      if (!mapping.email && !mapping.phone) {
        res.status(400).json({
          error: "Could not identify email or phone columns in your CSV",
          headers: headers,
          suggestion: "Please ensure your CSV has columns for email or phone"
        });
        return;
      }
    } catch (mappingError) {
      console.error("Column mapping failed:", mappingError);
      res.status(400).json({ error: "Failed to analyze CSV columns" });
      return;
    }

    const leadsToImport = Math.min(leadsData.length, maxLeads - currentLeadCount);
    const importedIdentifiers = new Set<string>();
    const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(existingLeads.map(l => l.phone).filter(Boolean));

    for (let i = 0; i < leadsToImport; i++) {
      const row = leadsData[i];

      try {
        // Use AI-mapped columns
        const extracted = extractLeadFromRow(row, mapping);
        let { name, email, phone, company } = extracted;

        // Better name extraction
        if (!name || name.toLowerCase() === 'unknown' || name === 'Unknown Lead') {
          if (email) {
            const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
            name = namePart.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          } else if (phone) {
            name = `Lead ${phone.slice(-4)}`;
          } else {
            name = 'Unknown Lead';
          }
        }

        // Strict validation: name and email are MUST
        if (!name || !email || name === 'Unknown' || name === 'Unknown Lead') {
          results.errors.push(`Row ${i + 1}: Missing required name or email`);
          continue;
        }

        const identifier = email;

        if (importedIdentifiers.has(identifier.toLowerCase()) ||
          (email && existingEmails.has(email.toLowerCase())) ||
          (phone && existingPhones.has(phone))) {
          if (!previewMode) {
            results.errors.push(`Row ${i + 1}: Duplicate lead ${identifier}`);
            continue;
          }
        }

        // Skip heavy verification in preview to keep it fast
        // But allow client to see mapped data
        const leadObject = {
          name,
          email,
          phone,
          company,
          status: 'new',
          metadata: {
            ...extractExtraFieldsAsMetadata(row, mapping),
            import_source: 'csv_preview'
          }
        };

        if (previewMode) {
          results.leads.push(leadObject);
          results.leadsFound++;
          continue;
        }

        // ... (Real Import Logic) ...

        // Deliverability Check with Neural Recovery
        let status = 'new';
        let verified = false;
        let recoveryTarget = email;
        let isRecovered = false;

        if (email) {
          let verification = await verifier.verify(email);
          if (verification.valid) {
            verified = true;
            status = 'hardened';
          } else {
            // Neural Discovery Path
            try {
              const recoveryModel = genAI.getGenerativeModel({ model: GEMINI_LATEST_MODEL });
              const recoveryPrompt = `BUSINESS: ${company || name}\nEMAIL: ${email}\nDeliverability failed. Is there a more likely valid business email or domain for this business? Return ONLY the corrected email string or "NONE".`;
              const recoveryResult = await recoveryModel.generateContent(recoveryPrompt);
              const correctedEmail = recoveryResult.response.text().trim();

              if (correctedEmail !== 'NONE' && correctedEmail !== email && correctedEmail.includes('@')) {
                const secondaryVerification = await verifier.verify(correctedEmail);
                if (secondaryVerification.valid) {
                  recoveryTarget = correctedEmail;
                  verified = true;
                  isRecovered = true;
                  status = 'recovered';
                }
              }
            } catch (e) { }

            if (!verified) {
              status = 'bouncy';
            }
          }
        }

        const extraFields = extractExtraFieldsAsMetadata(row, mapping);

        await storage.createLead({
          userId,
          name: name,
          email: recoveryTarget || undefined,
          phone: phone || undefined,
          channel: 'email',
          status: status as any,
          verified: verified,
          verifiedAt: verified ? new Date() : null,
          metadata: {
            imported_from_csv: true,
            company: company,
            import_date: new Date().toISOString(),
            deliverability: verified ? 'safe' : 'bouncy',
            is_recovered: isRecovered,
            ai_column_mapping: mapping,
            ...extraFields
          }
        });

        importedIdentifiers.add(identifier.toLowerCase());
        results.leadsImported++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    if (leadsData.length > leadsToImport) {
      results.errors.push(`${leadsData.length - leadsToImport} leads not imported due to plan limit`);
    }

    if (previewMode) {
      res.json({
        preview: true,
        leads: results.leads,
        total: results.leadsFound,
        mapping: mapping,
        message: `Preview generated for ${results.leadsFound} leads`
      });
      return;
    }

    res.json({
      success: results.leadsImported > 0,
      leadsImported: results.leadsImported,
      errors: results.errors,
      message: `Imported ${results.leadsImported} leads successfully`
    });

    // Start outreach boom if leads were imported
    if (results.leadsImported > 0) {
      const { triggerAutoOutreach } = await import('../lib/sales-engine/outreach-engine.js');
      triggerAutoOutreach(userId).catch(e => console.error('Auto outreach failed:', e));
    }


  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to import leads";
    console.error("CSV file import error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Import leads from PDF file upload
 * POST /api/leads/import-pdf
 */
router.post("/import-pdf", requireAuth, upload.single("pdf"), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    if (!req.file) {
      res.status(400).json({ error: "No PDF file provided" });
      return;
    }

    const user = await storage.getUserById(userId);
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const currentLeadCount = existingLeads.length;

    const planLimits: Record<string, number> = {
      'free': 500,
      'trial': 500,
      'starter': 2500,
      'pro': 7000,
      'enterprise': 20000
    };
    const maxLeads = planLimits[user?.subscriptionTier || user?.plan || 'trial'] || 500;

    if (currentLeadCount >= maxLeads) {
      res.status(400).json({
        error: `You've reached your plan's limit of ${maxLeads} leads. Delete some leads or upgrade your plan to add more.`,
        limitReached: true
      });
      return;
    }

    const result = await processPDF(req.file.buffer, userId, {
      extractOffer: true,
      autoReachOut: false
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to process PDF");
    }

    res.json({
      success: true,
      leadsImported: result.leadsCreated,
      emailsFound: result.leads?.filter(l => !!l.email).length || 0,
      phonesFound: result.leads?.filter(l => !!l.phone).length || 0,
      errors: [],
      message: `Successfully processed PDF and imported ${result.leadsCreated} leads`
    });

    // Start outreach boom if leads were imported
    if (result.leadsCreated > 0) {
      const { triggerAutoOutreach } = await import('../lib/sales-engine/outreach-engine.js');
      triggerAutoOutreach(userId).catch(e => console.error('Auto outreach failed:', e));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to import leads from PDF";
    console.error("PDF import error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Run outreach campaign
 * POST /api/ai/run-outreach
 */
router.post("/run-outreach", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leads, brandContext, runDemo = false } = req.body;

    const { runOutreachCampaign, runDemoOutreach } = await import('../lib/outreach/outreach-runner.js');
    type OutreachLead = { name: string; email: string; company?: string };
    type BrandContext = { serviceName: string; pricing: string; valueProposition: string; businessName?: string };

    let result;

    if (runDemo) {
      // Run demo with predefined leads
      result = await runDemoOutreach(userId);
    } else if (leads && Array.isArray(leads) && brandContext) {
      // Run custom campaign
      result = await runOutreachCampaign(
        userId,
        leads as OutreachLead[],
        brandContext as BrandContext,
        { scheduleFollowUpMinutes: 5, delayBetweenEmailsMs: 3000 }
      );
    } else {
      res.status(400).json({ error: "Provide 'leads' array and 'brandContext', or set 'runDemo: true'" });
      return;
    }

    // Create summary notification
    await storage.createNotification({
      userId,
      type: 'insight',
      title: '🚀 Outreach Campaign Complete',
      message: `Sent ${result.summary.sent}/${result.summary.total} emails. ${result.summary.failed} failed.`,
      metadata: {
        activityType: 'outreach_campaign_complete',
        sent: result.summary.sent,
        failed: result.summary.failed,
        total: result.summary.total
      }
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to run outreach";
    console.error("Outreach campaign error:", error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;

