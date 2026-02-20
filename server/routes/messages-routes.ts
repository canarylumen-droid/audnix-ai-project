import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { requireAuth, getCurrentUserId } from "../middleware/auth.js";
import { sendEmail } from "../lib/channels/email.js";
import { sendInstagramMessage } from "../lib/channels/instagram.js";

const router = Router();


/**
 * GET /api/messages/:leadId
 * Get messages for a lead with pagination
 */
router.get("/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadId } = req.params;
    const { limit = "100", offset = "0" } = req.query;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const messages = await storage.getMessagesByLeadId(leadId);

    // Apply pagination
    const offsetNum = parseInt(offset as string) || 0;
    const limitNum = Math.min(parseInt(limit as string) || 100, 500);
    const paginatedMessages = messages.slice(offsetNum, offsetNum + limitNum);

    res.json({
      messages: paginatedMessages,
      total: messages.length,
      hasMore: offsetNum + paginatedMessages.length < messages.length,
    });
  } catch (error: unknown) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * POST /api/messages/:leadId
 * Send a message to a lead
 */
router.post("/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadId } = req.params;
    const { content, channel, subject } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const selectedChannel = channel || lead.channel;
    const messageBody = content.trim();

    // Actual sending logic
    try {
      if (selectedChannel === 'email') {
        if (!lead.email) {
          res.status(400).json({ error: "Lead has no email address" });
          return;
        }
        // Use provided subject or fall back to standard Re: format
        const emailSubject = subject || `Re: ${lead.name || 'Conversation'}`;
        await sendEmail(userId, lead.email, messageBody, emailSubject, { isRaw: true });
      } else if (selectedChannel === 'instagram') {
        const leadMeta = lead.metadata as any;
        const igId = leadMeta?.instagram_id || leadMeta?.psid || lead.externalId;
        if (!igId) {
          res.status(400).json({ error: "Lead has no Instagram ID" });
          return;
        }
        // Fetch Credentials
        const oauth = await storage.getOAuthAccount(userId, 'instagram');
        if (!oauth || !oauth.accessToken) {
          res.status(400).json({ error: "Instagram not connected" });
          return;
        }
        const meta = (oauth.metadata as any) || {};
        const businessId = meta.instagram_business_account_id;
        if (!businessId) {
          res.status(400).json({ error: "Instagram business account ID missing" });
          return;
        }
        await sendInstagramMessage(oauth.accessToken, businessId, igId, messageBody);
      }
    } catch (sendError: any) {
      console.error("Sending error:", sendError);
      // Check for IMAP timeout specifically or general failure
      if (sendError.message?.toLowerCase().includes('timeout') || sendError.code === 'ETIMEDOUT') {
        res.status(504).json({ error: "Connection timed out. Retrying in background..." });
        return;
      }
      throw sendError;
    }

    const message = await storage.createMessage({
      leadId,
      userId,
      provider: selectedChannel,
      direction: "outbound",
      body: messageBody,
      subject: subject || undefined, // Store subject if provided
      audioUrl: null,
      metadata: { manual: true, sentAt: new Date() },
    });

    // Update lead last message time
    const updatedLead = await storage.updateLead(leadId, {
      lastMessageAt: new Date(),
      status: lead.status === "new" ? "open" : lead.status,
    });

    if (!updatedLead) {
      res.status(500).json({ error: "Failed to update lead status" });
      return;
    }

    // Notify via WebSocket
    const { wsSync } = await import('../lib/websocket-sync.js');
    wsSync.notifyMessagesUpdated(userId, { leadId, message });
    wsSync.notifyLeadsUpdated(userId, { type: 'lead_updated', lead: updatedLead });

    res.json({
      message,
      leadStatus: updatedLead.status,
    });
  } catch (error: unknown) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * POST /api/messages/:leadId/read
 * Mark all notifications for this lead as read
 */
router.post("/:leadId/read", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadId } = req.params;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Mark all notifications for this lead as read
    const notifications = await storage.getNotifications(userId);
    const leadNotifications = notifications.filter((n: any) => 
      n.metadata && (n.metadata as any).leadId === leadId && !n.read
    );
    for (const n of leadNotifications) {
      await storage.markNotificationAsRead(n.id);
    }
    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Mark messages read error:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

export default router;
