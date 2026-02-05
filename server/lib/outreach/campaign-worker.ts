
import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { outreachCampaigns, campaignLeads } from '../../../shared/schema.js';
import { eq, and, lte, sql, desc, or } from 'drizzle-orm';
import { db } from '../db.js';
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
        
        let subject = campaign.template.subject;
        let body = campaign.template.body;
        
        // AI Personalization (if enabled)
        if (campaign.config?.isManual === false) {
             try {
                 const aiContent = await generateExpertOutreach(lead, campaign.userId);
                 if (aiContent && aiContent.subject && aiContent.body) {
                     subject = aiContent.subject;
                     body = aiContent.body;
                 }
             } catch (aiError) {
                 console.warn(`[Campaign] AI generation failed for ${lead.id}, falling back to template:`, aiError);
                 // Fallback to template (already set)
             }
        }

        // Standard Template Variable Replacement (always run as fallback or for manual)
        const firstName = lead.name?.split(' ')[0] || 'there';
        const company = lead.company || '';
        
        subject = subject.replace(/{{name}}/g, lead.name).replace(/{{firstName}}/g, firstName).replace(/{{company}}/g, company);
        body = body.replace(/{{name}}/g, lead.name).replace(/{{firstName}}/g, firstName).replace(/{{company}}/g, company);

        await sendEmail(campaign.userId, lead.email, body, subject);

        // Record message in storage (Outbound outreach)
        await storage.createMessage({
            leadId: lead.id,
            userId: campaign.userId,
            direction: "outbound",
            body: body,
            provider: "email",
            metadata: {
                campaign_id: campaign.id,
                subject: subject,
                is_outreach: true
            }
        });

        // 5. Update Status
        await db.update(campaignLeads).set({ 
            status: 'sent', 
            sentAt: new Date(),
            error: null 
        }).where(eq(campaignLeads.id, leadEntry.id));

        // 6. Schedule Follow-up (if configured)
        if (campaign.config.followUpDelayDays) {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + campaign.config.followUpDelayDays);

          // Create next step in sequence?
          // For MVP, we might just have one follow-up or a sequence array.
          // Assuming simple "follow-up" enabled implicitly if delay is set.
          // We need a way to distinguish initial vs follow-up in the campaign_leads table?
          // Or we create a NEW task in `followUpQueue` (general table) or `campaign_leads`?
          
          // Let's use `followUpQueue` which is designed for general follow-ups
          // OR iterate the campaign sequence index.
          // If `campaign_leads` has `step_number`, we increment it.
          // Checking schema... `campaignLeads` usually links lead to campaign.
          // If we want multiple steps, we probably need a `step` column or new row.
          
          // Simplest for now: Use `storage.createFollowUp` which handles the "task" of following up.
          // But `CampaignWorker` processes `campaign_leads`.
          // If we want the *campaign* to handle it, we might insert a new row into `campaign_leads` 
          // for the SAME lead but different `step`? (Schema dependent).
          
          // Let's assume we use the generic `createFollowUp` for now to put it in the "Todo" list for the user or system?
          // Wait, autonomous campaign should send it automatically.
          // Let's assume we just log it for now or use the generic scheduled message system if it exists.
          
          // Current solution: Log success. Re-implement robust sequence later if schema allows.
          console.log(`[Campaign] Follow-up scheduled for ${followUpDate.toISOString()} (Not fully implemented in schema yet)`);
        }
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
