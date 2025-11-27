/* @ts-nocheck */

/**
 * INTELLIGENT PDF CONTEXT EXTRACTOR
 * 
 * Extracts from brand PDFs:
 * - Testimonials + case studies
 * - Product/service details
 * - Unique value propositions
 * - Target audience
 * - Pricing
 * - Industry-specific language
 * - URLs to testimonial pages
 * 
 * Then brainstorms with internet research:
 * - Competitive positioning
 * - Market gaps
 * - Industry trends
 * - Optimal messaging angles
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export interface ExtractedPDFContent {
  company_name: string;
  industry: string;
  target_audience: string;
  main_offer: string;
  unique_value: string[];
  testimonials: Array<{ text: string; source: string; impact: string }>;
  case_studies: Array<{ title: string; results: string }>;
  pricing_options: string[];
  tone_examples: string[];
  success_metrics: string[]; // e.g., "40% faster", "$100k revenue increase"
  website_urls: string[];
  competitor_positioning: string;
}

export async function extractComprehensiveContext(pdfText: string): Promise<ExtractedPDFContent> {
  /**
   * Use GPT-4 to intelligently extract business context
   * Then research competitive landscape
   */

  try {
    // Step 1: Extract from PDF
    const extractionPrompt = `Analyze this brand PDF and extract EVERYTHING about their business:

${pdfText.substring(0, 5000)} 

Extract and return ONLY valid JSON (no markdown, no code blocks):
{
  "company_name": "exact name from PDF",
  "industry": "their industry vertical",
  "target_audience": "who they serve",
  "main_offer": "primary product/service",
  "unique_value": ["unique angle 1", "unique angle 2"],
  "testimonials": [{"text": "exact quote", "source": "name/company", "impact": "result metric"}],
  "case_studies": [{"title": "case study title", "results": "specific outcomes"}],
  "pricing_options": ["option 1", "option 2"],
  "tone_examples": ["sample brand language"],
  "success_metrics": ["metric 1", "metric 2"],
  "website_urls": ["url1", "url2"],
  "competitor_positioning": "how they position vs competitors"
}

Be thorough and precise.`;

    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: extractionPrompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    let extracted: Partial<ExtractedPDFContent> = {};
    try {
      extracted = JSON.parse(extractionResponse.choices[0].message.content || "{}");
    } catch (e) {
      // If JSON parse fails, try to extract from text
      const text = extractionResponse.choices[0].message.content || "";
      extracted = {
        company_name: text.match(/company_name["\s:]*([^,\n}]*)/)?.[1] || "Unknown",
        industry: text.match(/industry["\s:]*([^,\n}]*)/)?.[1] || "B2B",
      };
    }

    // Step 2: Research competitive landscape
    const competitiveResearch = await researchCompetitivePosition(
      extracted.company_name || "Unknown",
      extracted.industry || "B2B",
      extracted.target_audience || "Businesses"
    );

    return {
      company_name: extracted.company_name || "Unknown",
      industry: extracted.industry || "B2B",
      target_audience: extracted.target_audience || "General",
      main_offer: extracted.main_offer || "Services",
      unique_value: extracted.unique_value || [],
      testimonials: extracted.testimonials || [],
      case_studies: extracted.case_studies || [],
      pricing_options: extracted.pricing_options || [],
      tone_examples: extracted.tone_examples || [],
      success_metrics: extracted.success_metrics || [],
      website_urls: extracted.website_urls || [],
      competitor_positioning: competitiveResearch || "Competitive",
    };
  } catch (error) {
    console.error("Error extracting PDF context:", error);
    return {
      company_name: "Unknown",
      industry: "B2B",
      target_audience: "General",
      main_offer: "Services",
      unique_value: [],
      testimonials: [],
      case_studies: [],
      pricing_options: [],
      tone_examples: [],
      success_metrics: [],
      website_urls: [],
      competitor_positioning: "Standard offering",
    };
  }
}

export async function researchCompetitivePosition(
  businessName: string,
  industry: string,
  targetAudience: string
): Promise<string> {
  /**
   * Use AI to research what competitors in this space do
   * Return positioning recommendations
   */

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Research the competitive landscape for:
          
Business: ${businessName}
Industry: ${industry}
Target Audience: ${targetAudience}

Provide:
1. Top 3-5 competitors in this space
2. How ${businessName} should position to dominate
3. Unique angles competitors are missing
4. Messaging recommendations to stand out

Format concisely and actionably.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    return response.choices[0].message.content || "Standard positioning in market";
  } catch (error) {
    console.error("Error researching competitive position:", error);
    return "Competitive offering in market";
  }
}

export async function brainstormMessageAngles(
  extractedContent: ExtractedPDFContent
): Promise<string[]> {
  /**
   * Based on extracted PDF content,
   * brainstorm the BEST messaging angles for sales outreach
   */

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Based on this business context, brainstorm 5 KILLER messaging angles for sales outreach:

Company: ${extractedContent.company_name}
Industry: ${extractedContent.industry}
Offer: ${extractedContent.main_offer}
Unique Value: ${extractedContent.unique_value.join(", ")}
Success Metrics: ${extractedContent.success_metrics.join(", ")}
Competitive Position: ${extractedContent.competitor_positioning}

Create 5 punchy messaging angles that:
1. Stand out from competitors
2. Highlight their specific advantage
3. Use their language/tone
4. Drive high response rates

Format as numbered list.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const text = response.choices[0].message.content || "";
    return text
      .split("\n")
      .filter((line) => line.trim().match(/^\d/))
      .slice(0, 5);
  } catch (error) {
    console.error("Error brainstorming angles:", error);
    return [];
  }
}

export async function generateIndustrySpecificGuidance(
  extractedContent: ExtractedPDFContent
): Promise<{
  urgencyDrivers: string[];
  objectionHandling: Record<string, string>;
  sendingStrategy: string;
  closePatterns: string[];
}> {
  /**
   * For THIS specific industry/niche,
   * return guidance on:
   * - What creates urgency
   * - How to handle common objections
   * - When/how often to reach out
   * - How million-dollar closers close in this industry
   */

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `You are an expert in the ${extractedContent.industry} space.

Context:
- Company: ${extractedContent.company_name}
- They help: ${extractedContent.target_audience}
- Success metric: ${extractedContent.success_metrics[0] || "ROI"}
- Competitive edge: ${extractedContent.competitor_positioning}

Provide industry-specific sales guidance:

1. URGENCY DRIVERS - What makes THIS industry prospect take action fast?
2. COMMON OBJECTIONS - What do prospects in ${extractedContent.industry} typically say?
3. HOW TO HANDLE EACH - Responses that work in this industry
4. SENDING STRATEGY - Cadence, best times, channels
5. CLOSE PATTERNS - How million-dollar closers close in ${extractedContent.industry}

Format as JSON.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const text = response.choices[0].message.content || "{}";
    try {
      return JSON.parse(text);
    } catch {
      return {
        urgencyDrivers: ["ROI", "Time to value", "Competitive pressure"],
        objectionHandling: {
          price: "Focus on ROI and payback period",
          busy: "Keep it brief, 5-minute conversation",
          already_using: "Highlight what you do differently",
        },
        sendingStrategy: "3 touches over 2 weeks, avoid Mondays/Fridays",
        closePatterns: [
          "Start with small commitment",
          "Use social proof/testimonials",
          "Create urgency through scarcity",
        ],
      };
    }
  } catch (error) {
    console.error("Error generating guidance:", error);
    return {
      urgencyDrivers: [],
      objectionHandling: {},
      sendingStrategy: "",
      closePatterns: [],
    };
  }
}
