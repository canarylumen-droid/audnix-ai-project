
import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { outreachCampaigns, campaignLeads, campaignEmails } from '../../../shared/schema.js';
import { eq, and, lte, sql, desc, or } from 'drizzle-orm';
import { db } from '../../db.js';
import { generateExpertOutreach } from '../ai/conversation-ai.js';

export class CampaignWorker {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private BATCH_SIZE = 5; // Process 5 leads per tick

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀 Campaign Worker started');
    // Run every 1 minute
    this.interval = setInterval(() => this.processCampaigns(), 60 * 1000);
    this.processCampaigns(); // Run immediately
  }

  stop() {
    this.isRunning = false;
    if (this.interval) clearInterval(this.interval);
    console.log('🛑 Campaign Worker stopped');
  }

  private async processCampaigns() {
    try {
      // Find active campaigns
      const campaigns = await db.select().from(outreachCampaigns).where(eq(outreachCampaigns.status, 'active'));

      for (const campaign of campaigns) {
        await this.processCampaign(campaign);
      }
    } catch (error) {
      console.error('Campaign Worker Error:', error);
    }
  }

  private async processCampaign(campaign: any) {
    // 1. Check daily limit
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    // We need to track daily sent count. schema 'stats' has total, sent.
    // We might need a separate 'daily_stats' or just reset periodically? 
    // Or check 'sentAt' of leads.

    // Efficient check: Count campaign_leads sent today
    const sentTodayResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM campaign_leads 
      WHERE campaign_id = ${campaign.id} 
      AND status = 'sent' 
      AND sent_at >= CURRENT_DATE::timestamp
    `);
    const sentToday = Number(sentTodayResult.rows[0].count);

    let dailyLimit = 1000000; // Default to a very high number if not set
    try {
      if ((campaign.config as any)?.dailyLimit) {
        dailyLimit = (campaign.config as any).dailyLimit;
      }
    } catch (e) {}

    if (sentToday >= dailyLimit) {
      // Limit reached for today
      return;
    }

    // 2. Check throttling (minDelayMinutes)
    // Find last sent lead for this campaign
    /*
    const lastSentResult = await db.select().from(campaignLeads)
      .where(and(eq(campaignLeads.campaignId, campaign.id), eq(campaignLeads.status, 'sent')))
      .orderBy(desc(campaignLeads.sentAt))
      .limit(1);
    
    if (lastSentResult.length > 0) {
      const lastSentTime = new Date(lastSentResult[0].sentAt!).getTime();
      const nextAllowedTime = lastSentTime + (campaign.config.minDelayMinutes * 60 * 1000);
      if (Date.now() < nextAllowedTime) {
        return; // Throttled
      }
    }
    */
    // Wait, if 1 minute interval, we can just send BATCH_SIZE.
    // But if delay is 2-3 mins, we should only send ONE, then wait.
    // User wants "2-3 min delay". 
    // So if I run every 1 minute, I need to check last sent.

    const lastSentResult = await db.execute(sql`
        SELECT sent_at FROM campaign_leads 
        WHERE campaign_id = ${campaign.id} AND status = 'sent' 
        ORDER BY sent_at DESC LIMIT 1
    `);

    if (lastSentResult.rows.length > 0) {
      const lastSent = new Date(lastSentResult.rows[0].sent_at as string).getTime();

      // For manual campaigns, enforce strictly 2-3 minutes random delay
      // For AI campaigns, use config or default 2 mins
      let minDelay = 0; // Default to 0 for maximum speed if user doesn't specify
      try {
        if ((campaign.config as any)?.minDelayMinutes !== undefined) {
          minDelay = (campaign.config as any).minDelayMinutes;
        }
      } catch (e) {}

      const isManual = (campaign.config as any)?.isManual === true;
      const baseDelay = isManual ? 2 : minDelay;
      const randomBuffer = isManual ? Math.random() : 0; // 0-1 minute extra

      const delayMs = (baseDelay + randomBuffer) * 60 * 1000;

      if (Date.now() - lastSent < delayMs) {
        return; // Wait more
      }
    }

    // 3. Select pending leads OR leads due for follow-up
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

    if (nextLeadResult.length === 0) {
      return;
    }

    const leadEntry = nextLeadResult[0];
    const lead = await storage.getLeadById(leadEntry.leadId);

    if (!lead || !lead.email) {
      await db.update(campaignLeads).set({ status: 'failed', error: 'Invalid lead or missing email' }).where(eq(campaignLeads.id, leadEntry.id));
      return;
    }

    // NEW: Skip leads already contacted globally if it's the first step
    if (leadEntry.currentStep === 0) {
      const globalContacted = await db.select({ id: campaignEmails.id })
        .from(campaignEmails)
        .where(eq(campaignEmails.leadId, lead.id))
        .limit(1);
      
      if (globalContacted.length > 0) {
        console.log(`[Campaign] Skipping lead ${lead.email} - already has outreach in another campaign`);
        await db.update(campaignLeads).set({ status: 'sent', currentStep: 1, sentAt: new Date(), error: 'Skipped - already contacted' }).where(eq(campaignLeads.id, leadEntry.id));
        return;
      }
    }

    // 4. Determine content based on current step
    try {
      console.log(`[Campaign] Processing step ${leadEntry.currentStep} for ${lead.email} in campaign ${campaign.name}`);

      let subject = (campaign.template as any)?.subject;
      let body = (campaign.template as any)?.body;
      let isFollowUp = leadEntry.status === 'sent';

      if (isFollowUp) {
        // Check if lead replied since last email — if so, stop further follow-ups
        const replyCheck = await db.execute(sql`
          SELECT id FROM messages
          WHERE lead_id = ${lead.id} AND direction = 'inbound'
          AND created_at > ${leadEntry.sentAt}
          LIMIT 1
        `);
        if (replyCheck.rows.length > 0) {
          console.log(`[Campaign] Lead ${lead.email} replied — stopping follow-ups`);
          await db.update(campaignLeads).set({
            status: 'replied', nextActionAt: null
          }).where(eq(campaignLeads.id, leadEntry.id));
          // Also update the lead's status
          try { await storage.updateLead(lead.id, { status: 'replied' }); } catch (e) {}
          return;
        }

        const followups = (campaign.template as any)?.followups || [];
        const followUpConfig = followups[leadEntry.currentStep - 1];
        if (!followUpConfig) {
          console.error(`[Campaign] No follow-up config for step ${leadEntry.currentStep} for lead ${lead.id}`);
          return;
        }
        body = followUpConfig.body;
        // subject usually stays the same or prepends Re:
        if (subject && !subject.startsWith('Re:')) subject = `Re: ${subject}`;
      }

      // AI Personalization (only if NOT manual)
      if (campaign.config?.isManual !== true) {
        try {
          const aiContent = await generateExpertOutreach(lead, campaign.userId);
          if (aiContent && aiContent.subject && aiContent.body) {
            subject = aiContent.subject;
            if (!isFollowUp) body = aiContent.body;
            // For follow-ups, we generally trust the template flow or AI regeneration?
            // Current simplified logic: If AI enabled, use AI.
            if (isFollowUp) body = aiContent.body;
          }
        } catch (aiError) {
          console.warn(`[Campaign] AI generation failed for ${lead.id}, falling back to template:`, aiError);
        }
      }

      // Standard Template Variable Replacement
      const firstName = lead.name?.split(' ')[0] || 'there';
      const company = lead.company || '';

      subject = subject.replace(/{{name}}/g, lead.name)
        .replace(/{{firstName}}/g, firstName)
        .replace(/{{company}}/g, company)
        .replace(/{{subject}}/g, (campaign.template as any)?.subject || '');

      body = body.replace(/{{name}}/g, lead.name)
        .replace(/{{firstName}}/g, firstName)
        .replace(/{{company}}/g, company)
        .replace(/{{subject}}/g, (campaign.template as any)?.subject || '');

      const trackingId = Math.random().toString(36).substring(2, 15);
      await sendEmail(campaign.userId, lead.email, body, subject, { trackingId, isRaw: true });

      // Record to unified messages table for Inbox visibility
      await storage.createMessage({
        userId: campaign.userId,
        leadId: lead.id,
        provider: 'email',
        direction: 'outbound',
        subject,
        body,
        trackingId,
        metadata: { campaignId: campaign.id, stepIndex: leadEntry.currentStep }
      });

      // Record to campaign_emails for detailed tracking
      await db.insert(campaignEmails).values({
        campaignId: campaign.id,
        leadId: lead.id,
        userId: campaign.userId,
        messageId: trackingId,
        subject,
        body,
        status: 'sent',
        stepIndex: leadEntry.currentStep,
        sentAt: new Date()
      });

      const { wsSync } = await import('../websocket-sync.js');
      wsSync.notifyActivityUpdated(campaign.userId, { 
        type: 'outreach_sent', 
        campaignId: campaign.id,
        leadId: lead.id 
      });

      // Create audit log for activity feed
      await storage.createAuditLog({
        userId: campaign.userId,
        leadId: lead.id,
        action: 'outreach_sent',
        details: {
          message: `Campaign email sent to ${lead.name}`,
          campaignId: campaign.id,
          subject
        }
      });

      // Update campaign level stats
      await db.update(outreachCampaigns)
        .set({
          stats: sql`jsonb_set(
            jsonb_set(stats, '{sent}', (COALESCE((stats->>'sent')::int, 0) + 1)::text::jsonb),
            '{total}', (stats->>'total')::jsonb
          )`,
          updatedAt: new Date()
        })
        .where(eq(outreachCampaigns.id, campaign.id));

      // 5. Update Status and Schedule Next Step
      const nextStep = leadEntry.currentStep + 1;
      const followups = (campaign.template as any)?.followups || [];
      const hasMoreFollowUps = followups.length > 0 && nextStep <= followups.length;

      let nextActionAt = null;
      if (hasMoreFollowUps) {
        const nextFollowUp = followups[nextStep - 1];
        const delayDays = nextFollowUp?.delayDays || 3;
        nextActionAt = new Date();
        nextActionAt.setDate(nextActionAt.getDate() + delayDays);
      }

      await db.update(campaignLeads).set({
        status: 'sent',
        currentStep: nextStep,
        nextActionAt: nextActionAt,
        sentAt: new Date(),
        error: null
      }).where(eq(campaignLeads.id, leadEntry.id));

      console.log(`[Campaign] Step ${nextStep} completed for ${lead.email}. Next action: ${nextActionAt?.toISOString() || 'None'}`);

      // If manual campaign and no more steps, mark as completed? 
      // Or just leave as 'sent' with no nextActionAt (which is effectively done)

    } catch (error: any) {
      console.error(`[Campaign] Failed lead ${lead.id}:`, error);
      
      const nextRetryCount = leadEntry.retryCount + 1;
      const backoffHours = nextRetryCount === 1 ? 1 : nextRetryCount === 2 ? 4 : 24;
      const nextRetryAt = new Date();
      nextRetryAt.setHours(nextRetryAt.getHours() + backoffHours);

      await db.update(campaignLeads).set({
        status: 'failed',
        error: error.message || 'Send failed',
        retryCount: nextRetryCount,
        nextActionAt: nextRetryCount < 3 ? nextRetryAt : null
      }).where(eq(campaignLeads.id, leadEntry.id));
    }
  }
}

export const campaignWorker = new CampaignWorker();
