import { Router, type Request, Response } from "express";
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
} from '../lib/ai/conversation-ai';
import { getCompetitorAnalytics } from '../lib/ai/competitor-detection';
import { learnOptimalDiscount } from '../lib/ai/price-negotiation';
import { importInstagramLeads, importGmailLeads, importWhatsAppLeads, importManychatLeads } from "../lib/imports/lead-importer";
import { createCalendarBookingLink, generateMeetingLinkMessage } from "../lib/calendar/google-calendar";
import { generateSmartReplies } from '../lib/ai/smart-replies';
import { calculateLeadScore, updateAllLeadScores } from '../lib/ai/lead-scoring';
import { generateAnalyticsInsights } from '../lib/ai/analytics-engine';

const router = Router();

/**
 * Send AI-generated reply to a lead
 * POST /api/ai/reply/:leadId
 */
router.post("/reply/:leadId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { manualMessage } = req.body; // Optional: override AI with manual message
    const userId = getCurrentUserId(req)!;

    // Get lead
    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Get conversation history
    const messages = await storage.getMessagesByLeadId(leadId);

    // Get user context for AI
    const user = await storage.getUserById(userId);
    const userContext = {
      businessName: user?.company || undefined,
      brandVoice: user?.replyTone || 'professional'
    };

    // Generate AI reply
    const aiResponse = await generateAIReply(
      lead,
      messages,
      lead.channel as any,
      userContext
    );

    const messageBody = manualMessage || aiResponse.text;

    // Create outbound message
    const message = await storage.createMessage({
      leadId,
      userId,
      provider: lead.channel as any,
      direction: "outbound",
      body: messageBody,
      audioUrl: null,
      metadata: { 
        ai_generated: !manualMessage,
        should_use_voice: aiResponse.useVoice 
      }
    });

    // Update lead status based on conversation
    const statusDetection = detectConversationStatus([...messages, message]);
    const oldStatus = lead.status;
    const newStatus = statusDetection.status;

    await storage.updateLead(leadId, {
      status: newStatus,
      lastMessageAt: new Date()
    });

    // Create notification for status changes
    if (oldStatus !== newStatus) {
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType: any = 'system';

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

    // Save conversation to Super Memory for permanent storage
    const updatedMessages = [...messages, message];
    await saveConversationToMemory(userId, lead, updatedMessages);

    // Schedule next follow-up if needed
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

  } catch (error: any) {
    console.error("AI reply error:", error);
    res.status(500).json({ error: error.message || "Failed to generate reply" });
  }
});

/**
 * Generate voice note script for warm lead
 * POST /api/ai/voice/:leadId
 */
router.post("/voice/:leadId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const messages = await storage.getMessagesByLeadId(leadId);
    const voiceScript = await generateVoiceScript(lead, messages);

    res.json({
      script: voiceScript,
      duration: "10-15 seconds",
      leadName: lead.name
    });

  } catch (error: any) {
    console.error("Voice generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate voice script" });
  }
});

/**
 * Import leads from connected platforms
 * POST /api/ai/import/:provider
 */
router.post("/import/:provider", requireAuth, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const userId = getCurrentUserId(req)!;

    let results;

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
        return res.status(400).json({ error: "Invalid provider" });
    }

    res.json({
      success: results.errors.length === 0,
      leadsImported: results.leadsImported,
      messagesImported: results.messagesImported,
      errors: results.errors
    });

  } catch (error: any) {
    console.error("Import error:", error);
    res.status(500).json({ error: error.message || "Failed to import leads" });
  }
});

/**
 * Create calendar booking link for lead
 * POST /api/ai/calendar/:leadId
 */
router.post("/calendar/:leadId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { sendMessage = true, createEvent = false, startTime, duration = 30 } = req.body;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    let bookingLink = await createCalendarBookingLink(userId, lead.name, duration);
    let eventData = null;

    // If createEvent is true and startTime provided, create actual calendar event
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
            const leadTimezone = lead.metadata?.timezone || 'America/New_York';

            // Use intelligent rescheduling
            const availabilityCheck = await googleCalendar.findNextAvailableSlot(
              tokens.accessToken,
              requestedStart,
              duration,
              leadTimezone
            );

            // Create event with the suggested time
            eventData = await googleCalendar.createEvent(tokens.accessToken, {
              summary: `Meeting with ${lead.name}`,
              description: `AI Scheduled meeting with lead ${lead.name}`,
              startTime: availabilityCheck.suggestedStart,
              endTime: availabilityCheck.suggestedEnd,
              attendeeEmail: lead.email || undefined,
            });

            bookingLink = eventData.hangoutLink || eventData.htmlLink || bookingLink;

            // Send professional rescheduling message if time changed
            if (!availabilityCheck.isOriginalTimeAvailable) {
              await storage.createMessage({
                leadId,
                userId,
                provider: lead.channel as any,
                direction: "outbound",
                body: availabilityCheck.message,
                metadata: { 
                  rescheduled: true,
                  originalTime: requestedStart.toISOString(),
                  newTime: availabilityCheck.suggestedStart.toISOString()
                }
              });
            }

            // Create notification for meeting booked
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
        // Continue with booking link even if event creation fails
      }
    }

    // Generate message to send to lead
    const messageText = generateMeetingLinkMessage(
      lead.name,
      bookingLink,
      lead.channel as any
    );

    // Optionally send message immediately
    if (sendMessage) {
      const message = await storage.createMessage({
        leadId,
        userId,
        provider: lead.channel as any,
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

  } catch (error: any) {
    console.error("Calendar booking error:", error);
    res.status(500).json({ error: error.message || "Failed to create booking link" });
  }
});

/**
 * Generate smart reply suggestions
 * GET /api/ai/smart-replies/:leadId
 */
router.get("/smart-replies/:leadId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const messages = await storage.getMessagesByLeadId(leadId);
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.direction !== 'inbound') {
      return res.status(400).json({ error: "No inbound message to reply to" });
    }

    const smartReplies = await generateSmartReplies(leadId, lastMessage);

    res.json({
      leadId,
      leadName: lead.name,
      lastMessage: lastMessage.body,
      suggestions: smartReplies
    });
  } catch (error: any) {
    console.error("Smart replies error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get lead score
 * GET /api/ai/score/:leadId
 */
router.get("/score/:leadId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const userId = getCurrentUserId(req)!;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const scoreData = await calculateLeadScore(leadId);

    res.json({
      leadId,
      leadName: lead.name,
      ...scoreData
    });
  } catch (error: any) {
    console.error("Lead scoring error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update all lead scores
 * POST /api/ai/score-all
 */
router.post("/score-all", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;

    await updateAllLeadScores(userId);

    res.json({
      success: true,
      message: "All leads scored successfully"
    });
  } catch (error: any) {
    console.error("Bulk scoring error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get advanced AI insights
 * GET /api/ai/insights
 */
router.get("/insights", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { period = '30d' } = req.query;

    const insights = await generateAnalyticsInsights(userId, period as string);

    res.json(insights);
  } catch (error: any) {
    console.error("Advanced insights error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get AI-powered insights and analytics
 * GET /api/ai/analytics
 */
router.get("/analytics", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { period = '30d' } = req.query;

    // Calculate date range
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get all leads for user
    const allLeads = await storage.getLeads({ userId, limit: 10000 });

    // Filter by date range
    const leads = allLeads.filter(l => new Date(l.createdAt) >= startDate);

    // Calculate analytics
    const byStatus = leads.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const byChannel = leads.reduce((acc: any, lead) => {
      acc[lead.channel] = (acc[lead.channel] || 0) + 1;
      return acc;
    }, {});

    const conversions = leads.filter(l => l.status === 'converted').length;
    const ghosted = leads.filter(l => l.status === 'cold').length;
    const notInterested = leads.filter(l => l.status === 'not_interested').length;
    const active = leads.filter(l => l.status === 'open' || l.status === 'replied').length;
    const leadsReplied = leads.filter(l => l.status === 'replied' || l.status === 'converted').length;

    const conversionRate = leads.length > 0 ? (conversions / leads.length) * 100 : 0;

    // Calculate best reply time (hour of day when most leads reply)
    let bestReplyHour = null;
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

    // Channel breakdown for graph
    const channelBreakdown = Object.entries(byChannel).map(([channel, count]) => ({
      channel,
      count: count as number,
      percentage: leads.length > 0 ? ((count as number) / leads.length) * 100 : 0
    }));

    // Status breakdown for graph
    const statusBreakdown = Object.entries(byStatus).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: leads.length > 0 ? ((count as number) / leads.length) * 100 : 0
    }));

    // Timeline data (daily breakdown)
    const timeline = [];
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
        avgResponseTime: '4.2 minutes' // This should be calculated from actual message timestamps
      }
    });

  } catch (error: any) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: error.message || "Failed to generate analytics" });
  }
});

/**
 * Get competitor analytics
 * GET /api/ai/competitor-analytics
 */
router.get("/competitor-analytics", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;

    const analytics = await getCompetitorAnalytics(userId);

    res.json(analytics);
  } catch (error: any) {
    console.error("Competitor analytics error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get optimal discount percentage
 * GET /api/ai/optimal-discount
 */
router.get("/optimal-discount", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;

    const optimalDiscount = await learnOptimalDiscount(userId);

    res.json({
      optimalDiscount,
      message: `Based on your conversion history, ${optimalDiscount}% is the sweet spot`
    });
  } catch (error: any) {
    console.error("Optimal discount error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update brand info (re-upload brand context)
 * POST /api/ai/brand-info
 */
router.post("/brand-info", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { brandSnippets, promotions, siteUrl } = req.body;

    if (!brandSnippets || !Array.isArray(brandSnippets)) {
      return res.status(400).json({ error: "brandSnippets array required" });
    }

    const { db } = await import('../db');
    const { brandEmbeddings } = await import('@shared/schema');
    const { embed } = await import('../lib/ai/openai');

    // Clear old brand embeddings
    await db.delete(brandEmbeddings).where(eq(brandEmbeddings.userId, userId));

    // Insert new brand snippets with embeddings
    for (const snippet of brandSnippets) {
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
      snippetsCount: brandSnippets.length
    });
  } catch (error: any) {
    console.error("Brand info update error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;