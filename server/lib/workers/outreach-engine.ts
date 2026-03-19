
import { db } from '../../db.js';
import {
  outreachCampaigns,
  campaignLeads,
  leads,
  messages,
  integrations,
  campaignEmails,
  users,
  type Integration
} from '../../../shared/schema.js';
import { eq, and, or, sql, lte, desc, ne, isNull, lt } from 'drizzle-orm';
import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { generateExpertOutreach } from '../ai/conversation-ai.js';
import { wsSync } from '../websocket-sync.js';
import { workerHealthMonitor } from '../monitoring/worker-health.js';
import { AuditTrailService } from '../audit-trail-service.js';
import { sendInstagramOutreach } from '../channels/instagram.js';
import { decryptToJSON } from '../crypto/encryption.js';
import { hasRedis } from '../queues/redis-config.js';
import { mailboxHealthService } from '../email/mailbox-health-service.js';

export class OutreachEngine {
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly TICK_INTERVAL_MS = 30000; // Reduced frequency to 30s to prevent Redis hammering
  private activeUserProcessing: Set<string> = new Set();
  private readonly MAX_CONCURRENT_USERS = 5000;
  private userMailboxIndex: Map<string, number> = new Map(); // Tracks rotating mailbox index per user

  /**
   * Start the outreach engine
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀 Outreach Engine started (multi-mode)');

    // Direct interval for traditional hosting
    this.interval = setInterval(() => this.tick(), this.TICK_INTERVAL_MS);
    this.tick(); // Run immediately
  }

  /**
   * Stop the engine
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Outreach Engine stopped');
  }

  /**
   * Single tick for serverless / manual trigger
   */
  async tick(): Promise<{ processed: number; errors: number }> {
    const results = { processed: 0, errors: 0 };
    if (!db) return results;

    try {
      const { outreachQueue } = await import('../queues/outreach-queue.js');

      // 1. Find all users with active and connected email integrations
      const activeIntegrations = await db
        .select({
          userId: integrations.userId,
          provider: integrations.provider,
        })
        .from(integrations)
        .where(
          and(
            eq(integrations.connected, true),
            or(
              eq(integrations.provider, 'custom_email'),
              eq(integrations.provider, 'gmail'),
              eq(integrations.provider, 'outlook'),
              eq(integrations.provider, 'instagram')
            )
          )
        );

      const uniqueUserIds = [...new Set((activeIntegrations as any).map((i: any) => i.userId))] as string[];

      // 2. Enqueue jobs into BullMQ for highly-concurrent processing
      const userBatch = uniqueUserIds.slice(0, this.MAX_CONCURRENT_USERS);

      for (const userId of userBatch) {
        if (outreachQueue) {
          // Enqueue ONLY autonomous tasks for the user.
          // Campaigns are now handled independently by campaign-queue.ts (repeatable per mailbox)
          await outreachQueue.add(`outreach-autonomous-${userId}`, { userId, type: 'autonomous' }, {
            jobId: `outreach-autonomous-${userId}-${Math.floor(Date.now() / 60000)}`,
            removeOnComplete: true
          });
        } else {
          // Fallback to inline processing if Redis is disabled
          await this.processUserOutreach(userId).catch(console.error);
        }
      }

      workerHealthMonitor.recordSuccess('outreach-engine');
    } catch (error: any) {
      console.error('[OutreachEngine] Global tick error:', error);
      workerHealthMonitor.recordError('outreach-engine', error?.message || 'Unknown tick error');
      results.errors++;
    }

    return results;
  }

  /**
   * Process outreach for a single user (Campaign + Autonomous)
   */
  private async processUserOutreach(userId: string): Promise<void> {
    this.activeUserProcessing.add(userId);
    try {
      // --- FAULT TOLERANCE: Plan Expiry Check ---
      const isPlanActive = await mailboxHealthService.isPlanActive(userId);
      if (!isPlanActive) {
        console.warn(`[OutreachEngine] skipping user ${userId} - Plan expired/inactive`);
        return;
      }

      // --- PART 0: Inventory Distribution ---
      // ... (rest same)

      // --- PART 0: Inventory Distribution ---
      // Automatically distribute leads from the Inventory pool to mailboxes with capacity.
      // This ensures mailboxes are always "primed" even without an active campaign.
      try {
        const { distributeLeadsFromPool } = await import('../sales-engine/outreach-engine.js');
        await distributeLeadsFromPool(userId);
      } catch (distErr) {
        console.error('[OutreachEngine] Background lead distribution failed:', distErr);
      }

      // --- PART 1: Structured Campaigns ---
      const processedCampaign = await this.tickCampaigns(userId).catch(err => {
        console.error(`[OutreachEngine] tickCampaigns failed for ${userId}:`, err.message);
        return false;
      });
      if (processedCampaign) return; // Campaign processing usually uses its own delay logic

      // --- PART 2: Autonomous AI Outreach ---
      // If no campaign was processed, check for individual "new" leads with AI enabled
      await this.tickAutonomousOutreach(userId).catch(err => {
        console.error(`[OutreachEngine] tickAutonomousOutreach failed for ${userId}:`, err.message);
      });

    } finally {
      // Emit stats refresh for instant KPI updates on dashboard
      wsSync.notifyStatsUpdated(userId);
      this.activeUserProcessing.delete(userId);
    }
  }

  /**
   * Logic for structured campaigns.
   * When BullMQ is available, campaign processing is handled by dedicated
   * per-mailbox workers in campaign-queue.ts — this method is skipped.
   * When Redis is unavailable, this runs inline as a fallback.
   */
  public async tickCampaigns(userId: string): Promise<boolean> {
    // When BullMQ is active, campaign processing is fully autonomous via campaign-queue.ts
    // Each mailbox has its own repeatable job — no need for polling here.
    if (hasRedis) return false;

    // --- FALLBACK: Inline processing when Redis is unavailable ---
    // Find active campaigns for this user
    const campaigns = await db
      .select()
      .from(outreachCampaigns)
      .where(and(eq(outreachCampaigns.userId, userId), eq(outreachCampaigns.status, 'active')));

    if (campaigns.length === 0) return false;

    // Pick campaign to process (rotate by updatedAt)
    const sortedCampaigns = campaigns.sort((a: any, b: any) =>
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );

    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    let campaign = null;
    for (const c of sortedCampaigns) {
      if (isWeekend && c.excludeWeekends) continue;
      campaign = c;
      break;
    }

    if (!campaign) return false;

    // Get up to 2000 leads to process in batches
    const nextLeadsResult = await db.select({
      campaignLead: campaignLeads,
      lead: leads
    })
      .from(campaignLeads)
      .innerJoin(leads, eq(campaignLeads.leadId, leads.id))
      .where(
        and(
          eq(campaignLeads.campaignId, campaign.id),
          or(
            // Logic for normal pending outreach/follow-up
            and(
              or(eq(campaignLeads.status, 'pending'), eq(campaignLeads.status, 'sent')),
              or(isNull(campaignLeads.nextActionAt), lte(campaignLeads.nextActionAt, new Date())),
              eq(leads.aiPaused, false),
              ne(leads.status, 'replied'),
              ne(leads.status, 'booked'),
              ne(leads.status, 'converted'),
              ne(leads.status, 'not_interested')
            ),
            // Logic for Auto-Reply Trigger
            and(
              eq(campaignLeads.status, 'replied'),
              sql`${campaignLeads.metadata}->>'pendingAutoReply' = 'true'`,
              lte(campaignLeads.nextActionAt, new Date())
            )
          )
        )
      )
      .orderBy(
        // Priority 1: Auto-Replies (highest)
        sql`CASE WHEN ${campaignLeads.metadata}->>'pendingAutoReply' = 'true' THEN 0 ELSE 1 END`,
        // Priority 2: Follow-ups (higher than new outreach)
        sql`CASE WHEN ${campaignLeads.currentStep} > 1 THEN 0 ELSE 1 END`,
        // Then by scheduled time
        campaignLeads.nextActionAt
      )
      .limit(2000);

    if (nextLeadsResult.length === 0) {
      // (Optional skip check logic remains same)
      return false;
    }

    let sentInThisTick = 0;
    const MAX_SENDS_PER_TICK = 10;

    for (const row of nextLeadsResult) {
      if (sentInThisTick >= MAX_SENDS_PER_TICK) break;

      const leadEntry = (row as any).campaignLead || row;
      const lead = (row as any).lead || row;

      if (!lead || (!lead.email && lead.channel === 'email')) continue;

      // GET THE ASSIGNED MAILBOX FOR THIS LEAD
      const integrationId = leadEntry.integrationId;
      if (!integrationId) continue; // Should have been assigned during launch

      const integration = await storage.getIntegrationById(integrationId);
      if (!integration || !integration.connected) continue;

      const isHighPriority = leadEntry.currentStep >= 1 || leadEntry.metadata?.pendingAutoReply === true;
      const isReady = await this.isMailboxReadyToSend(userId, integration, campaign, isHighPriority);
      if (!isReady) continue;

      // Process delivery
      try {
        if (lead.channel === 'instagram') {
          await this.deliverCampaignInstagram(userId, campaign, lead, leadEntry);
          sentInThisTick++;
        } else {
          await this.deliverCampaignEmail(userId, campaign, lead, leadEntry, integration.id);
          sentInThisTick++;
        }
      } catch (err) {
        console.error(`[OutreachEngine] Campaign delivery failed for ${lead.email || lead.id}:`, err);
      }
    }
    return sentInThisTick > 0;
  }

  /**
   * Logic for autonomous AI outreach (replacing outreach-worker.ts)
   */
  public async tickAutonomousOutreach(userId: string): Promise<void> {
    // We check readiness per lead

    // Get leads with status 'new', channel 'email', and AI explicitly enabled
    // Autonomous outreach MUST NOT start automatically just because a lead is 'new'
    const userLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.userId, userId),
          eq(leads.status, 'new'),
          or(eq(leads.channel, 'email'), eq(leads.channel, 'instagram')),
          eq(leads.aiPaused, false),
          // Strictly honor AI Outreach Consent - Leads must explicitly opt-in
          sql`(${leads.metadata}->>'ai_outreach_consent')::boolean = true`
        )
      )
      .limit(50); // Increased batch for autonomous outreach scalability

    let sentInThisTick = 0;
    const MAX_AUTONOMOUS_PER_TICK = 10;

    for (const lead of userLeads) {
      if (sentInThisTick >= MAX_AUTONOMOUS_PER_TICK) break;
      if (!lead.email) continue;

      // Safety: Double check if already contacted
      const alreadyContacted = await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(eq(messages.leadId, lead.id), eq(messages.direction, 'outbound')))
        .limit(1);

      if (alreadyContacted.length > 0) {
        continue;
      }

      // Check readiness and get a mailbox
      const mailbox = await this.getNextAvailableMailbox(userId);
      if (!mailbox) {
        continue;
      }

      // Process autonomous outreach
      try {
        if (lead.channel === 'instagram') {
          await this.deliverAutonomousInstagram(userId, lead);
          sentInThisTick++;
        } else {
          await this.deliverAutonomousOutreach(userId, lead, mailbox.id);
          sentInThisTick++;
        }
      } catch (err) {
        console.error(`[OutreachEngine] Autonomous outreach failed for ${lead.email || lead.id}:`, err);
      }
    }
  }

  /**
   * Public helper to get allowed mailboxes for a user based on their plan
   */
  public async getAvailableMailboxes(userId: string): Promise<Integration[]> {
    const allInts = await storage.getIntegrations(userId);
    const mailboxes = allInts.filter(i =>
      ['custom_email', 'gmail', 'outlook'].includes(i.provider) && i.connected
    );

    const user = await storage.getUser(userId);
    const plan = (user as any)?.subscriptionPlan?.toLowerCase() || 'starter';

    let limit = 3;
    if (plan === 'enterprise') limit = 10;
    else if (plan === 'pro') limit = 5;
    else if (plan === 'starter') limit = 3;

    return mailboxes.slice(0, limit).sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Selection of the next mailbox using round-robin rotation, respecting limits
   */
  private async getNextAvailableMailbox(userId: string, campaign?: any): Promise<Integration | undefined> {
    const allInts = await storage.getIntegrations(userId);
    const mailboxes = allInts.filter(i =>
      ['custom_email', 'gmail', 'outlook'].includes(i.provider) && i.connected
    );

    if (mailboxes.length === 0) return undefined;

    // Plan-based limit check
    let activeMailboxes = await this.getAvailableMailboxes(userId);
    if (activeMailboxes.length === 0) return undefined;

    // Filter by campaign config if user specifically selected mailboxes
    const allowedMailboxIds = campaign?.config?.mailboxIds;
    if (Array.isArray(allowedMailboxIds) && allowedMailboxIds.length > 0) {
      activeMailboxes = activeMailboxes.filter(mb => allowedMailboxIds.includes(mb.id));
      if (activeMailboxes.length === 0) return undefined;
    }

    // Get start index for rotation
    let startIndex = this.userMailboxIndex.get(userId) || 0;
    if (startIndex >= activeMailboxes.length) startIndex = 0;

    // Try each mailbox starting from index
    for (let i = 0; i < activeMailboxes.length; i++) {
      const idx = (startIndex + i) % activeMailboxes.length;
      const mailbox = activeMailboxes[idx];

      if (await this.isMailboxReadyToSend(userId, mailbox, campaign)) {
        // Update rotation index for next time
        this.userMailboxIndex.set(userId, (idx + 1) % activeMailboxes.length);
        return mailbox;
      }
    }

    return undefined;
  }

  /**
   * Checks daily limits and mandatory randomized delays for a specific mailbox
   */
  private async isMailboxReadyToSend(userId: string, integration: Integration, campaign?: any, isHighPriority: boolean = false): Promise<boolean> {
    const meta = decryptToJSON(integration.encryptedMeta) || {};
    
    // Default safe limits by provider type
    let defaultLimit = 50;
    if (integration.provider === 'custom_email') defaultLimit = 250;
    else if (integration.provider === 'outlook') defaultLimit = 50;
    else if (integration.provider === 'gmail') defaultLimit = 50;
    
    let mailboxDailyLimit = meta.dailyLimit ? Number(meta.dailyLimit) : defaultLimit;
    
    // Override with campaign-specific limit if provided
    if (campaign?.config?.mailboxLimits && campaign.config.mailboxLimits[integration.id]) {
      mailboxDailyLimit = Number(campaign.config.mailboxLimits[integration.id]);
    }

    // High Priority (Follow-ups/Auto-Replies) can vastly exceed the initial send limit (e.g., up to 300)
    // To ensure active fluid conversations don't get stuck due to initial outreach limits.
    const baseEffectiveLimit = isHighPriority ? Math.max(300, mailboxDailyLimit * 5) : mailboxDailyLimit;

    // --- Autonomous Adaptive Reputation Limits ---
    let effectiveLimit = baseEffectiveLimit;
    if (integration.provider !== 'instagram') {
      try {
        // Fetch real-time health for this specific integration/mailbox
        const domainVerifications = await storage.getDomainVerifications(userId, 10);
        let activeVerifications = domainVerifications;
        if (integration.encryptedMeta) {
           const meta = decryptToJSON(integration.encryptedMeta) || {};
           const email = meta.user || meta.email || '';
           if (email && email.includes('@')) {
               const d = email.split('@')[1];
               activeVerifications = activeVerifications.filter(v => v.domain === d);
           }
        }
        
        // Deduplicate the same way the dashboard does
        const uniqueVerifications = new Map();
        for (const v of activeVerifications) {
          if (!uniqueVerifications.has(v.domain)) {
            uniqueVerifications.set(v.domain, v);
          }
        }
        activeVerifications = Array.from(uniqueVerifications.values());
        
        const unverifiedDomains = activeVerifications.filter(v => {
          const result = v.verification_result as any;
          return result && result.overallStatus !== 'excellent' && result.overallStatus !== 'good';
        }).length;
        
        let recentBounces = [];
        try {
          recentBounces = await storage.getRecentBounces(userId, 168);
        } catch (e) {}
        
        const hardBounces = recentBounces.filter(b => b.bounceType === 'hard').length;
        const softBounces = recentBounces.filter(b => b.bounceType === 'soft').length;
        const spamBounces = recentBounces.filter(b => b.bounceType === 'spam').length;
        
        let reputationScore = 100;
        const stats = await storage.getDashboardStats(userId, { integrationId: integration.id });
        if (stats.totalLeads > 0) {
          const bounceRate = ((hardBounces + spamBounces) / stats.totalLeads) * 100;
          const bouncePenalty = (hardBounces * 10) + (softBounces * 2) + (spamBounces * 15);
          reputationScore = Math.max(0, 100 - bouncePenalty - (bounceRate * 3));
          if (stats.totalLeads > 100 && bounceRate < 2) {
            reputationScore = Math.min(100, reputationScore + 5);
          }
        }
        
        const healthPenalty = (unverifiedDomains * 15);
        const domainHealth = Math.max(0, reputationScore - healthPenalty);
        
        // Apply Autonomous Adaptive Thresholds
        if (domainHealth < 30) {
           // CRITICAL OVERRIDE: Automatically restrict to 5 safely
           effectiveLimit = Math.min(5, effectiveLimit);
           console.log(`[OutreachEngine] ⚠️ CRITICAL DOMAIN HEALTH (${domainHealth}) for ${integration.id}. Sending drastically reduced to ${effectiveLimit}.`);
        } else if (domainHealth < 55) {
           // POOR/CAUTIOUS OVERRIDE: Automatically restrict by half safely
           effectiveLimit = Math.max(5, Math.floor(effectiveLimit / 2));
           console.log(`[OutreachEngine] ⚠️ CAUTIOUS DOMAIN HEALTH (${domainHealth}) for ${integration.id}. Sending auto-reduced to ${effectiveLimit}.`);
        }
      } catch (err) {
        console.error(`[OutreachEngine] Error assessing domain health for limit adaptation:`, err);
      }
    }

    const channel = integration.provider === 'instagram' ? 'instagram' : 'email';

    // Calculate safe dynamic rate for non-stop delivery over 24 hours
    let finalMailboxLimit = mailboxDailyLimit;

    // --- Peak Hour Analysis ---
    const now = new Date();
    const currentHour = now.getHours();

    // Fetch analytics summary for the user to find bestReplyHour
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let bestHour = 14; // Default to 2 PM if unknown
    try {
      const analytics = await storage.getAnalyticsSummary(userId, thirtyDaysAgo);
      bestHour = analytics?.summary?.bestReplyHour || 14;
    } catch (e) {
      console.warn(`[OutreachEngine] Could not fetch analytics for user ${userId}, using default peak hour`);
    }

    // Check if we are in the peak window (+/- 1 hour from bestHour)
    const isPeakHour = Math.abs(currentHour - bestHour) <= 1 || Math.abs(currentHour - (bestHour + 24)) <= 1;

    // Adaptive frequency: During peak hours, we can send more aggressively (up to 3x base rate)
    // but we still respect the daily total cap.
    const peakMultiplier = isPeakHour ? 3 : 1;
    const baseSendsPerHour = Math.max(1, Math.ceil(mailboxDailyLimit / 24));

    // Cap at 50/hour for new safety, 100/hr for high-priority replies
    const targetSendsPerHour = Math.min(baseSendsPerHour * peakMultiplier, isHighPriority ? 100 : 50);

    // 1. Cooldown check (using integrationId if available)
    const lastSentResult = await db.execute(sql`
        SELECT created_at FROM messages 
        WHERE user_id = ${userId} 
        AND direction = 'outbound' 
        AND (metadata->>'integrationId' = ${integration.id} OR (provider = ${integration.provider} AND metadata->>'integrationId' IS NULL))
        ORDER BY created_at DESC LIMIT 1
    `);

    if (lastSentResult.rows.length > 0) {
      const lastSentAt = new Date(lastSentResult.rows[0].created_at as string).getTime();
      let minDelayMs = 30000;

      if (channel === 'instagram') {
        minDelayMs = (5 + Math.random() * 5) * 60 * 1000;
      } else {
        // Dynamic delay spacing based on targetSendsPerHour to distribute evenly across the hour
        const baseDelayMs = (60 * 60 * 1000) / (targetSendsPerHour || 1);
        // Add +/- 15% random jitter to avoid predictable bot patterns
        minDelayMs = baseDelayMs * 0.85 + (Math.random() * baseDelayMs * 0.3);
      }

      if (Date.now() - lastSentAt < minDelayMs) {
        return false;
      }
    }

    // 2. Hourly Rate Limit Check (safety constraint)
    const sentLastHourResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM messages 
      WHERE user_id = ${userId} 
      AND direction = 'outbound'
      AND (metadata->>'integrationId' = ${integration.id} OR metadata->>'integration_id' = ${integration.id})
      AND created_at >= NOW() - INTERVAL '1 hour'
    `);

    if (Number(sentLastHourResult.rows[0].count) >= targetSendsPerHour) {
      return false; // Wait for next slot
    }

    // 3. Global/User Daily Limits & Autonomous Mode
    try {
      if (!campaign) {
        // Only enforce autonomous mode check for fully autonomous tick (no specific campaign)
        const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (userResult[0]) {
          const config = (userResult[0].config as any) || {};
          const isAutonomousMode = config.autonomousMode === true;
          if (!isAutonomousMode) return false;
        }
      }
    } catch (e) { }

    // 4. Daily Limit Hit Check
    const sentTodayResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM messages 
      WHERE user_id = ${userId} 
      AND direction = 'outbound'
      AND (metadata->>'integrationId' = ${integration.id} OR metadata->>'integration_id' = ${integration.id})
      AND created_at >= CURRENT_DATE::timestamp
    `);
    const sentToday = Number(sentTodayResult.rows[0].count);

    if (sentToday >= effectiveLimit) {
      return false;
    }

    // Also respect campaign-specific limit if provided
    if (campaign?.config?.dailyLimit) {
      const campaignSentToday = await db.execute(sql`
            SELECT COUNT(*) as count FROM messages 
            WHERE user_id = ${userId} 
            AND metadata->>'campaignId' = ${campaign.id}
            AND direction = 'outbound'
            AND created_at >= CURRENT_DATE::timestamp
        `);
      if (Number(campaignSentToday.rows[0].count) >= campaign.config.dailyLimit) return false;
    }

    return true;
  }

  /**
   * Helper to deliver campaign email
   */
  private async deliverCampaignEmail(userId: string, campaign: any, lead: any, leadEntry: any, integrationId: string): Promise<void> {
    console.log(`[OutreachEngine] Delivering campaign "${campaign.name}" step ${leadEntry.currentStep} to ${lead.email} using mailbox ${integrationId}`);

    // Generate content
    let subject = (campaign.template as any).subject || "Contacting you";
    let body = (campaign.template as any).body;

    // --- AUTO-REPLY LOGIC ---
    if (leadEntry.metadata?.pendingAutoReply) {
      body = (campaign.template as any).autoReplyBody || "Thanks for your reply! We'll get back to you soon.";
      subject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
    } else if (leadEntry.currentStep > 0) {
      const followups = (campaign.template as any)?.followups || [];
      const fuConfig = followups[leadEntry.currentStep - 1];
      if (fuConfig) {
        body = fuConfig.body;
        const fuSubject = fuConfig.subject || subject;
        subject = fuSubject.toLowerCase().startsWith('re:') ? fuSubject : `Re: ${fuSubject}`;
      }
    } else {
      // For initial step, we can use AI or standard template
      const aiContent = await generateExpertOutreach(lead, userId);
      subject = aiContent.subject || subject;
      body = aiContent.body || body;
    }

    // Variable replacement fallback (Expanded for safety)
    const firstName = lead.name?.trim().split(' ')[0] || 'there';
    const company = lead.company?.trim() || 'your company';
    body = body
      .replace(/{{firstName}}/g, firstName)
      .replace(/{{lead_name}}/g, lead.name?.trim() || firstName)
      .replace(/{{company}}/g, company)
      .replace(/{{business_name}}/g, company);

    // Subject variable replacement
    subject = subject
      .replace(/{{firstName}}/g, firstName)
      .replace(/{{lead_name}}/g, lead.name?.trim() || firstName);

    // Generate a proper trackingId if not already present
    const trackingId = Math.random().toString(36).substring(2, 11);

    try {
      await sendEmail(userId, lead.email, body, subject, {
        isRaw: true,
        isHtml: true, // Force HTML for tracking pixel/links
        trackingId: campaign.config?.isManual ? undefined : trackingId,
        campaignId: campaign.id,
        leadId: lead.id,
        integrationId // Use the rotated mailbox
      });
    } catch (sendError: any) {
      const errorMsg = sendError.message || 'Unknown send error';
      console.error(`[OutreachEngine] ❌ Send failed for ${lead.email} via ${integrationId}: ${errorMsg}`);

      if (mailboxHealthService.isMailboxError(errorMsg)) {
        const integration = await storage.getIntegrationById(integrationId);
        if (integration) {
          await mailboxHealthService.handleMailboxFailure(integration, errorMsg);
        }

        // Re-queue the lead so another mailbox can pick it up (set integrationId to null and status to queued)
        await db.update(campaignLeads)
          .set({ integrationId: null, status: 'queued', error: errorMsg })
          .where(eq(campaignLeads.id, leadEntry.id));
        
        console.warn(`[OutreachEngine] 🔄 Lead ${lead.email} re-queued after mailbox failure`);
      } else {
        // Non-mailbox error (e.g. invalid recipient) — mark lead as failed
        await db.update(campaignLeads)
          .set({ status: 'failed', error: errorMsg })
          .where(eq(campaignLeads.id, leadEntry.id));
      }
      return; // Stop processing this lead
    }

    // Update lead with integrationId if not already set, to ensure future replies/tracking stay with this mailbox
    if (!lead.integrationId) {
      await db.update(leads)
        .set({ integrationId, updatedAt: new Date() })
        .where(eq(leads.id, lead.id));
    }

    // Recording and state updates
    await storage.createMessage({
      userId,
      leadId: lead.id,
      provider: 'email',
      direction: 'outbound',
      subject,
      body,
      trackingId,
      metadata: { campaignId: campaign.id, step: leadEntry.currentStep, integrationId }
    });

    // Detailed campaign tracking
    await db.insert(campaignEmails).values({
      campaignId: campaign.id,
      leadId: lead.id,
      userId: userId,
      messageId: trackingId,
      subject,
      body,
      stepIndex: leadEntry.currentStep,
      status: 'sent'
    });

    // Update campaign lead status
    const isAutoReply = !!leadEntry.metadata?.pendingAutoReply;
    const newMetadata = { ...(leadEntry.metadata || {}) };
    if (isAutoReply) delete newMetadata.pendingAutoReply;

    const nextStep = isAutoReply ? leadEntry.currentStep : leadEntry.currentStep + 1;
    const followupsArr = (campaign.template as any)?.followups || [];
    const hasMore = nextStep <= followupsArr.length;
    let nextActionAt = null;

    if (hasMore && !isAutoReply) {
      const delayDays = followupsArr[nextStep - 1]?.delayDays || 3;
      nextActionAt = new Date();
      nextActionAt.setDate(nextActionAt.getDate() + delayDays);
    }

    await db.update(campaignLeads)
      .set({
        status: isAutoReply ? 'replied' : 'sent',
        currentStep: nextStep,
        nextActionAt: nextActionAt,
        sentAt: new Date(),
        error: null,
        metadata: newMetadata
      })
      .where(eq(campaignLeads.id, leadEntry.id));

    // Update campaign stats
    await db.update(outreachCampaigns)
      .set({
        stats: sql`jsonb_set(stats, '{sent}', (COALESCE((stats->>'sent')::int, 0) + 1)::text::jsonb)`,
        updatedAt: new Date()
      })
      .where(eq(outreachCampaigns.id, campaign.id));

    wsSync.notifyLeadsUpdated(userId, { leadId: lead.id, action: 'campaign_sent' });
    wsSync.notifyCampaignStatsUpdated(userId, campaign.id);
    wsSync.notifyInsightsUpdated(userId);
  }

  /**
   * Helper to deliver autonomous outreach
   */
  private async deliverAutonomousOutreach(userId: string, lead: any, integrationId: string): Promise<void> {
    console.log(`[OutreachEngine] Delivering autonomous outreach to ${lead.email} via ${integrationId}`);

    const user = await storage.getUser(userId);
    const businessName = user?.company || user?.businessName || 'Our Team';

    const aiContent = await generateExpertOutreach(lead, userId);
    const trackingId = Math.random().toString(36).substring(2, 11);

    try {
      await sendEmail(userId, lead.email, aiContent.body, aiContent.subject, {
        isRaw: true,
        isHtml: true, // Force HTML for tracking
        trackingId,
        leadId: lead.id,
        integrationId
      });
    } catch (sendError: any) {
      const errorMsg = sendError.message || 'Unknown send error';
      console.error(`[OutreachEngine] ❌ Autonomous send failed for ${lead.email} via ${integrationId}: ${errorMsg}`);

      if (mailboxHealthService.isMailboxError(errorMsg)) {
        const integration = await storage.getIntegrationById(integrationId);
        if (integration) {
          await mailboxHealthService.handleMailboxFailure(integration, errorMsg);
        }
      }
      
      // Mark lead as failed for now, won't retry in same tick
      await db.update(leads)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(leads.id, lead.id));
      
      return; // Stop
    }

    await storage.createMessage({
      userId,
      leadId: lead.id,
      provider: 'email',
      direction: 'outbound',
      subject: aiContent.subject,
      body: aiContent.body,
      trackingId, // Save the tracking ID
      metadata: { autonomous: true, integrationId }
    });

    await storage.updateLead(lead.id, {
      status: 'open',
      lastMessageAt: new Date(),
      metadata: {
        ...(lead.metadata as Record<string, any>),
        outreach_sent: true,
        outreach_at: new Date().toISOString()
      }
    });

    wsSync.notifyLeadsUpdated(userId, { leadId: lead.id, action: 'autonomous_sent' });
    wsSync.notifyInsightsUpdated(userId);
    wsSync.notifyActivityUpdated(userId, {
      type: 'autonomous_outreach',
      leadId: lead.id,
      title: 'Autonomous Outreach Sent',
      message: `AI sent a message to ${lead.name || lead.email}`
    });
  }

  /**
   * Helper to deliver campaign Instagram message
   */
  private async deliverCampaignInstagram(userId: string, campaign: any, lead: any, leadEntry: any): Promise<void> {
    const instagramId = (lead.metadata as any)?.instagramId || lead.externalId;
    if (!instagramId) {
      throw new Error(`No Instagram ID found for lead ${lead.id}`);
    }

    console.log(`[OutreachEngine] Delivering IG campaign "${campaign.name}" step ${leadEntry.currentStep} to ${lead.name}`);

    // Generate content
    const aiContent = await generateExpertOutreach(lead, userId);
    let body = aiContent.body;

    if (leadEntry.currentStep > 0) {
      const followups = (campaign.template as any)?.followups || [];
      const fuConfig = followups[leadEntry.currentStep - 1];
      if (fuConfig) body = fuConfig.body;
    }

    // Variable replacement
    const firstName = lead.name?.trim().split(' ')[0] || 'there';
    body = body.replace(/{{firstName}}/g, firstName).replace(/{{lead_name}}/g, lead.name?.trim() || firstName);

    // Send Instagram DM
    await sendInstagramOutreach(userId, instagramId, body);

    // Recording and state updates
    await storage.createMessage({
      userId,
      leadId: lead.id,
      provider: 'instagram',
      direction: 'outbound',
      body,
      metadata: { campaignId: campaign.id, step: leadEntry.currentStep }
    });

    // Update campaign lead status
    const nextStep = leadEntry.currentStep + 1;
    const followupsArr = (campaign.template as any)?.followups || [];
    const hasMore = nextStep <= followupsArr.length;
    let nextActionAt = null;

    if (hasMore) {
      const delayDays = followupsArr[nextStep - 1]?.delayDays || 3;
      nextActionAt = new Date();
      nextActionAt.setDate(nextActionAt.getDate() + delayDays);
    }

    await db.update(campaignLeads)
      .set({
        status: 'sent',
        currentStep: nextStep,
        nextActionAt: nextActionAt,
        sentAt: new Date(),
        error: null
      })
      .where(eq(campaignLeads.id, leadEntry.id));

    // Update stats
    await db.update(outreachCampaigns)
      .set({
        stats: sql`jsonb_set(stats, '{sent}', (COALESCE((stats->>'sent')::int, 0) + 1)::text::jsonb)`,
        updatedAt: new Date()
      })
      .where(eq(outreachCampaigns.id, campaign.id));

    wsSync.notifyLeadsUpdated(userId, { leadId: lead.id, action: 'campaign_sent' });
    wsSync.notifyCampaignStatsUpdated(userId, campaign.id);
    wsSync.notifyInsightsUpdated(userId);
  }

  /**
   * Helper to deliver autonomous Instagram outreach
   */
  private async deliverAutonomousInstagram(userId: string, lead: any): Promise<void> {
    const instagramId = (lead.metadata as any)?.instagramId || lead.externalId;
    if (!instagramId) return;

    console.log(`[OutreachEngine] Delivering autonomous IG outreach to ${lead.name}`);

    const aiContent = await generateExpertOutreach(lead, userId);

    await sendInstagramOutreach(userId, instagramId, aiContent.body);

    await storage.createMessage({
      userId,
      leadId: lead.id,
      provider: 'instagram',
      direction: 'outbound',
      body: aiContent.body,
      metadata: { autonomous: true }
    });

    await storage.updateLead(lead.id, {
      status: 'open',
      lastMessageAt: new Date(),
      metadata: {
        ...(lead.metadata as Record<string, any>),
        outreach_sent: true,
        outreach_at: new Date().toISOString()
      }
    });

    wsSync.notifyLeadsUpdated(userId, { leadId: lead.id, action: 'autonomous_sent' });
    wsSync.notifyStatsUpdated(userId);
    wsSync.notifyInsightsUpdated(userId);
  }
}

export const outreachEngine = new OutreachEngine();
