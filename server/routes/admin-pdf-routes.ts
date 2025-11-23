/* @ts-nocheck */
import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import multer from "multer";
import { storage } from "../storage";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/admin/analyze-pdf
 * Analyze PDF for required brand context fields
 */
router.post(
  "/analyze-pdf",
  requireAuth,
  requireAdmin,
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF provided" });
      }

      // For now, return a mock analysis
      // In production, you'd use pdf-parse to extract text
      const pdfContent = req.file.buffer.toString("utf-8").toLowerCase();

      const checks = [
        { name: "Company Overview", present: /company|business|about|overview/.test(pdfContent), required: true },
        { name: "Offer/Pricing", present: /price|pricing|package|offer|plan/.test(pdfContent), required: true },
        { name: "Target Client", present: /ideal|target|client|audience|avatar/.test(pdfContent), required: true },
        { name: "Tone Style", present: /tone|style|voice|personality|brand/.test(pdfContent), required: true },
        { name: "Success Stories", present: /success|case study|win|result|testimonial|client/.test(pdfContent), required: false },
        { name: "Objections", present: /objection|concern|hesitation|doubt|question/.test(pdfContent), required: false },
        { name: "Brand Language", present: /language|words|avoid|prefer|slang/.test(pdfContent), required: false },
      ];

      const presentCount = checks.filter((c) => c.present).length;
      const requiredCount = checks.filter((c) => c.required).length;
      const presentRequired = checks.filter((c) => c.required && c.present).length;

      const score = Math.round((presentCount / checks.length) * 100);

      const missingCritical = checks
        .filter((c) => c.required && !c.present)
        .map((c) => c.name);

      return res.json({
        overall_score: score,
        items: checks,
        missing_critical: missingCritical,
        recommendations: [
          presentRequired < requiredCount
            ? "Add more details about your required fields"
            : null,
          presentCount < 5
            ? "Include success stories and objection handling for better AI responses"
            : null,
          !checks.find((c) => c.name === "Brand Language")?.present
            ? "Add your preferred language and phrases to use"
            : null,
        ].filter(Boolean),
      });
    } catch (error: any) {
      console.error("Error analyzing PDF:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/admin/upload-brand-pdf
 * Upload and store brand PDF
 */
router.post(
  "/upload-brand-pdf",
  requireAuth,
  requireAdmin,
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF provided" });
      }

      // Store PDF content in user metadata
      // In production, you'd store this in cloud storage and parse it
      const pdfContent = req.file.buffer.toString("utf-8");

      // Save to metadata
      // await storage.updateUser(userId, {
      //   metadata: {
      //     ...user.metadata,
      //     brandPdfContent: pdfContent,
      //     brandPdfUploadedAt: new Date(),
      //   }
      // });

      return res.json({
        success: true,
        message: "Brand PDF uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
