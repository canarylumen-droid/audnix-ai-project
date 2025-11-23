/* @ts-nocheck */
import { storage } from "../../storage";

/**
 * Brand Context Module
 * 
 * Loads user's company/brand info from database
 * Used to personalize AI replies with real business context
 */

export interface BrandContext {
  companyName: string;
  businessDescription?: string;
  industry?: string;
  uniqueValue?: string;
  targetAudience?: string;
  successStories?: string[];
}

/**
 * Retrieve brand context for a user
 * Returns company name and metadata for personalizing responses
 */
export async function getBrandContext(userId: string): Promise<BrandContext> {
  try {
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return {
        companyName: "your company",
        businessDescription: "helping clients grow their business"
      };
    }

    // Extract brand info from user metadata
    const metadata = user.metadata || {};
    
    return {
      companyName: user.businessName || user.company || "your company",
      businessDescription: metadata.businessDescription || 
                           metadata.pitch || 
                           "helping clients grow their business",
      industry: metadata.industry,
      uniqueValue: metadata.uniqueValue || metadata.mainBenefit,
      targetAudience: metadata.targetAudience || metadata.idealClient,
      successStories: metadata.successStories || metadata.wins || []
    };
  } catch (error) {
    console.error("Error fetching brand context:", error);
    return {
      companyName: "your company",
      businessDescription: "helping clients grow"
    };
  }
}

/**
 * Format brand context into a prompt snippet
 * Used in AI system prompt to inject personalization
 */
export function formatBrandContextForPrompt(brand: BrandContext): string {
  let promptSnippet = `Company: ${brand.companyName}`;
  
  if (brand.businessDescription) {
    promptSnippet += `\nWhat you do: ${brand.businessDescription}`;
  }
  
  if (brand.industry) {
    promptSnippet += `\nIndustry: ${brand.industry}`;
  }
  
  if (brand.uniqueValue) {
    promptSnippet += `\nYour unique value: ${brand.uniqueValue}`;
  }
  
  if (brand.targetAudience) {
    promptSnippet += `\nWho you serve: ${brand.targetAudience}`;
  }
  
  if (brand.successStories && brand.successStories.length > 0) {
    promptSnippet += `\nSuccess examples:\n${brand.successStories.slice(0, 3).map(s => `- ${s}`).join('\n')}`;
  }
  
  return promptSnippet;
}

/**
 * Get a personalized example based on brand context
 * Returns real-world example relevant to user's industry
 */
export function getPersonalizedExample(brand: BrandContext, leadName: string): string {
  const company = brand.companyName;
  const industry = brand.industry || "business";
  
  // Industry-specific examples
  const examples: Record<string, string> = {
    "ecommerce": `${leadName}, we helped Sarah at an online store increase her AOV by 40% in the first month - she now reconnects with past customers automatically`,
    "coaching": `${leadName}, we helped a coach in your space go from 5 clients to 15 without burning out - all because they automated follow-ups`,
    "saas": `${leadName}, we helped a SaaS founder save 12 hours per week on sales follow-ups - now he focuses on product instead`,
    "agency": `${leadName}, we helped an agency scale from $50k to $150k MRR by automating client outreach - they now manage 2x more accounts`,
    "real estate": `${leadName}, we helped a realtor convert 3 more deals per month just by reconnecting with past leads automatically`,
    "consulting": `${leadName}, we helped a consultant book $50k more in projects by having personalized follow-ups happen 24/7`,
    "fitness": `${leadName}, we helped a fitness coach go from 10 to 30 clients by automating membership follow-ups`,
    "services": `${leadName}, we helped a service provider streamline proposals and follow-ups - now books 2x more clients`,
    "default": `${leadName}, we helped businesses like ${company} reconnect with more leads without the manual work`
  };
  
  return examples[industry.toLowerCase()] || examples["default"];
}

/**
 * Create personalized objection response using brand context
 */
export function buildPersonalizedObjectionResponse(
  objection: string, 
  brand: BrandContext, 
  leadName: string
): string {
  const objectionLower = objection.toLowerCase();
  const company = brand.companyName;
  
  // Price objection with brand context
  if (objectionLower.includes('price') || objectionLower.includes('expensive') || objectionLower.includes('cost')) {
    return `Look, I get it - the investment feels big upfront. But here's what's wild: most of our team members at places like ${company} save that cost in just 2 weeks from not burning time on manual follow-ups. Quick 15-min call to show you the math?`;
  }

  // Time objection with brand context
  if (objectionLower.includes('time') || objectionLower.includes('busy')) {
    return `Totally get it - you're crushed right now. That's exactly why ${company} uses this: automates the stuff that eats your time. Just 10 mins a day to set it up. When's good this week?`;
  }

  // Already using solution
  if (objectionLower.includes('already have') || objectionLower.includes('using')) {
    return `That's awesome you're testing things. Real talk: most people who switch to us from other tools save 15+ hours a week. Want to see what makes us different? 15 mins?`;
  }

  // Not interested
  if (objectionLower.includes('not interested') || objectionLower.includes('pass')) {
    return `No worries! If anything changes or you get curious, I'm right here. Good luck with everything you're building! 💪`;
  }

  // Default with brand context
  return `Got it. Just so you know - ${company} loves working with people like you who think strategically about growth. Let's touch base next week, no pressure.`;
}
