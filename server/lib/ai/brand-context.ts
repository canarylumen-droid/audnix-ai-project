/* @ts-nocheck */
import { storage } from "../../storage";
import { getIndustryFraming, detectLeadTone } from "./sales-language-optimizer";

export interface BrandContext {
  companyName: string;
  businessDescription?: string;
  industry?: string;
  uniqueValue?: string;
  targetAudience?: string;
  successStories?: string[];
  offer?: string;
  tone?: "formal" | "casual" | "warm" | "blunt";
  positioning?: "premium" | "mid" | "volume";
  objections?: Record<string, string>;
  brandLanguage?: {
    prefer?: string[];
    avoid?: string[];
  };
}

/**
 * Retrieve complete brand context for a user
 */
export async function getBrandContext(userId: string): Promise<BrandContext> {
  try {
    const user = await storage.getUserById(userId);

    if (!user) {
      return getDefaultContext();
    }

    const metadata = user.metadata || {};

    return {
      companyName: user.businessName || user.company || "your company",
      businessDescription:
        metadata.businessDescription ||
        metadata.pitch ||
        "helping clients grow their business",
      industry: metadata.industry,
      uniqueValue: metadata.uniqueValue || metadata.mainBenefit,
      targetAudience: metadata.targetAudience || metadata.idealClient,
      successStories: metadata.successStories || metadata.wins || [],
      offer: metadata.offer || metadata.packages,
      tone: metadata.tone || "warm",
      positioning: metadata.positioning || "premium",
      objections: metadata.objections || {},
      brandLanguage: metadata.brandLanguage || {
        prefer: [],
        avoid: [],
      },
    };
  } catch (error) {
    console.error("Error fetching brand context:", error);
    return getDefaultContext();
  }
}

function getDefaultContext(): BrandContext {
  return {
    companyName: "your company",
    businessDescription: "helping clients grow",
    tone: "warm",
    positioning: "premium",
  };
}

/**
 * Build industry-specific system prompt injection
 */
export function buildIndustryPrompt(brand: BrandContext): string {
  const industryFraming = getIndustryFraming(brand.industry);

  const industryGuides: Record<string, string> = {
    realEstate:
      "Focus on urgency, timing windows, scarcity, and fast response. Emphasize market timing and deal windows.",
    agency:
      "Lead with ROI, bottleneck removal, predictable throughput. Talk about efficiency gains and capacity.",
    coaching:
      "Emphasize transformation, clarity, trust, and step-by-step progress. Build desire for the end state.",
    creator:
      "Focus on engagement growth, consistency, speed, and maintaining brand voice. Celebrate wins.",
    b2b:
      "Emphasize efficiency, reliability, scalability, and professionalism. Talk about team adoption.",
    ecommerce:
      "Lead with conversion rates, average order value, repeat purchases, and traffic quality.",
    saas:
      "Focus on churn reduction, expansion revenue, product adoption, and user engagement metrics.",
  };

  return industryGuides[brand.industry?.toLowerCase()] || industryGuides.b2b;
}

/**
 * Format complete brand context for AI system prompt
 */
export function formatBrandContextForPrompt(brand: BrandContext): string {
  let prompt = `# Brand Context

Company: ${brand.companyName}`;

  if (brand.businessDescription) {
    prompt += `\nWhat you do: ${brand.businessDescription}`;
  }

  if (brand.industry) {
    prompt += `\nIndustry: ${brand.industry}`;
    prompt += `\nIndustry Focus: ${buildIndustryPrompt(brand)}`;
  }

  if (brand.uniqueValue) {
    prompt += `\nYour unique value: ${brand.uniqueValue}`;
  }

  if (brand.targetAudience) {
    prompt += `\nTarget audience: ${brand.targetAudience}`;
  }

  if (brand.positioning) {
    prompt += `\nPositioning: ${brand.positioning} (adjust tone accordingly)`;
  }

  if (brand.offer) {
    prompt += `\nYour offer: ${brand.offer}`;
  }

  if (brand.successStories && brand.successStories.length > 0) {
    prompt += `\nSuccess stories: ${brand.successStories.join(", ")}`;
  }

  if (brand.objections && Object.keys(brand.objections).length > 0) {
    prompt += `\nCommon objections & how to handle them:`;
    for (const [objection, response] of Object.entries(brand.objections)) {
      prompt += `\n- "${objection}": Respond with "${response}"`;
    }
  }

  if (brand.brandLanguage) {
    if (brand.brandLanguage.prefer && brand.brandLanguage.prefer.length > 0) {
      prompt += `\nPreferred language: ${brand.brandLanguage.prefer.join(", ")}`;
    }
    if (brand.brandLanguage.avoid && brand.brandLanguage.avoid.length > 0) {
      prompt += `\nAvoid using: ${brand.brandLanguage.avoid.join(", ")}`;
    }
  }

  prompt += `\n\n# Tone: Always sound like ${brand.companyName}, but better.`;

  return prompt;
}

/**
 * Extract tone and positioning from brand data
 */
export function extractBrandPersonality(brand: BrandContext): {
  tone: "formal" | "casual" | "warm" | "blunt";
  confidence: "high" | "medium" | "low";
  urgency: "high" | "medium" | "low";
} {
  let confidence: "high" | "medium" | "low" = "medium";
  let urgency: "high" | "medium" | "low" = "medium";

  if (brand.positioning === "premium") {
    confidence = "high";
  }

  if (
    brand.industry === "realEstate" ||
    brand.industry === "sales"
  ) {
    urgency = "high";
  }

  return {
    tone: brand.tone || "warm",
    confidence,
    urgency,
  };
}
