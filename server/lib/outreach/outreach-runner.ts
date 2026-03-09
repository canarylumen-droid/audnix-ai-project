import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { scheduleFollowUp } from '../ai/conversation-ai.js';
import type { Integration } from '../../../shared/schema.js';
import { generateReply } from '../ai/ai-service.js';
import { MODELS } from '../ai/model-config.js';
import { getPlanCapabilities } from '../../../shared/plan-utils.js';

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
    const response = await generateReply(
      "You are a helpful sales assistant that generates JSON.",
      prompt,
      {
        model: MODELS.outreach_generation,
        jsonMode: true
      }
    );

    const content = response.text;
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
    followUpDays?: number[]; // Sequence of days for follow-ups (e.g., [3, 7, 14])
    delayBetweenEmailsMs?: number;
    simulateOnly?: boolean;
  } = {}
): Promise<{
  results: OutreachResult[];
  summary: { sent: number; failed: number; total: number };
}> {
  const results: OutreachResult[] = [];
  const { followUpDays = [3, 7, 14], delayBetweenEmailsMs = 2000, simulateOnly = false } = options;

  console.log(`[Outreach] Starting campaign for ${leads.length} leads...${simulateOnly ? ' (SIMULATION MODE)' : ''}`);

  const user = await storage.getUserById(userId);
  if (!user) throw new Error('User not found');

  brandContext.businessName = brandContext.businessName || user.company || user.businessName || 'Audnix AI';

  // --- MAILBOX ROTATION LOGIC ---
  const allIntegrations = await storage.getIntegrations(userId);
  const emailIntegrations = allIntegrations.filter(i =>
    ['custom_email', 'gmail', 'outlook'].includes(i.provider) && i.connected
  );

  const tier = (user.subscriptionTier || 'free').toLowerCase();
  const capabilities = getPlanCapabilities(tier);
  const mailboxLimit = capabilities.mailboxLimit || 1;

  // Daily limits per provider
  const PROVIDER_LIMITS: Record<string, number> = {
    'gmail': 50,
    'outlook': 100,
    'custom_email': 500
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter usable mailboxes
  const emailMailboxes = emailIntegrations.slice(0, mailboxLimit);
  
  if (emailMailboxes.length === 0) {
    throw new Error('No mailboxes connected. Please connect a mailbox in Integrations.');
  }

  // Pre-calculate mailbox availability for bulk outreach
  const usableMailboxes: Array<Integration & { sentCount: number; limit: number }> = [];
  for (const mb of emailMailboxes) {
    const sentCount = await storage.getIntegrationSentCount(userId, mb.id, today);
    const limit = PROVIDER_LIMITS[mb.provider] || 50;
    usableMailboxes.push({ ...mb, sentCount, limit });
  }

  let mailboxIndex = 0;
  // ------------------------------

  for (const lead of leads) {
    try {
      // Check if lead already exists
      let existingLead = await storage.getLeadByEmail(lead.email, userId);
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

      // Pick next mailbox (rotation)
      let currentMailbox = usableMailboxes[mailboxIndex % usableMailboxes.length];
      
      // Autonomous Logic: If it's a follow-up, it can proceed even if the mailbox is at limit.
      // If it's initial outreach (bulk), it must find an available mailbox.
      if (!isFollowUp && currentMailbox.sentCount >= currentMailbox.limit) {
        // Try to find any other mailbox that is NOT at limit
        const alternative = usableMailboxes.find(m => m.sentCount < m.limit);
        if (alternative) {
          currentMailbox = alternative;
        } else {
          // No mailboxes available for bulk outreach - skip this lead and log failure
          console.warn(`[Outreach] 🛑 Skipping bulk outreach for ${lead.email}: All mailboxes reached daily limit.`);
          results.push({
            leadId,
            email: lead.email,
            name: lead.name,
            status: 'failed',
            error: 'All mailboxes reached daily limit for new outreach.'
          });
          continue; 
        }
      }

      if (isFollowUp && currentMailbox.sentCount >= currentMailbox.limit) {
        console.log(`[Outreach] 🔄 Autonomous Follow-up for ${lead.email}: Bypassing application-level cap on mailbox ${currentMailbox.id}`);
      }

      currentMailbox.sentCount++; // Keep local track
      mailboxIndex++;

      if (simulateOnly) {
        console.log(`[Outreach] (SIMULATION) Would send email to ${lead.email} via ${currentMailbox.provider}`);
      } else {
        // Send the email
        const outreachSent = await sendEmail(
          userId,
          lead.email,
          finalBody,
          finalSubject,
          {
            isHtml: false, // Force plain text for outreach
            isRaw: true,   // Skip branded wrapper
            trackingId: undefined,
            integrationId: currentMailbox.id,
            leadId
          }
        );

        console.log(`[Outreach] ✅ Email sent to ${lead.email} via ${currentMailbox.accountType || currentMailbox.provider} (${outreachSent.messageId})`);
      }

      if (!simulateOnly) {
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
            sent_at: new Date().toISOString(),
            integrationId: currentMailbox.id
          }
        });
      }

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

      // Schedule follow-up (Day-based)
      try {
        const { scheduleInitialFollowUp } = await import('../ai/follow-up-worker.js');
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + followUpDays[0]);

        await scheduleInitialFollowUp(userId, leadId, 'email');
        console.log(`[Outreach] 📅 Follow-up scheduled for ${lead.name} in ${followUpDays[0]} days`);
      } catch (fErr) {
        console.error(`[Outreach] Follow-up scheduling failed:`, fErr);
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
        followUpScheduled: undefined // Handled by worker
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
 * Run demo outreach with predefined leads
 */
export async function runDemoOutreach(userId: string): Promise<{ results: OutreachResult[]; summary: { sent: number; failed: number; total: number } }> {
  const demoLeads: OutreachLead[] = [
    { name: "Demo User", email: "demo@example.com", company: "Audnix Demo" }
  ];
  return runOutreachCampaign(userId, demoLeads, {
    serviceName: "Audnix AI Sales Agent",
    pricing: "$99/mo",
    valueProposition: "Automate your sales outreach with AI"
  }, { simulateOnly: true });
}

