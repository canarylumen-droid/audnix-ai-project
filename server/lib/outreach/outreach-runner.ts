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
    const firstNameRaw = (lead.name.split(' ')[0] || "there").trim();
    // Use first name only, capitalize, and truncate if excessively long
    const firstName = firstNameRaw.length > 12
      ? firstNameRaw.substring(0, 1) + firstNameRaw.substring(1, 11)
      : firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);

    if (content) {
      const parsed = JSON.parse(content);
      let body = parsed.body || `Hey ${firstName}, wanted to reach out about something that might help you...`;

      // Refined lead name injection: handles greetings and placeholders like {lead_name}
      if (body.includes("{lead_name}")) {
        body = body.replace(/\{lead_name\}/g, firstName);
      } else if (!body.toLowerCase().includes(firstName.toLowerCase()) &&
        (body.match(/^(Hi|Hey|Hello)(\s*,|\s+)/i))) {
        body = body.replace(/^(Hi|Hey|Hello)(\s*,|\s+)/i, `$1 ${firstName}, `);
      }

      return {
        subject: parsed.subject || `Quick question, ${firstName}`,
        body
      };
    }
  } catch (error) {
    console.error('AI generation error:', error);
  }

  // Fallback template
  const firstName = (lead.name.split(' ')[0] || "friend").charAt(0).toUpperCase() + (lead.name.split(' ')[0] || "friend").slice(1);
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
      let existingLead = await storage.getLeadByEmail(lead.email);
      // Optional: verify it belongs to the user
      if (existingLead && existingLead.userId !== userId) {
        existingLead = undefined;
      }

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

      // --- ENHANCEMENT: Name Interpolation & Plain Text Format ---
      const firstNameRaw = (lead.name.split(' ')[0] || "there").trim();
      const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);
      
      // Auto-replace placeholders if AI missed them
      let finalBody = emailContent.body.replace(/\{lead_name\}/g, firstName);
      let finalSubject = emailContent.subject.replace(/\{lead_name\}/g, firstName);

      // Ensure follow-up appends to thread (Re:)
      const isFollowUp = (existingLead?.metadata as any)?.outreach_sent === true;
      if (isFollowUp && !finalSubject.toLowerCase().startsWith('re:')) {
        finalSubject = `Re: ${finalSubject}`;
      }

      // Send the email (or simulate)
      if (!simulateOnly) {
        await sendEmail(
          userId,
          lead.email,
          finalBody,
          finalSubject,
          { 
            isHtml: false, // Force plain text
            isRaw: true,   // Skip branded wrapper
            trackingId: undefined // No tracking for super-clean mail
          }
        );
        console.log(`[Outreach] ✅ Email sent to ${lead.email}`);
      } else {
        console.log(`[Outreach] 📧 SIMULATED email to ${lead.email}: "${finalSubject}"`);
      }

      // Save outbound message to database
      await storage.createMessage({
        leadId,
        userId,
        provider: 'email',
        direction: 'outbound',
        body: finalBody,
        metadata: {
          subject: finalSubject,
          ai_generated: true,
          outreach_campaign: true,
          sent_at: new Date().toISOString()
        }
      });

      // Update lead status
      await storage.updateLead(leadId, {
        status: 'open',
        lastMessageAt: new Date(),
        metadata: {
          ...(existingLead?.metadata as any || {}),
          outreach_sent: true,
          last_subject: finalSubject
        }
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

// Demo logic removed for production hardening

