import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { storage } from "../storage";
import { requireAuth, getCurrentUserId } from "../middleware/auth";
import {
  generateAIReply,
  generateVoiceScript,
  scheduleFollowUp,
  detectConversationStatus,
  saveConversationToMemory,
  getConversationContext,
  autoUpdateLeadStatus
} from '../lib/ai/conversation-ai.js';
import { getCompetitorAnalytics } from '../lib/ai/competitor-detection.js';
import { learnOptimalDiscount } from '../lib/ai/price-negotiation.js';
import { importInstagramLeads, importGmailLeads, importWhatsAppLeads, importManychatLeads } from "../lib/imports/lead-importer";
import { createCalendarBookingLink, generateMeetingLinkMessage } from "../lib/calendar/google-calendar";
import { generateSmartReplies } from '../lib/ai/smart-replies.js';
import { calculateLeadScore, updateAllLeadScores } from '../lib/ai/lead-scoring.js';
import { generateAnalyticsInsights } from '../lib/ai/analytics-engine.js';
import type { ProviderType, ChannelType } from '../../shared/types.js';

type NotificationType = 'webhook_error' | 'billing_issue' | 'conversion' | 'lead_reply' | 'system' | 'insight';

const router = Router();

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
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
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
        should_use_voice: aiResponse.useVoice 
      }
    });

    const statusDetection = detectConversationStatus([...messages, message]);
    const oldStatus = lead.status;
    const newStatus = statusDetection.status;

    await storage.updateLead(leadId, {
      status: newStatus,
      lastMessageAt: new Date()
    });

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
      case 'whatsapp':
        results = await importWhatsAppLeads(userId);
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
        const { supabaseAdmin } = await import('../lib/supabase-admin');
        const { GoogleCalendarOAuth } = await import('../lib/oauth/google-calendar');

        if (supabaseAdmin) {
          const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('encrypted_meta')
            .eq('user_id', userId)
            .eq('provider', 'google_calendar')
            .eq('connected', true)
            .single();

          if (integration) {
            const tokens = JSON.parse(integration.encrypted_meta);
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

            bookingLink = eventData.hangoutLink || eventData.htmlLink || bookingLink;

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
        avgResponseTime: '4.2 minutes'
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate analytics";
    console.error("Analytics error:", error);
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

    const { db } = await import('../db');
    const { brandEmbeddings } = await import('../../shared/schema.js');
    const { embed } = await import('../lib/ai/openai');

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

export default router;
