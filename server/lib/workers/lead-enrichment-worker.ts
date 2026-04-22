import { storage } from '../../storage.js';
import { db } from '../../db.js';
import { leads, leadSocialDetails } from '../../../shared/schema.js';
import { eq, and, sql, isNull, or } from 'drizzle-orm';
import { workerHealthMonitor } from '../monitoring/worker-health.js';
import { quotaService } from '../monitoring/quota-service.js';
import { generateReply } from '../ai/ai-service.js';
import { leadScoringEngine } from '../ai/lead-scoring-engine.js';

/**
 * Lead Enrichment Worker (Phase 36)
 * 
 * Autonomously researches leads to find:
 * 1. Company size and industry.
 * 2. Recent news or initiatives.
 * 3. Priority topics for the AI outreach.
 */
export class LeadEnrichmentWorker {
  private isRunning: boolean = false;
  private isProcessing: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes

  /**
   * Start the enrichment worker
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🔍 Lead Enrichment Worker started');

    this.interval = setInterval(() => this.tick(), this.CHECK_INTERVAL_MS);
    // Use setTimeout for initial tick to avoid blocking startup
    setTimeout(() => this.tick(), 5000);
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Lead Enrichment Worker stopped');
  }

  /**
   * Main scan iteration
   */
  async tick(): Promise<void> {
    if (this.isProcessing) return;
    
    // PHASE 50: Emergency Brake Check
    const health = workerHealthMonitor.isSystemPaused();
    if (health.paused) {
      console.warn(`🛑 [LeadEnrichment] Skipping cycle - System in EMERGENCY BRAKE: ${health.reason}`);
      return;
    }

    if (quotaService.isRestricted()) {
      return;
    }

    this.isProcessing = true;

    try {
      // Find leads that need enrichment (status 'new' and not yet enriched)
      // Check metadata -> enriched flag
      const leadsToEnrich = await db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.status, 'new'),
            or(
              isNull(sql`leads.metadata->'enriched'`),
              eq(sql`leads.metadata->>'enriched'`, 'false')
            )
          )
        )
        .limit(10); // Process in small batches to stay within rate limits

      if (leadsToEnrich.length === 0) return;

      console.log(`🔍 Enriching ${leadsToEnrich.length} new leads...`);

      for (const lead of leadsToEnrich) {
        await this.enrichLead(lead);
      }

      workerHealthMonitor.recordSuccess('lead-enrichment-worker');
    } catch (error: any) {
      console.error('[LeadEnrichmentWorker] Tick error:', error);
      workerHealthMonitor.recordError('lead-enrichment-worker', error?.message || 'Unknown error');
    }
  }

  /**
   * Performs the actual enrichment using AI research
   */
  async enrichLead(lead: any): Promise<void> {
    try {
      const researchPrompt = `Perform a deep research task for this lead. 
Lead Name: ${lead.name}
Company: ${lead.company || 'Unknown'}
Email: ${lead.email || 'Unknown'}
Current Bio: ${lead.bio || 'None'}

Goal: Find three key insights about their business or role that we can use for outreach.
Return a JSON object with these fields:
- companySize: "1-10", "11-50", "51-200", "201-500", "500+" or null
- industry: string or null
- researchInsights: string[] (top 3 things we found)
- suggestedAngle: string (how should we pitch them?)
- website: string or null`;

      // Use AI to simulate/perform research (in a real prod app, you might use a Google Search API here)
      const researchResult = await generateReply("You are an expert lead researcher analyzing a prospect.", researchPrompt, { model: 'gpt-4' }).catch(() => null);
      
      if (!researchResult || typeof researchResult !== 'object' || !researchResult.text) return;

      // Extract JSON from AI response
      const aiText = researchResult.text;
      const jsonStart = aiText.indexOf('{');
      const jsonEnd = aiText.lastIndexOf('}') + 1;
      if (jsonStart === -1 || jsonEnd === 0) return;

      const data = JSON.parse(aiText.substring(jsonStart, jsonEnd));

      // Update lead metadata
      const updatedMetadata = {
        ...lead.metadata,
        enriched: true,
        enrichedAt: new Date().toISOString(),
        companySize: data.companySize,
        industry: data.industry || lead.metadata?.industry,
        insights: data.researchInsights,
        suggestedAngle: data.suggestedAngle,
        website: data.website
      };

      await storage.updateLead(lead.id, {
        metadata: updatedMetadata,
        company: lead.company || data.companyNames?.[0] || null,
        updatedAt: new Date()
      });

      // --- PHASE 38: TRIGGER SCORING AFTER ENRICHMENT ---
      await leadScoringEngine.updateAndNotify(lead.id);

      console.log(`✅ Lead enriched & scored: ${lead.name} (${data.industry || 'General'})`);

    } catch (error) {
      console.error(`❌ Failed to enrich lead ${lead.id}:`, error);
      // Mark as failed so we don't keep retrying if it's a permanent error
      await storage.updateLead(lead.id, {
        metadata: { ...lead.metadata, enrichment_failed: true, enriched: true }
      });
    }
  }
}

export const leadEnrichmentWorker = new LeadEnrichmentWorker();
