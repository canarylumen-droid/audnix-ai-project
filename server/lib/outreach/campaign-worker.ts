
import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { outreachCampaigns, campaignLeads } from '../../../shared/schema.js';
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
      AND sent_at >= CURRENT_DATE
    `);
    const sentToday = Number(sentTodayResult.rows[0].count);

    if (sentToday >= campaign.config.dailyLimit) {
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
        const delayMs = (campaign.config.minDelayMinutes || 2) * 60 * 1000;
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
                        eq(campaignLeads.status, 'sent'),
                        lte(campaignLeads.nextActionAt, new Date()),
                        sql`${campaignLeads.currentStep} < ${campaign.template.followups?.length || 0}`
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

    // 4. Determine content based on current step
    try {
        console.log(`[Campaign] Processing step ${leadEntry.currentStep} for ${lead.email} in campaign ${campaign.name}`);
        
        let subject = campaign.template.subject;
        let body = campaign.template.body;
        let isFollowUp = leadEntry.status === 'sent';

        if (isFollowUp) {
            const followUpConfig = campaign.template.followups[leadEntry.currentStep];
            if (!followUpConfig) {
                console.error(`[Campaign] No follow-up config for step ${leadEntry.currentStep} for lead ${lead.id}`);
                return;
            }
            body = followUpConfig.body;
            // subject usually stays the same or prepends Re:
            if (!subject.startsWith('Re:')) subject = `Re: ${subject}`;
        }
        
        // AI Personalization (if enabled)
        if (campaign.config?.isManual === false) {
             try {
                 const aiContent = await generateExpertOutreach(lead, campaign.userId, isFollowUp ? body : undefined);
                 if (aiContent && aiContent.subject && aiContent.body) {
                     subject = aiContent.subject;
                     if (!isFollowUp) body = aiContent.body; // Only overwrite body if not a manual-ish follow-up template body
                     // For follow-ups, we still want to keep the core body but maybe polish? 
                     // Let's trust AI more if enabled.
                     body = aiContent.body;
                 }
             } catch (aiError) {
                 console.warn(`[Campaign] AI generation failed for ${lead.id}, falling back to template:`, aiError);
             }
        }

        // Standard Template Variable Replacement
        const firstName = lead.name?.split(' ')[0] || 'there';
        const company = lead.company || '';
        
        subject = subject.replace(/{{name}}/g, lead.name).replace(/{{firstName}}/g, firstName).replace(/{{company}}/g, company);
        body = body.replace(/{{name}}/g, lead.name).replace(/{{firstName}}/g, firstName).replace(/{{company}}/g, company);

        const trackingId = Math.random().toString(36).substring(2, 15);
        await sendEmail(campaign.userId, lead.email, body, subject, { trackingId });

        // Record message
        await storage.createMessage({
            leadId: lead.id,
            userId: campaign.userId,
            direction: "outbound",
            body: body,
            provider: "email",
            trackingId,
            isRead: true, // Sent emails are usually considered read
            metadata: {
                campaign_id: campaign.id,
                subject: subject,
                is_outreach: true,
                step: leadEntry.currentStep
            }
        });

        // 5. Update Status and Schedule Next Step
        const nextStep = leadEntry.currentStep + 1;
        const hasMoreFollowUps = campaign.template.followups && nextStep <= campaign.template.followups.length;
        
        let nextActionAt = null;
        if (hasMoreFollowUps) {
            const nextFollowUp = campaign.template.followups[nextStep - 1];
            const delayDays = nextFollowUp.delayDays || 3;
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

    } catch (error: any) {
        console.error(`[Campaign] Failed lead ${lead.id}:`, error);
        await db.update(campaignLeads).set({ 
            status: 'failed', 
            error: error.message || 'Send failed' 
        }).where(eq(campaignLeads.id, leadEntry.id));
    }
  }
}

export const campaignWorker = new CampaignWorker();
