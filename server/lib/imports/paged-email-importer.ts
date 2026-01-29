import { db } from '../../db.js';
import { leads as leadsTable } from '../../../shared/schema.js';
import { storage } from '../../storage.js';
import pLimit from 'p-limit';
import { analyzeInboundMessage } from '../ai/inbound-message-analyzer.js';

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

    // Check if lead exists based on email
    // We need a more efficient lookup than getLeads with limit 10000.
    // Ideally use storage.getLeadByEmail(userId, emailAddress)
    // For now, assuming standard storage.getLeads filter is reasonably fast if indexed.
    // Better: storage.getLeadByEmail if available.
    // Looking at drizzle-storage.ts, we don't have getLeadByEmail exposed on interface easily or verified.
    // But we have getLeads({userId, search: emailAddress}).

    const leads = await storage.getLeads({ userId, search: emailAddress });
    let lead = leads.find(l => l.email === emailAddress); // Exact match check

    if (!lead) {
      if (direction === 'outbound') {
        // If we sent an email to someone who isn't a lead, should we create one?
        // Yes, usually.
      }

      // Create lead
      lead = await storage.createLead({
        userId,
        name: extractNameFromEmail(emailAddress),
        email: emailAddress,
        channel: 'email',
        status: 'new',
        score: 0,
        metadata: {
          firstEmailDate: email.date,
          imported: true
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
    const isDuplicate = existingMessages.some(m =>
      Math.abs(new Date(m.createdAt).getTime() - new Date(email.date).getTime()) < 2000 &&
      m.body === (email.text || email.html || '')
    );

    if (isDuplicate) {
      results.skipped++;
      return;
    }

    // Create Message
    await storage.createMessage({
      userId,
      leadId: lead.id,
      direction,
      body: email.text || email.html || '', // Prefer text, fallback html
      provider: 'email',
      metadata: {
        subject: email.subject,
        html: email.html, // Store full HTML in metadata if needed
        from: email.from,
        to: email.to,
        date: email.date
      }
    });

    // Update last message time on lead
    if (new Date(email.date) > new Date(lead.lastMessageAt || 0)) {
      await storage.updateLead(lead.id, { lastMessageAt: new Date(email.date) });
    }

    results.imported++;

    // AUTO-REPLY TRIGGER: If this is an inbound message, queue an AI reply
    if (direction === 'inbound') {
      try {
        // Run full inbound message analysis for intent, objections, churn signals
        const allMessages = await storage.getMessagesByLeadId(lead.id);
        const latestMessage = allMessages.find(m => m.body === (email.text || email.html || ''));
        
        if (latestMessage) {
          try {
            const fullAnalysis = await analyzeInboundMessage(lead.id, latestMessage, lead as any);
            console.log(`[EMAIL_IMPORT] Full inbound analysis for ${lead.email}: urgency=${fullAnalysis.urgencyLevel}, quality=${fullAnalysis.qualityScore}`);
          } catch (analysisError) {
            console.error('[EMAIL_IMPORT] Inbound message analysis error:', analysisError);
          }
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
            const quickDelay = (2 + Math.random() * 2) * 60 * 1000; // 2-4 minutes
            const scheduledTime = new Date(Date.now() + quickDelay);

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
                quick_reply: true
              }
            });

            console.log(`🤖 Quick auto-reply queued for inbound email from ${lead.name} (${Math.round(quickDelay / 60000)}min)`);
          }
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
