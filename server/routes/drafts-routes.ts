import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { requireAuth, getCurrentUserId } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/drafts/:leadId
 * Get draft for a lead
 */
router.get("/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const leadId = typeof req.params.leadId === 'string' ? req.params.leadId : req.params.leadId[0];

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const draft = await storage.getDraftByLeadId(userId, leadId);
    res.json({ draft });
  } catch (error: unknown) {
    console.error("Get draft error:", error);
    res.status(500).json({ error: "Failed to fetch draft" });
  }
});

/**
 * POST /api/drafts/:leadId
 * Save or update draft for a lead
 */
router.post("/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const leadId = typeof req.params.leadId === 'string' ? req.params.leadId : req.params.leadId[0];
    const { content, subject, channel } = req.body;

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    const draft = await storage.saveDraft(userId, leadId, content.trim(), subject, channel || lead.channel);
    res.json({ success: true, draft });
  } catch (error: unknown) {
    console.error("Save draft error:", error);
    res.status(500).json({ error: "Failed to save draft" });
  }
});

/**
 * DELETE /api/drafts/:leadId
 * Delete draft for a lead
 */
router.delete("/:leadId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const leadId = typeof req.params.leadId === 'string' ? req.params.leadId : req.params.leadId[0];

    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    await storage.deleteDraft(userId, leadId);
    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete draft error:", error);
    res.status(500).json({ error: "Failed to delete draft" });
  }
});

export default router;
