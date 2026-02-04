import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { scheduleFollowUp } from '../ai/conversation-ai.js';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface OutreachLead {
  name: string;
  email: string;
  company?: string;
}

export interface BrandContext {
  serviceName: string;
  pricing: string;
  valueProposition: string;
  businessName?: string;
}

export interface OutreachResult {
  leadId: string;
  email: string;
  name: string;
  status: 'sent' | 'failed' | 'scheduled';
  message?: string;
  error?: string;
  followUpScheduled?: Date;
}

/**
 * Generate personalized outreach email using AI
 */
async function generateOutreachEmail(
  lead: OutreachLead,
  brandContext: BrandContext
): Promise<{ subject: string; body: string }> {
  
  const prompt = `You are a sales copywriting expert. Generate a short, personalized cold outreach email.

Lead Info:
- Name: ${lead.name}
- Email: ${lead.email}
${lead.company ? `- Company: ${lead.company}` : ""}

Brand/Service Info:
- Service: ${brandContext.serviceName}
- Price: ${brandContext.pricing}
- Value: ${brandContext.valueProposition}
${brandContext.businessName ? `- From: ${brandContext.businessName}` : ""}

RULES:
1. Keep it under 100 words
2. Personal, not corporate-sounding
3. End with a clear CTA (reply or book a call)
4. Don't be pushy or salesy - be helpful
5. Use the lead's first name only

Return JSON only:
{
  "subject": "...",
  "body": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful sales assistant that generates JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        subject: parsed.subject || `Quick question, ${lead.name.split(' ')[0]}`,
        body: parsed.body || `Hey ${lead.name.split(' ')[0]}, wanted to reach out about something that might help you...`
      };
    }
  } catch (error) {
    console.error('AI generation error:', error);
  }

  // Fallback template
  const firstName = lead.name.split(' ')[0];
  return {
    subject: `Quick question for you, ${firstName}`,
    body: `Hey ${firstName},\n\nI came across your profile and wanted to reach out about something that might be valuable for you.\n\n${brandContext.valueProposition}\n\nWould you be open to a quick chat this week?\n\nBest,\n${brandContext.businessName || 'The Team'}`
  };
}

/**
 * Run outreach campaign for a list of leads
 */
export async function runOutreachCampaign(
  userId: string,
  leads: OutreachLead[],
  brandContext: BrandContext,
  options: {
    scheduleFollowUpMinutes?: number;
    delayBetweenEmailsMs?: number;
    simulateOnly?: boolean; // Skip actual email sending for demo/testing
  } = {}
): Promise<{
  results: OutreachResult[];
  summary: { sent: number; failed: number; total: number };
}> {
  const results: OutreachResult[] = [];
  const { scheduleFollowUpMinutes = 5, delayBetweenEmailsMs = 2000, simulateOnly = false } = options;

  console.log(`[Outreach] Starting campaign for ${leads.length} leads...${simulateOnly ? ' (SIMULATION MODE)' : ''}`);

  // Check if user has email configured (skip check in simulation mode)
  if (!simulateOnly) {
    const emailIntegration = await storage.getIntegration(userId, 'custom_email');
    if (!emailIntegration?.connected) {
      throw new Error('No email configured. Please connect your SMTP in Settings > Email Integration.');
    }
  }

  const user = await storage.getUserById(userId);
  brandContext.businessName = brandContext.businessName || user?.company || user?.businessName || 'Audnix AI';

  for (const lead of leads) {
    try {
      // Check if lead already exists
      const existingLeads = await storage.getLeads({ userId, limit: 10000 });
      let existingLead = existingLeads.find(l => 
        l.email?.toLowerCase() === lead.email.toLowerCase()
      );

      let leadId: string;

      if (!existingLead) {
        // Create new lead
        const newLead = await storage.createLead({
          userId,
          name: lead.name,
          email: lead.email,
          channel: 'email',
          status: 'new',
          aiPaused: false,
          metadata: {
            company: lead.company,
            outreach_campaign: true,
            campaign_date: new Date().toISOString()
          }
        });
        leadId = newLead.id;
        console.log(`[Outreach] Created new lead: ${lead.name} (${lead.email})`);
      } else {
        leadId = existingLead.id;
        console.log(`[Outreach] Using existing lead: ${lead.name}`);
      }

      // Generate personalized email
      const emailContent = await generateOutreachEmail(lead, brandContext);

      // Send the email (or simulate)
      if (!simulateOnly) {
        await sendEmail(
          userId,
          lead.email,
          emailContent.body,
          emailContent.subject,
          { isHtml: false }
        );
        console.log(`[Outreach] ✅ Email sent to ${lead.email}`);
      } else {
        console.log(`[Outreach] 📧 SIMULATED email to ${lead.email}: "${emailContent.subject}"`);
      }

      console.log(`[Outreach] ✅ Email sent to ${lead.email}`);

      // Save outbound message to database
      await storage.createMessage({
        leadId,
        userId,
        provider: 'email',
        direction: 'outbound',
        body: emailContent.body,
        metadata: {
          subject: emailContent.subject,
          ai_generated: true,
          outreach_campaign: true,
          sent_at: new Date().toISOString()
        }
      });

      // Update lead status
      await storage.updateLead(leadId, {
        status: 'open',
        lastMessageAt: new Date()
      });

      // Schedule follow-up
      let followUpTime: Date | null = null;
      if (scheduleFollowUpMinutes > 0) {
        followUpTime = await scheduleFollowUp(userId, leadId, 'email', 'followup');
        console.log(`[Outreach] 📅 Follow-up scheduled for ${lead.name}`);
      }

      // Create notification
      await storage.createNotification({
        userId,
        type: 'system',
        title: '📧 Outreach Sent',
        message: `Email sent to ${lead.name} (${lead.email})`,
        metadata: {
          leadId,
          leadName: lead.name,
          leadEmail: lead.email,
          activityType: 'outreach_sent'
        }
      });

      results.push({
        leadId,
        email: lead.email,
        name: lead.name,
        status: 'sent',
        message: emailContent.subject,
        followUpScheduled: followUpTime || undefined
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Outreach] ❌ Failed for ${lead.email}:`, errorMsg);
      
      results.push({
        leadId: '',
        email: lead.email,
        name: lead.name,
        status: 'failed',
        error: errorMsg
      });
    }

    // Delay between emails to avoid rate limiting
    if (delayBetweenEmailsMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenEmailsMs));
    }
  }

  const summary = {
    sent: results.filter(r => r.status === 'sent').length,
    failed: results.filter(r => r.status === 'failed').length,
    total: results.length
  };

  console.log(`[Outreach] Campaign complete: ${summary.sent}/${summary.total} sent`);

  return { results, summary };
}

/**
 * Run HVAC-specific outreach campaign with 8 leads
 * Configured for 6-hour follow-ups (first time only)
 */
export async function runDemoOutreach(userId: string): Promise<{
  results: OutreachResult[];
  summary: { sent: number; failed: number; total: number };
}> {
  // 1. Fetch existing leads first
  let dbLeads = await storage.getLeads({ userId, limit: 100 });
  
  // Filter for HVAC style leads if needed, or just use all for the demo
  // For now, we'll try to find specific "demo-seeded" leads or just use what's there
  
  if (dbLeads.length === 0) {
    console.log('[Outreach] No leads found. Seeding initial database with HVAC leads...');
    
    const initialLeads: OutreachLead[] = [
      { name: 'Mike Johnson', email: 'trexndom@gmail.com', company: 'Johnson HVAC Services' },
      { name: 'Sarah Williams', email: 'team.replyflow@gmail.com', company: 'Williams Heating & Cooling' },
      { name: 'James Anderson', email: 'iamherebro60@gmail.com', company: 'Anderson Air Solutions' },
      { name: 'David Martinez', email: 'loopstories1@gmail.com', company: 'Martinez Climate Control' },
      { name: 'Robert Thompson', email: 'orbieonlms@gmail.com', company: 'Thompson HVAC Pros' },
      { name: 'Chris Davis', email: 'nevermindthough79@gmail.com', company: 'Davis Air Systems' },
      { name: 'Kevin Wilson', email: 'somtouchendu9@gmail.com', company: 'Wilson Comfort Systems' },
      { name: 'Brian Taylor', email: 'c28926695@gmail.com', company: 'Taylor Heating Services' }
    ];

    for (const lead of initialLeads) {
      await storage.createLead({
        userId,
        name: lead.name,
        email: lead.email,
        channel: 'email',
        status: 'new',
        aiPaused: false,
        metadata: {
          company: lead.company,
          outreach_campaign: true,
          source: 'demo_seed'
        }
      });
    }
    
    // Refresh list
    dbLeads = await storage.getLeads({ userId, limit: 100 });
  }

  // Convert DB leads to OutreachLead format
  const outreachLeads: OutreachLead[] = dbLeads.map(l => ({
    name: l.name,
    email: l.email || '',
    company: (l.metadata as any)?.company || 'Unknown Company'
  })).filter(l => l.email); // Ensure email exists

  // HVAC-specific brand context
  const brandContext: BrandContext = {
    serviceName: 'AI-Powered Call Handling for HVAC Companies',
    pricing: 'Starting at $297/month',
    valueProposition: 'Never miss another HVAC service call. Our AI receptionist handles your calls 24/7, books appointments, and qualifies leads while you focus on the jobs that matter.',
    businessName: 'Audnix AI'
  };

  // 6-hour follow-up scheduling (360 minutes)
  return runOutreachCampaign(userId, outreachLeads, brandContext, {
    scheduleFollowUpMinutes: 360, // 6 hours
    delayBetweenEmailsMs: 3000,
    simulateOnly: false // Send actual emails
  });
}

