import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { requireAuth, getCurrentUserId } from "../middleware/auth.js";
import { sendEmail } from "../lib/channels/email.js";
import { sendInstagramMessage } from "../lib/channels/instagram.js";

const router = Router();

/**
 * GET /api/smtp/settings
 * Get SMTP settings for the current user
 */
router.get("/smtp/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req)!;
    const settings = await storage.getSmtpSettings(userId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch SMTP settings" });
  }
});

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
    const { content, channel } = req.body;

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
        await sendEmail(userId, lead.email, messageBody, `Re: ${lead.name || 'Conversation'}`, { isRaw: true });
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
      audioUrl: null,
      metadata: { manual: true, sentAt: new Date() },
    });

    // Update lead last message time
    await storage.updateLead(leadId, {
      lastMessageAt: new Date(),
      status: lead.status === "new" ? "open" : lead.status,
    });

    res.json({
      message,
      leadStatus: lead.status === "new" ? "open" : lead.status,
    });
  } catch (error: unknown) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
