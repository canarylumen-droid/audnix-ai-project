
import { db } from '../../db.js';
import { 
  outreachCampaigns, 
  campaignLeads, 
  leads, 
  messages, 
  integrations, 
  campaignEmails,
  users 
} from '../../../shared/schema.js';
import { eq, and, or, sql, lte, desc, ne, isNull } from 'drizzle-orm';
import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { generateExpertOutreach } from '../ai/conversation-ai.js';
import { wsSync } from '../websocket-sync.js';
import { workerHealthMonitor } from '../monitoring/worker-health.js';

export class OutreachEngine {
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly TICK_INTERVAL_MS = 15000; // 15 seconds for more responsive "live" feel
  private activeUserProcessing: Set<string> = new Set();

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
              eq(integrations.provider, 'outlook')
            )
          )
        );

      const uniqueUserIds = [...new Set(activeIntegrations.map(i => i.userId))];

      // 2. Process each user (non-blocking)
      for (const userId of uniqueUserIds) {
        if (this.activeUserProcessing.has(userId)) continue;

        // Note: In serverless mode, we might want to wait for these.
        // But for the background worker, we let them run in parallel.
        this.processUserOutreach(userId).catch(err => {
          console.error(`[OutreachEngine] Error for user ${userId}:`, err);
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
   * Process outreach for a single user (Campaing + Autonomous)
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
      this.activeUserProcessing.delete(userId);
    }
  }

  /**
   * Logic for structured campaigns (replacing campaign-worker.ts)
   */
  private async tickCampaigns(userId: string): Promise<boolean> {
    // Find active campaigns for this user
    const campaigns = await db
      .select()
      .from(outreachCampaigns)
      .where(and(eq(outreachCampaigns.userId, userId), eq(outreachCampaigns.status, 'active')));

    if (campaigns.length === 0) return false;

    // Split logic: Process one campaign per tick to avoid overwhelming user SMTP
    // We'll pick the one that was updated least recently (round-robin feel)
    const campaign = campaigns.sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    )[0];

    // Check daily limits and delays
    if (!(await this.isUserReadyToSend(userId, campaign))) return false;

    // Find next lead in this campaign
    const nextLeadResult = await db.select()
      .from(campaignLeads)
      .where(
        and(
          eq(campaignLeads.campaignId, campaign.id),
          or(
            eq(campaignLeads.status, 'pending'),
            and(
              eq(campaignLeads.status, 'failed'),
              sql`${campaignLeads.retryCount} < 3`,
              lte(campaignLeads.nextActionAt, new Date())
            ),
            and(
              eq(campaignLeads.status, 'sent'),
              lte(campaignLeads.nextActionAt, new Date()),
              sql`${campaignLeads.currentStep} <= ${campaign.template ? (campaign.template as any).followups?.length || 0 : 0}`
            )
          )
        )
      )
      .limit(1);

    if (nextLeadResult.length === 0) return false;

    const leadEntry = nextLeadResult[0];
    const lead = await storage.getLeadById(leadEntry.leadId);

    if (!lead || !lead.email) {
      await db.update(campaignLeads).set({ status: 'failed', error: 'Invalid lead or missing email' }).where(eq(campaignLeads.id, leadEntry.id));
      return true;
    }

    // Process delivery
    try {
        await this.deliverCampaignEmail(userId, campaign, lead, leadEntry);
        return true;
    } catch (err) {
        console.error(`[OutreachEngine] Campaign delivery failed for ${lead.email}:`, err);
        return true; 
    }
  }

  /**
   * Logic for autonomous AI outreach (replacing outreach-worker.ts)
   */
  private async tickAutonomousOutreach(userId: string): Promise<void> {
    // Check if user is ready (use global limits)
    if (!(await this.isUserReadyToSend(userId))) return;

    // Get leads with status 'new', channel 'email', and AI explicitly enabled
    const userLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.userId, userId),
            eq(leads.status, 'new'),
            eq(leads.channel, 'email'),
            eq(leads.aiPaused, false)
          )
        )
        .limit(10); // Check a few

    for (const lead of userLeads) {
        if (!lead.email) continue;

        // Safety: Double check if already contacted
        const alreadyContacted = await db
          .select({ id: messages.id })
          .from(messages)
          .where(and(eq(messages.leadId, lead.id), eq(messages.direction, 'outbound')))
          .limit(1);

        if (alreadyContacted.length > 0) continue;

        // Process autonomous outreach
        try {
            await this.deliverAutonomousOutreach(userId, lead);
            return; // Only one per tick per user
        } catch (err) {
            console.error(`[OutreachEngine] Autonomous outreach failed for ${lead.email}:`, err);
        }
    }
  }

  /**
   * Checks daily limits and mandatory randomized delays
   */
  private async isUserReadyToSend(userId: string, campaign?: any): Promise<boolean> {
    // 1. Global delay (don't blast multiple users at once if we are a small server, 
    // but here we check per-user randomized delay between 2-4 mins)
    const lastSentResult = await db.execute(sql`
        SELECT created_at FROM messages 
        WHERE user_id = ${userId} AND direction = 'outbound' 
        ORDER BY created_at DESC LIMIT 1
    `);

    if (lastSentResult.rows.length > 0) {
        const lastSentAt = new Date(lastSentResult.rows[0].created_at as string).getTime();
        
        // Random drift: 120s - 240s (2-4 minutes)
        const minDelayMs = 120000 + (Math.random() * 120000); 
        
        if (Date.now() - lastSentAt < minDelayMs) return false;
    }

    // 2. Daily limits (Campaign specific vs Global)
    let dailyLimit = 50;
    try {
        const settings = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (settings[0]) dailyLimit = (settings[0].config as any)?.dailyLimit || 50;
    } catch (e) {}

    // Overwrite with campaign limit if present
    if (campaign?.config?.dailyLimit) dailyLimit = campaign.config.dailyLimit;

    const sentTodayResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM messages 
      WHERE user_id = ${userId} 
      AND direction = 'outbound'
      AND created_at >= CURRENT_DATE::timestamp
    `);
    const sentToday = Number(sentTodayResult.rows[0].count);

    if (sentToday >= dailyLimit) return false;

    return true;
  }

  /**
   * Helper to deliver campaign email
   */
  private async deliverCampaignEmail(userId: string, campaign: any, lead: any, leadEntry: any): Promise<void> {
    console.log(`[OutreachEngine] Delivering campaign "${campaign.name}" step ${leadEntry.currentStep} to ${lead.email}`);

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
            const originalSubject = (campaign.template as any)?.subject || 'Following up';
            subject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
        }
    }

    // Variable replacement fallback
    const firstName = lead.name?.split(' ')[0] || 'there';
    body = body.replace(/{{firstName}}/g, firstName).replace(/{{lead_name}}/g, firstName);

    // Send the email (ensure plain text)
    const trackingId = Math.random().toString(36).substring(2, 11);
    await sendEmail(userId, lead.email, body, subject, { 
        isRaw: true, // Plain text for deliverability
        trackingId: campaign.config?.isManual ? undefined : trackingId,
        campaignId: campaign.id,
        leadId: lead.id
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

    // Update campaign stats
    await db.update(outreachCampaigns)
        .set({
            stats: sql`jsonb_set(stats, '{sent}', (COALESCE((stats->>'sent')::int, 0) + 1)::text::jsonb)`,
            updatedAt: new Date()
        })
        .where(eq(outreachCampaigns.id, campaign.id));

    wsSync.notifyLeadsUpdated(userId, { leadId: lead.id, action: 'campaign_sent' });
  }

  /**
   * Helper to deliver autonomous outreach
   */
  private async deliverAutonomousOutreach(userId: string, lead: any): Promise<void> {
    console.log(`[OutreachEngine] Delivering autonomous outreach to ${lead.email}`);
    
    const user = await storage.getUserById(userId);
    const businessName = user?.company || user?.businessName || 'Our Team';

    const aiContent = await generateExpertOutreach(lead, userId);
    
    await sendEmail(userId, lead.email, aiContent.body, aiContent.subject, {
        isRaw: true,
        trackingId: undefined,
        leadId: lead.id
    });

    await storage.createMessage({
        userId,
        leadId: lead.id,
        provider: 'email',
        direction: 'outbound',
        subject: aiContent.subject,
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
  }
}

export const outreachEngine = new OutreachEngine();
