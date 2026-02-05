
import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { outreachCampaigns, campaignLeads } from '../../../shared/schema.js';
import { eq, and, lte, sql, desc, or } from 'drizzle-orm';
import { db } from '../db.js';

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

    // 3. Select pending leads
    const pendingLeads = await db.select()
        .from(campaignLeads)
        .where(
            and(
                eq(campaignLeads.campaignId, campaign.id),
                eq(campaignLeads.status, 'pending')
            )
        )
        .limit(1); // Send 1 at a time to respect strict delay

    if (pendingLeads.length === 0) {
        // Campaign active but no leads? Pause or Mark Completed?
        // Mark completed if really empty
        return;
    }

    const leadEntry = pendingLeads[0];
    const lead = await storage.getLeadById(leadEntry.leadId);

    if (!lead || !lead.email) {
        await db.update(campaignLeads).set({ status: 'failed', error: 'Invalid lead or missing email' }).where(eq(campaignLeads.id, leadEntry.id));
        return;
    }

    // 4. Send Email
    try {
        console.log(`[Campaign] Sending to ${lead.email} for campaign ${campaign.name}`);
        
        // Replace variables in template
        let subject = campaign.template.subject;
        let body = campaign.template.body;
        
        const firstName = lead.name?.split(' ')[0] || 'there';
        const company = lead.company || '';
        
        subject = subject.replace(/{{name}}/g, lead.name).replace(/{{firstName}}/g, firstName).replace(/{{company}}/g, company);
        body = body.replace(/{{name}}/g, lead.name).replace(/{{firstName}}/g, firstName).replace(/{{company}}/g, company);

        await sendEmail(campaign.userId, lead.email, body, subject);

        // 5. Update Status
        await db.update(campaignLeads).set({ 
            status: 'sent', 
            sentAt: new Date(),
            error: null 
        }).where(eq(campaignLeads.id, leadEntry.id));

        // Update campaign stats
        // We can increment stats.sent via JS or SQL
        // Easier to just let stats be an aggregation query or update jsonb
        // Let's update jsonb simple way
        
        // This is safe because worker is single instance ideally, but race condition possible if scaled.
        // For MVP, simple update.
        // Or better: Let "stats" be derived or update purely.
        /*
        const newStats = { ...campaign.stats, sent: (campaign.stats.sent || 0) + 1 };
        await db.update(outreachCampaigns).set({ stats: newStats }).where(eq(outreachCampaigns.id, campaign.id));
        */

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
