/**
 * Audit Trail Service
 * Logs all AI actions for compliance and monitoring
 */

import { db } from "../db";
import { auditTrail, pdfAnalytics } from "@shared/schema";
import type { Lead } from "@shared/schema";

export interface AuditAction {
  userId: string;
  leadId: string;
  action: "ai_message_sent" | "opt_out_toggled" | "pdf_processed" | "upload_rate_limited";
  messageId?: string;
  details: Record<string, any>;
}

export class AuditTrailService {
  /**
   * Log AI message sent
   */
  static async logAiMessageSent(
    userId: string,
    leadId: string,
    messageId: string,
    channel: string,
    content: string,
    followUpNumber: number
  ): Promise<void> {
    try {
      await db.insert(auditTrail).values({
        userId,
        leadId,
        action: "ai_message_sent",
        messageId,
        details: {
          channel,
          contentLength: content.length,
          followUpNumber,
          timestamp: new Date().toISOString(),
        },
      });
      console.log(`✓ Audit: AI message sent to lead ${leadId} (${channel})`);
    } catch (error) {
      console.error("Audit trail error:", error);
    }
  }

  /**
   * Log opt-out toggle
   */
  static async logOptOutToggle(
    userId: string,
    leadId: string,
    isPaused: boolean
  ): Promise<void> {
    try {
      await db.insert(auditTrail).values({
        userId,
        leadId,
        action: "opt_out_toggled",
        details: {
          aiPaused: isPaused,
          timestamp: new Date().toISOString(),
        },
      });
      console.log(`✓ Audit: AI ${isPaused ? "paused" : "resumed"} for lead ${leadId}`);
    } catch (error) {
      console.error("Audit trail error:", error);
    }
  }

  /**
   * Log PDF processing with confidence
   */
  static async logPdfProcessed(
    userId: string,
    fileName: string,
    fileSize: number,
    confidence: number,
    missingFields: string[],
    leadsExtracted: number
  ): Promise<void> {
    try {
      // Log to pdf_analytics
      await db.insert(pdfAnalytics).values({
        userId,
        fileName,
        fileSize,
        confidence,
        missingFields,
        leadsExtracted,
      });

      // Alert if confidence is low
      if (confidence < 0.4) {
        console.warn(
          `⚠️ LOW PDF CONFIDENCE (${(confidence * 100).toFixed(1)}%) for ${fileName}`
        );
      }

      console.log(
        `✓ Audit: PDF processed - ${fileName} (confidence: ${(confidence * 100).toFixed(1)}%, leads: ${leadsExtracted})`
      );
    } catch (error) {
      console.error("PDF analytics error:", error);
    }
  }

  /**
   * Log rate limit hit
   */
  static async logRateLimitHit(userId: string, reason: string): Promise<void> {
    try {
      await db.insert(auditTrail).values({
        userId,
        leadId: "", // No specific lead
        action: "upload_rate_limited",
        details: {
          reason,
          timestamp: new Date().toISOString(),
        },
      });
      console.log(`⚠️ Audit: Rate limit - ${reason} for user ${userId}`);
    } catch (error) {
      console.error("Audit trail error:", error);
    }
  }

  /**
   * Get audit history for a lead
   */
  static async getLeadAuditHistory(leadId: string) {
    try {
      const history = await db
        .select()
        .from(auditTrail)
        .where(({ leadId: id }) => id === leadId)
        .orderBy(({ createdAt }) => ({ createdAt: "desc" }))
        .limit(100);

      return history;
    } catch (error) {
      console.error("Error fetching audit history:", error);
      return [];
    }
  }

  /**
   * Get PDF analytics for user
   */
  static async getPdfAnalytics(userId: string, limit = 30) {
    try {
      const stats = await db
        .select()
        .from(pdfAnalytics)
        .where(({ userId: id }) => id === userId)
        .orderBy(({ processedAt }) => ({ processedAt: "desc" }))
        .limit(limit);

      // Calculate statistics
      const lowConfidenceCount = stats.filter((s) => s.confidence < 0.4).length;
      const avgConfidence =
        stats.reduce((sum, s) => sum + s.confidence, 0) / Math.max(1, stats.length);

      return {
        stats,
        analytics: {
          totalProcessed: stats.length,
          avgConfidence: avgConfidence.toFixed(2),
          lowConfidenceCount,
          lowConfidencePercentage: ((lowConfidenceCount / stats.length) * 100).toFixed(1),
          totalLeadsExtracted: stats.reduce((sum, s) => sum + s.leadsExtracted, 0),
        },
      };
    } catch (error) {
      console.error("Error fetching PDF analytics:", error);
      return { stats: [], analytics: {} };
    }
  }

  /**
   * Alert if low confidence PDFs exceed threshold
   */
  static async checkPdfQualityThreshold(userId: string, threshold = 0.4, maxPercentage = 0.2) {
    try {
      const { analytics } = await this.getPdfAnalytics(userId, 50);
      const lowPercentage = parseFloat(analytics.lowConfidencePercentage || "0") / 100;

      if (lowPercentage > maxPercentage) {
        console.warn(
          `🚨 ALERT: PDF quality issue for user ${userId}. ${analytics.lowConfidenceCount}/${analytics.totalProcessed} PDFs have confidence < ${threshold}`
        );

        // Return alert for frontend
        return {
          shouldAlert: true,
          message: `${analytics.lowConfidenceCount} of ${analytics.totalProcessed} recent PDFs have low confidence. Consider verifying data quality.`,
          percentage: lowPercentage,
        };
      }

      return { shouldAlert: false };
    } catch (error) {
      console.error("Error checking PDF quality:", error);
      return { shouldAlert: false };
    }
  }
}
