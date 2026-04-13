import { storage } from '../../storage.js';
import { db } from '../../db.js';
import { leads, auditTrail, fathomCalls, prospectObjections } from '../../../shared/schema.js';
import { eq, and, ilike, desc } from 'drizzle-orm';
import { evaluateNextBestAction } from './autonomous-agent.js';
import fetch from 'node-fetch';

export interface FathomWebhookPayload {
  event: string;
  data: {
    id: string;
    meeting_url?: string;
    transcript?: string;
    summary?: string;
    title?: string;
    occurred_at?: string;
    video_url?: string;
    video_thumbnail?: string;
    attendees?: Array<{ name: string; email: string }>;
  }
}

/**
 * Fetches full meeting details from Fathom API using the recording ID
 */
export async function fetchFathomMeetingDetails(recordingId: string) {
  if (!process.env.FATHOM_API_KEY) {
    throw new Error("FATHOM_API_KEY is missing");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    // According to research, the transcript is at /external/v1/recordings/{id}/transcript
    const response = await fetch(`https://api.fathom.ai/external/v1/recordings/${recordingId}/transcript`, {
      headers: {
        'X-Api-Key': process.env.FATHOM_API_KEY
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Fathom API Error (${response.status}):`, errorBody);
      throw new Error(`Failed to fetch Fathom transcript: ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }

}
/**
 * Parses and processes incoming webhook payload from Fathom AI
 */
export async function processFathomWebhook(payload: FathomWebhookPayload) {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    console.warn("FATHOM_API_KEY is not set. Fathom webhooks are being received but API key is missing for further requests.");
  }
  
  if (payload.event !== 'meeting.finished') {
    return; // Only process finished meetings
  }

  const { id: fathomMeetingId, meeting_url, transcript: initialTranscript, summary: initialSummary, attendees, title, occurred_at, video_url, video_thumbnail } = payload.data;
  
  if (!attendees || attendees.length === 0) return;

  // Idempotency: Check if this meeting has already been fully processed
  const existingCalls = await db.select().from(fathomCalls).where(eq(fathomCalls.fathomMeetingId, fathomMeetingId));
  if (existingCalls.length > 0) {
    console.log(`[Idempotency] Fathom meeting ${fathomMeetingId} already exists. Skipping duplicate processing.`);
    return;
  }

  let fullTranscript = initialTranscript;
  let fullSummary = initialSummary;

  // Proactively fetch full details if missing or as verified backup
  if (apiKey && fathomMeetingId) {
    try {
      const details: any = await fetchFathomMeetingDetails(fathomMeetingId);
      if (details.transcript) fullTranscript = details.transcript;
      if (details.summary) fullSummary = details.summary;
    } catch (e: any) {
      console.warn(`Could not fetch full Fathom details for ${fathomMeetingId}:`, e.message);
    }
  }

  // For each attendee, attempt to match to an existing lead in the system
  for (const attendee of attendees) {
    if (!attendee.email) continue;
    
    // Find matching lead
    // Find matching lead using case-insensitive comparison
    const matchedLeads = await db.select().from(leads).where(ilike(leads.email, attendee.email.trim()));
    
    if (matchedLeads.length > 0) {
      const lead = matchedLeads[0];
      
      // 1. Persist to fathom_calls table via storage
      await storage.createFathomCall({
        userId: lead.userId,
        leadId: lead.id,
        fathomMeetingId: fathomMeetingId,
        title: title || `Meeting with ${lead.name}`,
        summary: fullSummary,
        transcript: fullTranscript,
        videoUrl: video_url || meeting_url,
        videoThumbnail: video_thumbnail,
        occurredAt: occurred_at ? new Date(occurred_at) : new Date(),
        metadata: {
          attendees,
          source: 'webhook'
        }
      });

      // 2. Update lead status if necessary via storage
      await storage.updateLead(lead.id, { 
        fathomMeetingId: fathomMeetingId,
        status: lead.status === 'booked' || lead.status === 'converted' ? lead.status : 'warm', 
        updatedAt: new Date()
      });
        
      // 3. Create Audit Trail Entry via storage
      await storage.createAuditLog({
        userId: lead.userId,
        leadId: lead.id,
        action: 'fathom_meeting_finished',
        details: {
          meeting_url,
          summary_snippet: fullSummary ? fullSummary.substring(0, 100) + '...' : null
        }
      });
      
      console.log(`✅ Fathom meeting processed and saved for lead ${lead.email} (ID: ${lead.id})`);
      
      // Phase 11 & 12: Query past calls for Long Term Memory
      let pastContext = "";
      try {
        const pastCalls = await db.select()
          .from(fathomCalls)
          .where(eq(fathomCalls.leadId, lead.id))
          .orderBy(desc(fathomCalls.occurredAt))
          .limit(3);
        
        if (pastCalls.length > 0) {
          pastContext = pastCalls.map((c: any) => `Call ${c.occurredAt?.toISOString()}: ${c.summary}`).join("\n---\n");
        }
      } catch (e) {
        console.warn("Could not query past calls for context", e);
      }

      // 4. Autonomous Intelligence Analysis (Coaching & Outcome Audit)
      try {
        const { analyzeMeetingIntelligence } = await import('./post-call-intelligence.js');
        const analysis = await analyzeMeetingIntelligence(
          fullTranscript || "", 
          fullSummary || "",
          pastContext
        );
        
        // Update the call record with the analysis result
        await db.update(fathomCalls)
          .set({ analysis })
          .where(and(eq(fathomCalls.fathomMeetingId, fathomMeetingId), eq(fathomCalls.leadId, lead.id)));

        // Phase 3: Persist BANT to Leads table autonomously
        if (analysis.bant) {
           await db.update(leads)
             .set({ bant: analysis.bant })
             .where(eq(leads.id, lead.id));
           console.log(`🧠 BANT Data automatically enriched for ${lead.email}`);
        }

        // Phase 4: Save Primary Objection into Battle Card queue
        if (analysis.primaryObjection) {
           await db.insert(prospectObjections).values({
               leadId: lead.id,
               userId: lead.userId,
               fathomMeetingId: fathomMeetingId,
               category: analysis.primaryObjection.category,
               snippet: analysis.primaryObjection.snippet,
           });
           console.log(`⚔️ Objection Logged for Battle-Card agent: ${analysis.primaryObjection.category}`);
        }

        console.log(`🧠 Autonomous Coaching Analysis complete for ${lead.email}`);
      } catch (e) {
        console.error("Coaching analysis failed:", e);
        // Persist failure state instead of mock data
        await db.update(fathomCalls)
          .set({ analysis: { status: 'failed_to_analyze', error: (e as Error).message } })
          .where(and(eq(fathomCalls.fathomMeetingId, fathomMeetingId), eq(fathomCalls.leadId, lead.id)));
      }

      // 5. Trigger the autonomous-agent.ts to evaluate the summary 
      try {
        await evaluateNextBestAction(lead.id, fullSummary || fullTranscript || "No meeting context provided.");
      } catch (e) {
        console.error("AI Next Best Action routing failed:", e);
      }
    }
  }
}
