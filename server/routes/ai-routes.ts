import { Router, type Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, getCurrentUserId } from "../middleware/auth";
import { generateAIReply, generateVoiceScript, scheduleFollowUp, detectConversationStatus } from "../lib/ai/conversation-ai";
import { importInstagramLeads, importGmailLeads, importWhatsAppLeads, importManychatLeads } from "../lib/imports/lead-importer";
import { createCalendarBookingLink, generateMeetingLinkMessage } from "../lib/calendar/google-calendar";

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
    await storage.updateLead(leadId, {
      status: statusDetection.status,
      lastMessageAt: new Date()
    });
    
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
    const { sendMessage = true } = req.body;
    const userId = getCurrentUserId(req)!;
    
    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    // Create booking link
    const bookingLink = await createCalendarBookingLink(userId, lead.name);
    
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
        metadata: { booking_link: bookingLink }
      });
      
      res.json({
        bookingLink,
        messageSent: true,
        message
      });
    } else {
      res.json({
        bookingLink,
        suggestedMessage: messageText,
        messageSent: false
      });
    }
    
  } catch (error: any) {
    console.error("Calendar booking error:", error);
    res.status(500).json({ error: error.message || "Failed to create booking link" });
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
    
    const conversionRate = leads.length > 0 ? (conversions / leads.length) * 100 : 0;
    
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
        notInterested
      },
      channelBreakdown,
      statusBreakdown,
      timeline
    });
    
  } catch (error: any) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: error.message || "Failed to generate analytics" });
  }
});

export default router;
