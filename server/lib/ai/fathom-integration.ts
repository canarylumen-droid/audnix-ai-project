import { storage } from '../../storage.js';
import { db } from '../../db.js';
import { leads, auditTrail } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { evaluateNextBestAction } from './autonomous-agent.js';

export interface FathomWebhookPayload {
  event: string;
  data: {
    id?: string;
    meeting_url?: string;
    transcript?: string;
    summary?: string;
    attendees?: Array<{ name: string; email: string }>;
  }
}

/**
 * Parses and processes incoming webhook payload from Fathom AI
 */
export async function processFathomWebhook(payload: FathomWebhookPayload) {
  if (!process.env.FATHOM_API_KEY) {
    console.warn("FATHOM_API_KEY is not set. Fathom webhooks are being received but API key is missing for further requests.");
  }
  
  if (payload.event !== 'meeting.finished') {
    return; // Only process finished meetings
  }

  const { id: fathomMeetingId, meeting_url, transcript, summary, attendees } = payload.data;
  
  if (!attendees || attendees.length === 0) return;

  // For each attendee, attempt to match to an existing lead in the system
  for (const attendee of attendees) {
    if (!attendee.email) continue;
    
    // Find matching lead
    const matchedLeads = await db.select().from(leads).where(eq(leads.email, attendee.email));
    
    if (matchedLeads.length > 0) {
      const lead = matchedLeads[0];
      
      // Store fathom meeting ID and summary context on the lead
      await db.update(leads)
        .set({ 
          fathomMeetingId: fathomMeetingId || meeting_url,
          metadata: {
            ...lead.metadata,
            latest_fathom_summary: summary,
            latest_fathom_transcript: transcript
          }
        })
        .where(eq(leads.id, lead.id));
        
      // Create Audit Trail Entry
      await db.insert(auditTrail).values({
        userId: lead.userId,
        leadId: lead.id,
        action: 'fathom_meeting_finished',
        details: {
          meeting_url,
          summary_snippet: summary ? summary.substring(0, 100) + '...' : null
        }
      });
      
      console.log(`✅ Fathom meeting processed for lead ${lead.email} (ID: ${lead.id})`);
      
      // Phase 3: Trigger the autonomous-agent.ts to evaluate the summary 
      // and determine the exact next action.
      try {
        await evaluateNextBestAction(lead.id, summary || transcript || "No meeting context provided.");
      } catch (e) {
        console.error("AI Next Best Action routing failed:", e);
      }
    }
  }
}
