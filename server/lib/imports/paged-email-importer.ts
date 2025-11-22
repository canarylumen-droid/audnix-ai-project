import { db } from '../../db';
import { leads as leadsTable } from '@shared/schema';
import { storage } from '../../storage';
import pLimit from 'p-limit';

/**
 * Paged email importer - prevents timeout and memory issues
 * Imports 100 emails at a time with background queue processing
 */

export async function pagedEmailImport(
  userId: string,
  emails: any[],
  onProgress?: (progress: number) => void
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
        limit(() => processEmailForLead(userId, email, results))
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
  results: any
): Promise<void> {
  try {
    // Skip if email is transactional
    if (isTransactionalEmail(email)) {
      results.skipped++;
      return;
    }
    
    // Skip if spam/newsletter
    if (isSpamOrNewsletter(email)) {
      results.skipped++;
      return;
    }
    
    // Check if lead already exists
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const exists = existingLeads.some(l => l.email === email.from);
    
    if (exists) {
      results.skipped++;
      return;
    }
    
    // Create lead
    await storage.createLead({
      userId,
      name: extractNameFromEmail(email.from),
      email: email.from,
      channel: 'email',
      status: 'new',
      score: 0,
      metadata: {
        subject: email.subject,
        firstEmailDate: email.date,
        imported: true
      }
    });
    
    results.imported++;
  } catch (error) {
    console.error('Error processing email:', error);
  }
}

/**
 * Detect if email is transactional (receipts, alerts, notifications)
 */
function isTransactionalEmail(email: any): boolean {
  const transactionalKeywords = [
    'receipt', 'invoice', 'confirmation', 'order',
    'password', 'reset', 'verify', 'alert',
    'notification', 'update', 'change', 'billing',
    'payment', 'confirm', 'validate', 'expire',
    'security', 'unusual', 'activity'
  ];
  
  const subject = (email.subject || '').toLowerCase();
  const from = (email.from || '').toLowerCase();
  
  return transactionalKeywords.some(kw => 
    subject.includes(kw) || from.includes('noreply') || from.includes('no-reply')
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
