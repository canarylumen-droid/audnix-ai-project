/* @ts-nocheck */
import { Router, Request, Response } from "express";
import { requireAuth, getCurrentUserId } from "../middleware/auth";
import multer from "multer";
import { storage } from "../storage";
import OpenAI from "openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

interface BrandExtraction {
  companyName?: string;
  businessDescription?: string;
  industry?: string;
  uniqueValue?: string;
  targetAudience?: string;
  successStories?: string[];
  offer?: string;
  tone?: string;
  positioning?: string;
  objections?: Record<string, string>;
  brandLanguage?: {
    prefer?: string[];
    avoid?: string[];
  };
}

/**
 * Deep merge two objects, properly handling nested objects and arrays
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] === null || source[key] === undefined) {
      continue;
    }
    
    if (Array.isArray(source[key])) {
      result[key] = [...(result[key] || []), ...source[key]];
    } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * POST /api/brand-pdf/analyze
 * Analyze PDF for required brand context fields
 * Available to all authenticated users
 */
router.post(
  "/analyze",
  requireAuth,
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF provided" });
      }

      const pdfParse = require("pdf-parse");
      const data = await pdfParse(req.file.buffer);
      const pdfText = data.text.toLowerCase();

      const checks = [
        { name: "Company Overview", present: /company|business|about|overview|who we are/.test(pdfText), required: true },
        { name: "Offer/Pricing", present: /price|pricing|package|offer|plan|investment|program/.test(pdfText), required: true },
        { name: "Target Client", present: /ideal|target|client|audience|avatar|help|serve/.test(pdfText), required: true },
        { name: "Tone Style", present: /tone|style|voice|personality|brand|professional|friendly/.test(pdfText), required: true },
        { name: "Success Stories", present: /success|case study|win|result|testimonial|client|achieved/.test(pdfText), required: false },
        { name: "Objections", present: /objection|concern|hesitation|doubt|question|faq|worry/.test(pdfText), required: false },
        { name: "Brand Language", present: /language|words|avoid|prefer|slang|terminology/.test(pdfText), required: false },
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
        text_length: data.text.length,
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
 * POST /api/brand-pdf/upload
 * Upload and store brand PDF - extracts and saves brand context
 * Available to all authenticated users
 */
router.post(
  "/upload",
  requireAuth,
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No PDF provided" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Parse PDF
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(req.file.buffer);
      const pdfText = data.text;

      if (!pdfText || pdfText.length < 50) {
        return res.status(400).json({ 
          error: "PDF appears to be empty or too short",
          message: "Please upload a PDF with your brand information (at least 50 characters)"
        });
      }

      // Extract brand context using AI
      let brandContext: BrandExtraction = {};

      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "mock-key") {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are a brand analyst. Extract the following information from the brand document.
Return a JSON object with these fields:
- companyName: The company/brand name
- businessDescription: What the business does (1-2 sentences)
- industry: The industry (e.g., "coaching", "agency", "saas", "ecommerce")
- uniqueValue: The unique value proposition
- targetAudience: Who they help/serve
- successStories: Array of brief success stories or testimonials
- offer: Their main offer/service/product
- tone: The communication tone (formal, casual, warm, professional)
- positioning: Market positioning (premium, mid, volume)
- objections: Common objections as key-value pairs {"objection": "response"}
- brandLanguage: { prefer: ["words to use"], avoid: ["words to avoid"] }

Only include fields you can confidently extract. Return valid JSON only.`
              },
              {
                role: "user",
                content: `Extract brand context from this document:\n\n${pdfText.substring(0, 8000)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          });

          const response = completion.choices[0].message.content;
          if (response) {
            brandContext = JSON.parse(response);
          }
        } catch (aiError) {
          console.warn("AI extraction failed, using regex fallback:", aiError);
        }
      }

      // Fallback: Extract basic info with regex
      if (!brandContext.companyName) {
        const companyMatch = pdfText.match(/(?:company|brand|business)\s*(?:name)?[:\s]+([A-Z][a-zA-Z\s]+)/i);
        brandContext.companyName = companyMatch?.[1]?.trim() || user.businessName || user.name;
      }

      // Deep merge with existing metadata to preserve nested objects
      const existingMetadata = user.metadata || {};
      const brandMetadata = {
        companyName: brandContext.companyName,
        businessDescription: brandContext.businessDescription,
        industry: brandContext.industry,
        uniqueValue: brandContext.uniqueValue,
        targetAudience: brandContext.targetAudience,
        successStories: brandContext.successStories,
        offer: brandContext.offer,
        tone: brandContext.tone,
        positioning: brandContext.positioning,
        objections: brandContext.objections,
        brandLanguage: brandContext.brandLanguage,
        brandPdfUploadedAt: new Date().toISOString(),
        brandPdfFileName: req.file.originalname,
        brandPdfSize: req.file.size,
      };

      // Use deep merge to preserve existing nested data
      const updatedMetadata = deepMerge(existingMetadata, brandMetadata);

      // Save to user profile
      await storage.updateUser(userId, {
        metadata: updatedMetadata,
        businessName: brandContext.companyName || user.businessName,
      });

      console.log(`✅ Brand PDF uploaded and processed for user ${userId}`);

      return res.json({
        success: true,
        message: "Brand PDF uploaded and processed successfully",
        extracted: {
          companyName: brandContext.companyName,
          industry: brandContext.industry,
          targetAudience: brandContext.targetAudience,
          tone: brandContext.tone,
          hasSuccessStories: (brandContext.successStories?.length || 0) > 0,
          hasObjections: Object.keys(brandContext.objections || {}).length > 0,
        },
      });
    } catch (error: any) {
      console.error("Error uploading brand PDF:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/brand-pdf/context
 * Get current brand context for the user
 */
router.get(
  "/context",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const metadata = user.metadata || {};

      return res.json({
        hasBrandPdf: !!metadata.brandPdfUploadedAt,
        brandContext: {
          companyName: metadata.companyName || user.businessName,
          businessDescription: metadata.businessDescription,
          industry: metadata.industry,
          uniqueValue: metadata.uniqueValue,
          targetAudience: metadata.targetAudience,
          successStories: metadata.successStories || [],
          offer: metadata.offer,
          tone: metadata.tone || "warm",
          positioning: metadata.positioning || "premium",
          objections: metadata.objections || {},
          brandLanguage: metadata.brandLanguage || { prefer: [], avoid: [] },
        },
        uploadedAt: metadata.brandPdfUploadedAt,
        fileName: metadata.brandPdfFileName,
      });
    } catch (error: any) {
      console.error("Error fetching brand context:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PATCH /api/brand-pdf/context
 * Update brand context manually
 */
router.patch(
  "/context",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updates = req.body;
      const existingMetadata = user.metadata || {};

      // Deep merge updates with existing metadata
      const updatedMetadata = deepMerge(existingMetadata, {
        ...updates,
        brandContextUpdatedAt: new Date().toISOString(),
      });

      await storage.updateUser(userId, {
        metadata: updatedMetadata,
        businessName: updates.companyName || user.businessName,
      });

      return res.json({
        success: true,
        message: "Brand context updated",
      });
    } catch (error: any) {
      console.error("Error updating brand context:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
