/* @ts-nocheck */

/**
 * TIER 1: LEAD MANAGEMENT SERVICE
 * 
 * Handles:
 * - Lead Scoring (1-100)
 * - Lead Segmentation
 * - Lead Tags & Custom Fields
 * - Lead Deduplication
 * - Company Enrichment
 * - Activity Timeline
 */

import { storage } from "../storage";
import type { Lead } from "@shared/schema";

// ============ LEAD SCORING (1-100) ============

export async function calculateLeadScore(lead: Lead, messages: any[] = []): Promise<number> {
  /**
   * Calculate lead score based on:
   * 1. Engagement (replies, opens) = 30%
   * 2. Company quality (size, industry) = 25%
   * 3. Industry fit = 20%
   * 4. Velocity (how fast replying) = 15%
   * 5. Time in pipeline = 10%
   */

  let score = 0;

  // 1. ENGAGEMENT SCORE (30 points)
  const engagementScore = calculateEngagementScore(messages);
  score += engagementScore * 0.3;

  // 2. COMPANY SCORE (25 points)
  const companyScore = calculateCompanyScore(lead);
  score += companyScore * 0.25;

  // 3. INDUSTRY SCORE (20 points)
  const industryScore = calculateIndustryScore(lead);
  score += industryScore * 0.2;

  // 4. VELOCITY SCORE (15 points)
  const velocityScore = calculateVelocityScore(messages);
  score += velocityScore * 0.15;

  // 5. TIME IN PIPELINE (10 points)
  const timeScore = calculateTimeScore(lead);
  score += timeScore * 0.1;

  return Math.min(100, Math.round(score));
}

function calculateEngagementScore(messages: any[]): number {
  if (!messages || messages.length === 0) return 0;

  // Count inbound messages (lead engagement)
  const inboundCount = messages.filter((m) => m.direction === "inbound").length;

  // Email opens (if tracked)
  const openCount = messages.filter((m) => m.opened).length;

  // Clicks (if tracked)
  const clickCount = messages.filter((m) => m.clicked).length;

  // Quick reply (within 2 hours) = high engagement
  const hasQuickReply = messages.some((m, i) => {
    if (i === 0 || m.direction !== "inbound") return false;
    const prevMessage = messages[i - 1];
    const timeDiff = (new Date(m.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) / (1000 * 60 * 60);
    return timeDiff < 2;
  });

  return Math.min(100, inboundCount * 20 + openCount * 10 + clickCount * 10 + (hasQuickReply ? 10 : 0));
}

function calculateCompanyScore(lead: Lead): number {
  let score = 0;

  // Company size (larger = higher score)
  const sizeMap: Record<string, number> = {
    "1-10": 20,
    "11-50": 40,
    "51-200": 60,
    "201-500": 75,
    "500+": 100,
  };
  score += sizeMap[lead.companySize || ""] || 30;

  // Company has website / LinkedIn = established company
  if (lead.companyWebsite) score += 15;

  return Math.min(100, score);
}

function calculateIndustryScore(lead: Lead): number {
  /**
   * Industry fit depends on user's focus
   * For now: high-value industries get higher scores
   */

  const highValueIndustries = [
    "technology",
    "finance",
    "healthcare",
    "real estate",
    "e-commerce",
    "saas",
    "consulting",
  ];

  if (highValueIndustries.some((ind) => lead.industry?.toLowerCase().includes(ind))) {
    return 80;
  }

  return 50;
}

function calculateVelocityScore(messages: any[]): number {
  /**
   * Fast repliers = higher engagement
   * Measure: average time between message and reply
   */

  if (!messages || messages.length < 2) return 30;

  let totalTime = 0;
  let replyCount = 0;

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].direction === "inbound" && i > 0) {
      const prevMessage = messages[i - 1];
      const timeDiff = (new Date(messages[i].createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) / (1000 * 60);
      totalTime += timeDiff;
      replyCount++;
    }
  }

  if (replyCount === 0) return 30;

  const avgTime = totalTime / replyCount;

  // Fast reply (< 30 min) = 100
  // Medium reply (30 min - 4 hours) = 70
  // Slow reply (> 4 hours) = 40
  if (avgTime < 30) return 100;
  if (avgTime < 240) return 70;
  return 40;
}

function calculateTimeScore(lead: Lead): number {
  /**
   * Newer leads might be fresh = higher score
   * Older leads in pipeline = higher score (persistence paying off)
   */

  const daysSinceCreated = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);

  // Sweet spot: 5-30 days = 100 (fresh but with time for engagement)
  if (daysSinceCreated >= 5 && daysSinceCreated <= 30) return 100;
  if (daysSinceCreated < 5) return 60; // Too fresh
  if (daysSinceCreated > 90) return 40; // Too old (might be cold)

  return 70;
}

// ============ LEAD DEDUPLICATION ============

export async function findDuplicateLeads(
  lead: Lead,
  userLeads: Lead[]
): Promise<Array<{ lead: Lead; matchScore: number; matchFields: string[] }>> {
  /**
   * Find potential duplicates based on:
   * 1. Email match = 100%
   * 2. Phone match = 95%
   * 3. Email domain + first name = 80%
   * 4. Company + email domain = 75%
   */

  const duplicates: Array<{ lead: Lead; matchScore: number; matchFields: string[] }> = [];

  for (const otherLead of userLeads) {
    if (lead.id === otherLead.id) continue;

    let matchScore = 0;
    const matchFields: string[] = [];

    // Email exact match
    if (lead.email && lead.email === otherLead.email) {
      matchScore = 100;
      matchFields.push("email");
    }

    // Phone match
    if (lead.phone && lead.phone === otherLead.phone && lead.phone.length > 5) {
      matchScore = Math.max(matchScore, 95);
      matchFields.push("phone");
    }

    // Email domain + first name match
    if (lead.email && otherLead.email) {
      const leadDomain = lead.email.split("@")[1];
      const otherDomain = otherLead.email.split("@")[1];

      if (leadDomain === otherDomain && lead.firstName?.toLowerCase() === otherLead.firstName?.toLowerCase()) {
        matchScore = Math.max(matchScore, 80);
        matchFields.push("email_domain", "first_name");
      }
    }

    // Company + email domain match
    if (lead.company && lead.email && otherLead.company && otherLead.email) {
      const leadDomain = lead.email.split("@")[1];
      const otherDomain = otherLead.email.split("@")[1];

      if (
        leadDomain === otherDomain &&
        lead.company.toLowerCase() === otherLead.company.toLowerCase()
      ) {
        matchScore = Math.max(matchScore, 75);
        matchFields.push("company", "email_domain");
      }
    }

    if (matchScore >= 70) {
      duplicates.push({ lead: otherLead, matchScore, matchFields });
    }
  }

  return duplicates.sort((a, b) => b.matchScore - a.matchScore);
}

// ============ LEAD SEGMENTATION ============

export async function createLeadSegment(
  userId: string,
  segmentName: string,
  criteria: {
    scoreMin?: number;
    scoreMax?: number;
    tags?: string[];
    industries?: string[];
    companySize?: string[];
    status?: string[];
  }
): Promise<any> {
  /**
   * Create dynamic segment based on criteria
   * Segments auto-update as leads change
   */

  return {
    userId,
    segmentName,
    criteria,
    createdAt: new Date(),
    // In production: save to DB and recalculate segment membership
  };
}

export async function getLeadsInSegment(
  userId: string,
  segmentCriteria: any,
  allLeads: Lead[]
): Promise<Lead[]> {
  /**
   * Filter leads matching segment criteria
   */

  return allLeads.filter((lead) => {
    // Score filter
    if (segmentCriteria.scoreMin && (lead.score || 0) < segmentCriteria.scoreMin) return false;
    if (segmentCriteria.scoreMax && (lead.score || 0) > segmentCriteria.scoreMax) return false;

    // Industry filter
    if (segmentCriteria.industries && segmentCriteria.industries.length > 0) {
      if (!segmentCriteria.industries.some((ind) => lead.industry?.includes(ind))) return false;
    }

    // Company size filter
    if (segmentCriteria.companySize && segmentCriteria.companySize.length > 0) {
      if (!segmentCriteria.companySize.includes(lead.companySize)) return false;
    }

    return true;
  });
}

// ============ BANT QUALIFICATION ============

export async function completeBantQualification(lead: Lead): Promise<{
  budget: "has_budget" | "no_budget" | "unknown";
  authority: "decision_maker" | "influencer" | "not_involved";
  need: "has_need" | "no_need" | "unknown";
  timeline: "immediate" | "this_quarter" | "this_year" | "no_timeline";
  qualification_score: number;
}> {
  /**
   * BANT = Budget, Authority, Need, Timeline
   * Score 0-100 (all yes = 100)
   */

  // In production: analyze conversation to determine BANT
  // For now: return template

  let score = 0;
  const responses: any = {};

  // Placeholder: in real app, AI analyzes lead messages to determine BANT
  score = 50; // Default

  return {
    budget: "unknown",
    authority: "unknown",
    need: "unknown",
    timeline: "unknown",
    qualification_score: score,
  };
}

// ============ LEAD COMPANY ENRICHMENT ============

export async function enrichLeadCompany(lead: Lead): Promise<{
  company_name: string;
  company_size: string;
  industry: string;
  revenue_estimate: string;
  employee_count: number;
  website: string;
  linkedin_url: string;
  tech_stack: string[];
  competitors: string[];
}> {
  /**
   * Enrich lead with company data
   * In production: integrate with Clearbit, Hunter, etc.
   */

  // Extract domain from email
  const emailDomain = lead.email?.split("@")[1];

  return {
    company_name: lead.company || "",
    company_size: lead.companySize || "unknown",
    industry: lead.industry || "unknown",
    revenue_estimate: "unknown",
    employee_count: 0,
    website: `https://${emailDomain}` || "",
    linkedin_url: "",
    tech_stack: [],
    competitors: [],
  };
}

// ============ ACTIVITY TIMELINE ============

export async function addTimelineEvent(
  leadId: string,
  actionType: string,
  actionData: any,
  actorId?: string
): Promise<void> {
  /**
   * Log activity: email sent, opened, replied, status changed, etc.
   */

  console.log(`📝 Timeline: Lead ${leadId} - ${actionType}`, actionData);

  // In production: save to lead_timeline table
}

export async function getLeadTimeline(leadId: string): Promise<any[]> {
  /**
   * Get complete audit trail for lead
   */

  // In production: query lead_timeline table
  return [];
}

// ============ LEAD TAGS & CUSTOM FIELDS ============

export async function addLeadTag(leadId: string, tagName: string): Promise<void> {
  console.log(`🏷️ Tagged: Lead ${leadId} with "${tagName}"`);
  // In production: insert into lead_tag_mapping
}

export async function setCustomFieldValue(leadId: string, fieldName: string, value: any): Promise<void> {
  console.log(`📋 Custom field: Lead ${leadId} - ${fieldName} = ${value}`);
  // In production: insert into lead_custom_field_values
}
