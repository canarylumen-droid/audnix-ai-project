import { db } from '../../db.js';
import { leads as leadsTable, emailReplyStore, campaignEmails, outreachCampaigns, campaignLeads } from '../../../shared/schema.js';
import { storage } from '../../storage.js';
import pLimit from 'p-limit';
import { analyzeInboundMessage } from '../ai/inbound-message-analyzer.js';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Paged email importer - prevents timeout and memory issues
 * Imports 100 emails at a time with background queue processing
 */

export async function pagedEmailImport(
  userId: string,
  emails: any[],
  onProgress?: (progress: number) => void,
  direction: 'inbound' | 'outbound' = 'inbound'
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const results = { imported: 0, skipped: 0, errors: [] as string[] };
  const limit = pLimit(5); // Process 5 emails in parallel

  try {
    const totalPages = Math.ceil(emails.length / 100);

    for (let page = 0; page < totalPages; page++) {
      const start = page * 100;
      const end = start + 100;
      const pageEmails = emails.slice(start, end);

      const tasks = pageEmails.map(email =>
        limit(() => processEmailForLead(userId, email, results, direction))
      );

      await Promise.all(tasks);

      // Report progress
      const progress = Math.round(((page + 1) / totalPages) * 100);
      onProgress?.(progress);

      // Small delay between pages to avoid overwhelming DB
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Email import error:', error);
    results.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
}

/**
 * Smart lead creation - only create leads for non-transactional emails
 * Uses heuristics to detect if email is from a real prospect
 */
async function processEmailForLead(
  userId: string,
  email: any,
  results: any,
  direction: 'inbound' | 'outbound' = 'inbound'
): Promise<void> {
  try {
    // Skip if email is transactional (only for inbound)
    if (direction === 'inbound' && isTransactionalEmail(email)) {
      results.skipped++;
      return;
    }

    // Skip if spam/newsletter (only for inbound)
    if (direction === 'inbound' && isSpamOrNewsletter(email)) {
      results.skipped++;
      return;
    }

    const emailAddress = direction === 'inbound' ? email.from : email.to; // For outbound, we care who we sent TO
    console.log(`[DEBUG] Processing ${direction} email: ${emailAddress} - Subject: ${email.subject} - Message-ID: ${email.messageId}`);

    // [DEDUPLICATION] check by messageId if available
    if (email.messageId) {
      const existingEmail = await storage.getEmailMessageByMessageId(email.messageId);
      if (existingEmail) {
        results.skipped++;
        return;
      }
    }

    // [ROBUST LOOKUP] Use direct DB query for case-insensitive email matching
    // storage.getLeads uses case-dependent 'like' which might fail for mismatches
    const leads = await db
      .select()
      .from(leadsTable)
      .where(and(
        eq(leadsTable.userId, userId),
        sql`LOWER(${leadsTable.email}) = ${emailAddress.toLowerCase()}`
      ))
      .limit(1);

    let lead = leads[0];
    console.log('[DEBUG] Lead lookup result:', lead ? `Found ${lead.id}` : 'Not found');


    if (!lead) {
      if (direction === 'inbound') {
        // [STRICT FILTER] Skip importing inbound emails from unknown senders
        // This keeps the Audnix Inbox focused ONLY on recognition leads
        results.skipped++;
        return;
      }

      // Create lead for outbound intentional outreach
      lead = await storage.createLead({
        userId,
        name: extractNameFromEmail(emailAddress),
        email: emailAddress,
        channel: 'email',
        status: 'new',
        score: 0,
        metadata: {
          firstEmailDate: email.date,
          imported: true,
          discovery_source: 'outbound_outreach'
        }
      });
    }

    // Check if message already exists to avoid duplicates
    // This is expensive unless we track message IDs.
    // We can filter by timestamp roughly or hash.
    // Or just reliance on recent 50 fetch limit and hope?
    // Proper way: Store external_id in messages table.
    // Drizzle schema likely doesn't have external_id on messages yet?
    // Let's check schema.ts later. For now, we risk duplicates if we keep importing.
    // We should check if a message with same Body + Date exists for this lead.

    const existingMessages = await storage.getMessages(lead.id);
    const existingMessage = existingMessages.find(m =>
      Math.abs(new Date(m.createdAt).getTime() - new Date(email.date).getTime()) < 2000 &&
      m.body === (email.text || email.html || '')
    );

    if (existingMessage) {
      // If message exists, check if isRead status changed
      if (email.isRead !== undefined && existingMessage.isRead !== email.isRead) {
        await storage.updateMessage(existingMessage.id, { isRead: email.isRead });
        results.imported++; // Count as dynamic update

        // Notify UI of read status change
        try {
          const { wsSync } = await import('../websocket-sync.js');
          wsSync.notifyMessagesUpdated(userId, {
            type: 'UPDATE',
            messageId: existingMessage.id,
            event: 'read_status_changed',
            isRead: email.isRead
          });
        } catch (wsError) { }
      } else {
        results.skipped++;
      }
      return;
    }

    // Resolve internal Thread ID
    const thread = await storage.getOrCreateThread(userId, lead.id, email.subject || 'No Subject', email.threadId);
    const threadId = (thread as any).id;

    // Create Message
    const newMessage = await storage.createMessage({
      userId,
      leadId: lead.id,
      threadId,
      direction,
      body: email.text || email.html || '', // Prefer text, fallback html
      provider: 'email',
      isRead: email.isRead || direction === 'outbound', // Sent emails are usually considered read
      metadata: {
        subject: email.subject,
        html: email.html, // Store full HTML in metadata if needed
        from: email.from,
        to: email.to,
        date: email.date,
        providerThreadId: email.threadId
      }
    });

    // PERMANENT STORAGE: Also store in email_messages table
    try {
      await storage.createEmailMessage({
        userId,
        leadId: lead.id,
        messageId: email.messageId || `msg_${Date.now()}_${Math.random()}`,
        threadId: email.threadId || threadId, // Store provider thread ID if available, otherwise internal UUID
        subject: email.subject,
        from: email.from || '',
        to: email.to || '',
        body: email.text || '',
        htmlBody: email.html,
        direction,
        provider: 'custom_email',
        sentAt: email.date || new Date(),
        metadata: {
          internalThreadId: threadId
        }
      });
    } catch (e) {
      // Ignore duplicates
    }

    // Notify UI of new message and potentially lead status change
    try {
      const { wsSync } = await import('../websocket-sync.js');
      wsSync.notifyMessagesUpdated(userId, {
        type: 'INSERT',
        messageId: (newMessage as any).id,
        direction
      });

      // Crucial: Also notify lead update to refresh Inbox list immediately
      if (direction === 'inbound') {
        wsSync.notifyLeadsUpdated(userId, { 
          leadId: lead.id, 
          action: 'message_received' 
        });
        
        // Also fire an activity update for toasts/analytics
        wsSync.notifyActivityUpdated(userId, {
          type: 'email_received',
          leadId: lead.id,
          messageId: (newMessage as any).id
        });
      }
    } catch (wsError) { }

    // Update last message time on lead
    if (new Date(email.date) > new Date(lead.lastMessageAt || 0)) {
      await storage.updateLead(lead.id, { lastMessageAt: new Date(email.date) });
    }

    results.imported++;

    // AUTO-REPLY TRIGGER & CAMPAIGN MANAGEMENT
    if (direction === 'inbound') {
      try {
        // 1. MARK CAMPAIGN AS REPLIED: Stop follow-ups if lead replied
        // We do this immediately upon receiving an inbound message from a lead
        let linkedCampaignId: string | null = null;
        try {
          const { campaignLeads, outreachCampaigns } = await import('../../../shared/schema.js');
          const { db } = await import('../../db.js');
          const { eq, and, sql } = await import('drizzle-orm');

          // DEEP LINKING: Try to find campaign via inReplyTo header
          if (email.inReplyTo) {
            const parentEmail = await storage.getEmailMessageByMessageId(email.inReplyTo);
            if (parentEmail?.campaignId) {
              linkedCampaignId = parentEmail.campaignId;
              console.log(`[EMAIL_IMPORT] Deep linked inbound reply to campaign ${linkedCampaignId} via In-Reply-To: ${email.inReplyTo}`);
            }
          }

          // Find the campaign lead entry (preferably the one linked, otherwise the most recent 'sent' one)
          const campaignLeadEntries = await db.select()
            .from(campaignLeads)
            .where(
              and(
                eq(campaignLeads.leadId, lead.id),
                linkedCampaignId ? eq(campaignLeads.campaignId, linkedCampaignId) : eq(campaignLeads.status, 'sent')
              )
            )
            .limit(1);

          if (campaignLeadEntries.length > 0) {
            const entry = campaignLeadEntries[0];
            await db.update(campaignLeads)
              .set({ status: 'replied' })
              .where(eq(campaignLeads.id, entry.id));
            
            console.log(`[EMAIL_IMPORT] Lead ${lead.email} marked as 'replied' in campaign ${entry.campaignId}`);

            // NEW: Increment replied stat in outreachCampaigns
            await db.update(outreachCampaigns)
              .set({
                stats: sql`jsonb_set(stats, '{replied}', (COALESCE((stats->>'replied')::int, 0) + 1)::text::jsonb)`,
                updatedAt: new Date()
              })
              .where(eq(outreachCampaigns.id, entry.campaignId));

            // Real-time notification and audit log
            try {
              const { wsSync } = await import('../websocket-sync.js');
              wsSync.notifyActivityUpdated(userId, { 
                type: 'email_reply', 
                leadId: lead.id,
                campaignId: entry.campaignId 
              });
              
              await storage.createAuditLog({
                userId,
                leadId: lead.id,
                action: 'lead_reply',
                details: { 
                  message: `Received email reply from ${lead.name}`,
                  campaignId: entry.campaignId,
                  channel: 'email'
                }
              });

              // Create persistent notification
              await storage.createNotification({
                userId,
                type: 'lead_reply',
                title: '📩 New Reply Received',
                message: `${lead.name} replied to your outreach.`,
                actionUrl: `/dashboard/inbox?leadId=${lead.id}`
              });
            } catch (notifyErr) {
              console.error('Failed to notify reply activity:', notifyErr);
            }

            // NEW: Log to emailReplyStore
            try {
              await db.insert(emailReplyStore).values({
                messageId: email.messageId || `reply_${Date.now()}_${Math.random()}`,
                inReplyTo: email.inReplyTo || '',
                campaignId: entry.campaignId,
                leadId: lead.id,
                userId: userId,
                fromAddress: email.from || '',
                subject: email.subject,
                body: email.text || '',
                receivedAt: email.date || new Date()
              });
            } catch (replyLogErr) {}

            // Fetch the campaign to get the auto-reply template
            const campaigns = await db.select()
              .from(outreachCampaigns)
              .where(eq(outreachCampaigns.id, entry.campaignId))
              .limit(1);
            
            let activeCampaign: any = null;
            if (campaigns.length > 0) {
              activeCampaign = campaigns[0];
            }
          }
        } catch (campaignStatusError) {
          console.warn('[EMAIL_IMPORT] Failed to update campaign status:', campaignStatusError);
        }

        // 2. Run full inbound message analysis
        // We need the full message object for analysis
        const messageForAnalysis = {
          ...newMessage,
          id: (newMessage as any).id,
          body: email.text || email.html || ''
        };

        try {
          const fullAnalysis = await analyzeInboundMessage(lead.id, messageForAnalysis as any, lead as any);
          console.log(`[EMAIL_IMPORT] Full inbound analysis for ${lead.email}: urgency=${fullAnalysis.urgencyLevel}, quality=${fullAnalysis.qualityScore}`);
        } catch (analysisError) {
          console.error('[EMAIL_IMPORT] Inbound message analysis error:', analysisError);
        }

        // Check if we should auto-reply (lead not paused, not recently replied)
        const existingOutbound = existingMessages.filter(m => m.direction === 'outbound');
        const lastOutbound = existingOutbound[existingOutbound.length - 1];
        const hoursSinceLastOutbound = lastOutbound
          ? (Date.now() - new Date(lastOutbound.createdAt).getTime()) / (1000 * 60 * 60)
          : Infinity;


        // Only auto-reply if:
        // 1. Lead doesn't have AI paused
        // 2. We haven't replied in the last 2 hours (avoid rapid back-and-forth)
        // 3. Lead is not converted or not_interested
        // 4. Email is RECENT (within last 1 hour) - SAFETY CHECK for imports
        const isRecent = new Date(email.date).getTime() > Date.now() - 1000 * 60 * 60;

        if (!lead.aiPaused &&
          hoursSinceLastOutbound > 2 &&
          !['converted', 'not_interested'].includes(lead.status) &&
          isRecent) {

          // Schedule QUICK follow-up (2-4 minutes like Instagram DMs)
          // This is different from initial outreach which uses 2-4 hours
          const { db: followUpDb } = await import('../../db.js');
          const { followUpQueue } = await import('../../../shared/schema.js');

          if (followUpDb) {
            const quickDelay = (2 + Math.random() * 1) * 60 * 1000; // 2-3 minutes
            const scheduledTime = new Date(Date.now() + quickDelay);

            // Extract custom auto-reply body if it exists
            const { outreachCampaigns } = await import('../../../shared/schema.js');
            const [activeCampaign] = await followUpDb
              .select()
              .from(outreachCampaigns)
              .where(and(eq(outreachCampaigns.userId, userId), eq(outreachCampaigns.status, 'active')))
              .limit(1);

            const autoReplyBody = (activeCampaign?.template as any)?.autoReplyBody;

            await followUpDb.insert(followUpQueue).values({
              userId,
              leadId: lead.id,
              channel: 'email',
              scheduledAt: scheduledTime,
              context: {
                follow_up_number: existingOutbound.length + 1,
                source: 'inbound_reply',
                temperature: 'hot', // Inbound emails are hot leads
                campaign_day: 0,
                sequence_number: 1,
                inbound_message: email.text?.substring(0, 200) || email.html?.substring(0, 200) || '',
                quick_reply: true,
                autoReplyBody: autoReplyBody || null // Pass the custom body to the worker
              }
            });

            console.log(`🤖 [EMAIL_IMPORT] Quick auto-reply queued for inbound email from ${lead.name} (${Math.round(quickDelay / 60000)}min)${autoReplyBody ? ' using custom template' : ' using AI'}`);
          }
        } else {
          console.log(`[EMAIL_IMPORT] Auto-reply SKIPPED for ${lead.email}. Reasons: Paused=${lead.aiPaused}, RecentOutbound=${hoursSinceLastOutbound < 2}, Status=${lead.status}, IsRecent=${isRecent}`);
        }
      } catch (autoReplyError) {
        console.warn('Auto-reply scheduling failed (non-critical):', autoReplyError);
      }
    }
  } catch (error) {
    console.error('Error processing email:', error);
  }
}

/**
 * Detect if email is transactional (receipts, alerts, notifications, OTP, etc)
 */
function isTransactionalEmail(email: any): boolean {
  const transactionalKeywords = [
    // Financial
    'receipt', 'invoice', 'confirmation', 'order', 'billing', 'payment',
    // Security & OTP
    'password', 'reset', 'verify', 'verification', 'otp', 'code', 'confirm',
    'two-factor', '2fa', 'authenticator', 'security alert', 'unusual activity',
    // System alerts
    'alert', 'notification', 'update', 'change', 'validate', 'expire',
    'security', 'urgent', 'action required', 'warning',
    // App-generated
    'no-reply', 'noreply', 'do-not-reply', 'bounced', 'undeliverable',
    'automatic', 'automated', 'no response', 'do not reply',
    // Service messages
    'welcome', 'signup', 'registered', 'activation', 'account created'
  ];

  const subject = (email.subject || '').toLowerCase();
  const from = (email.from || '').toLowerCase();
  const body = (email.text || '').toLowerCase().substring(0, 500); // Check first 500 chars

  // Check for OTP-specific patterns
  const otpPatterns = /\b\d{4,8}\b|otp|one-time|one time password|verification code|verify your/i;
  if (otpPatterns.test(subject) || otpPatterns.test(body)) {
    return true;
  }

  // Check email address for automation indicators
  if (from.includes('noreply') || from.includes('no-reply') || from.includes('donotreply') ||
    from.includes('automatic') || from.includes('notification') || from.includes('alert')) {
    return true;
  }

  return transactionalKeywords.some(kw =>
    subject.includes(kw) || body.includes(kw)
  );
}

/**
 * Detect if email is spam or newsletter
 */
function isSpamOrNewsletter(email: any): boolean {
  const spamKeywords = [
    'unsubscribe', 'newsletter', 'subscribe', 'marketing',
    'promotion', 'deal', 'sale', 'offer', 'discount',
    'free shipping', 'limited time', 'contact us'
  ];

  const subject = (email.subject || '').toLowerCase();
  const body = (email.text || '').toLowerCase();

  return spamKeywords.some(kw =>
    subject.includes(kw) || body.includes(kw)
  );
}

/**
 * Extract name from email address
 */
function extractNameFromEmail(emailAddress: string): string {
  try {
    const namePart = emailAddress.split('@')[0];
    return namePart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  } catch {
    return 'Contact';
  }
}
