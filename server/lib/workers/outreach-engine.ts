
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

export class OutreachEngine {
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly TICK_INTERVAL_MS = 1000; // 1 second for ultra-live feel and multi-user scaling
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
        // Enqueue both campaign and autonomous tasks for the user
        // Frequency: Every 10 seconds to support high-volume splitting
        await outreachQueue.add(`outreach-campaign-${userId}`, { userId, type: 'campaign' }, {
          jobId: `outreach-campaign-${userId}-${Math.floor(Date.now() / 10000)}`,
          removeOnComplete: true
        });

        await outreachQueue.add(`outreach-autonomous-${userId}`, { userId, type: 'autonomous' }, {
          jobId: `outreach-autonomous-${userId}-${Math.floor(Date.now() / 10000)}`,
          removeOnComplete: true
        });
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
      // --- PART 1: Structured Campaigns ---
      const processedCampaign = await this.tickCampaigns(userId);
      if (processedCampaign) return; // Campaign processing usually uses its own delay logic

      // --- PART 2: Autonomous AI Outreach ---
      // If no campaign was processed, check for individual "new" leads with AI enabled
      await this.tickAutonomousOutreach(userId);

    } finally {
      // Emit stats refresh for instant KPI updates on dashboard
      wsSync.notifyStatsUpdated(userId);
      this.activeUserProcessing.delete(userId);
    }
  }

  /**
   * Logic for structured campaigns (replacing campaign-worker.ts)
   */
  public async tickCampaigns(userId: string): Promise<boolean> {
    // Find active campaigns for this user
    const campaigns = await db
      .select()
      .from(outreachCampaigns)
      .where(and(eq(outreachCampaigns.userId, userId), eq(outreachCampaigns.status, 'active')));

    if (campaigns.length === 0) return false;

    // Split logic: Process one campaign per tick to avoid overwhelming user SMTP
    // We'll pick the one that was updated least recently (round-robin feel)
    const campaign = campaigns.sort((a: any, b: any) =>
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    )[0];

    // campaign.config is where we might store preferred channel, but leads have their own
    // We will check readines PER LEAD in the loop below to handle mixed-channel batches

    const nextLeadsResult = await db.select({
      campaignLead: campaignLeads,
      lead: leads
    })
      .from(campaignLeads)
      .innerJoin(leads, eq(campaignLeads.leadId, leads.id))
      .where(
        and(
          eq(campaignLeads.campaignId, campaign.id),
          // Stop outreach if lead replied, booked, or is not interested
          ne(leads.status, 'replied'),
          ne(leads.status, 'booked'),
          ne(leads.status, 'converted'),
          ne(leads.status, 'not_interested'),
          eq(leads.aiPaused, false),
          or(
            and(
              eq(campaignLeads.status, 'pending'),
              or(isNull(campaignLeads.nextActionAt), lte(campaignLeads.nextActionAt, new Date()))
            ),
            and(
              eq(campaignLeads.status, 'failed'),
              lt(campaignLeads.retryCount, 3),
              lte(campaignLeads.nextActionAt, new Date())
            ),
            and(
              eq(campaignLeads.status, 'sent'),
              lte(campaignLeads.nextActionAt, new Date()),
              lte(campaignLeads.currentStep, campaign.template ? (campaign.template as any).followups?.length || 0 : 0)
            )
          )
        )
      )
      .limit(2000); // Optimized for 2k+ leads per tick

    if (nextLeadsResult.length === 0) {
      console.log(`[OutreachEngine] No leads due for campaign: ${campaign.name} (ID: ${campaign.id})`);

      // Check if campaign is actually finished (no pending leads at all)
      const pendingCount = await db.select({ count: sql`count(*)` })
        .from(campaignLeads)
        .where(and(eq(campaignLeads.campaignId, campaign.id), eq(campaignLeads.status, 'pending')));

      if (Number((pendingCount[0] as any).count) === 0) {
        console.log(`[OutreachEngine] Campaign "${campaign.name}" has no more pending leads. Marking as completed.`);
        await db.update(outreachCampaigns)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(outreachCampaigns.id, campaign.id));

        await AuditTrailService.logCampaignAction(userId, campaign.id, 'campaign_completed');
      }
      return false;
    }

    let sentInThisTick = 0;
    const MAX_SENDS_PER_TICK = 10;

    console.log(`[OutreachEngine] Processing batch of ${nextLeadsResult.length} leads for campaign: ${campaign.name}`);
    for (const row of nextLeadsResult) {
      if (sentInThisTick >= MAX_SENDS_PER_TICK) break;

      const leadEntry = (row as any).campaignLead || row;
      const lead = (row as any).lead || row;

      if (!lead || (!lead.email && lead.channel === 'email')) {
        await db.update(campaignLeads).set({ status: 'failed', error: 'Invalid lead or missing contact info' }).where(eq(campaignLeads.id, leadEntry.id));
        continue;
      }

      // Check for ready mailbox (rotation)
      const mailbox = await this.getNextAvailableMailbox(userId, campaign);
      if (!mailbox) {
        // No mailbox is ready (limits reached or cooldown)
        continue;
      }

      // Process delivery
      try {
        if (lead.channel === 'instagram') {
          await this.deliverCampaignInstagram(userId, campaign, lead, leadEntry);
          sentInThisTick++;
        } else {
          await this.deliverCampaignEmail(userId, campaign, lead, leadEntry, mailbox.id);
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

    let limit = 1;
    if (plan === 'enterprise') limit = 5;
    else if (plan === 'pro') limit = 3;
    else if (plan === 'starter') limit = 1;

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
  private async isMailboxReadyToSend(userId: string, integration: Integration, campaign?: any): Promise<boolean> {
    const channel = integration.provider === 'instagram' ? 'instagram' : 'email';

    // Calculate safe dynamic rate for non-stop delivery over 24 hours
    let mailboxDailyLimit = 50;
    try {
      const meta = (integration as any).encryptedMeta ? null : (integration as any).metadata;
      if (meta?.dailyLimit) mailboxDailyLimit = Number(meta.dailyLimit);
    } catch (e) { }

    const sendsPerHour = Math.max(1, Math.ceil(mailboxDailyLimit / 24));

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
        // Dynamic delay spacing based on sendsPerHour to distribute evenly across the hour
        // e.g., if sendsPerHour is 2 (from 50/day), base delay is ~30 mins
        const baseDelayMs = (60 * 60 * 1000) / sendsPerHour;
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
      AND metadata->>'integrationId' = ${integration.id}
      AND created_at >= NOW() - INTERVAL '1 hour'
    `);
    if (Number(sentLastHourResult.rows[0].count) >= sendsPerHour) {
      return false; // Wait for next hour
    }

    // 3. Global/User Daily Limits & Autonomous Mode
    let userDailyLimit = 50;
    try {
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userResult[0]) {
        const config = (userResult[0].config as any) || {};
        userDailyLimit = config.dailyLimit || 50;

        const isAutonomousMode = config.autonomousMode === true;
        const isManualCampaign = campaign?.config?.isManual === true;

        if (!isAutonomousMode && !isManualCampaign) return false;
      }
    } catch (e) { }

    // 4. Daily Limit Hit Check
    const sentTodayResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM messages 
      WHERE user_id = ${userId} 
      AND direction = 'outbound'
      AND metadata->>'integrationId' = ${integration.id}
      AND created_at >= CURRENT_DATE::timestamp
    `);
    const sentToday = Number(sentTodayResult.rows[0].count);

    if (sentToday >= mailboxDailyLimit) {
      return false;
    }

    // Also respect campaign-specific limit if provided (applies to total campaign)
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
    const aiContent = await generateExpertOutreach(lead, userId);

    // Step logic (parity with campaign-worker.ts)
    let subject = aiContent.subject;
    let body = aiContent.body;
    let isFollowUp = leadEntry.currentStep > 0;

    if (isFollowUp) {
      const followups = (campaign.template as any)?.followups || [];
      const fuConfig = followups[leadEntry.currentStep - 1];
      if (fuConfig) {
        // If it's a follow-up, we use the template body but maybe AI personalized?
        // User requested "RE:" subject logic
        body = fuConfig.body;
        const originalSubject = fuConfig.subject || (campaign.template as any)?.subject || 'Following up';
        subject = originalSubject.toLowerCase().startsWith('re:') ? originalSubject : `Re: ${originalSubject}`;
      }
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

    await sendEmail(userId, lead.email, body, subject, {
      isRaw: true,
      isHtml: true, // Force HTML for tracking pixel/links
      trackingId: campaign.config?.isManual ? undefined : trackingId,
      campaignId: campaign.id,
      leadId: lead.id,
      integrationId // Use the rotated mailbox
    });

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

    await sendEmail(userId, lead.email, aiContent.body, aiContent.subject, {
      isRaw: true,
      isHtml: true, // Force HTML for tracking
      trackingId,
      leadId: lead.id,
      integrationId
    });

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
