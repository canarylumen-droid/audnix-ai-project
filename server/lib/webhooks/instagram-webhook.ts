import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase-admin';
import { analyzeLeadIntent } from '../ai/intent-analyzer';
import { followUpWorker } from '../ai/follow-up-worker';
import crypto from 'crypto';

interface InstagramWebhookEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text: string;
    };
    postback?: {
      payload: string;
      title: string;
    };
  }>;
  changes?: Array<{
    field: string;
    value: {
      from: { id: string; username: string };
      media: { id: string };
      text: string;
      id: string;
    };
  }>;
}

/**
 * Verify Instagram webhook signature
 */
function verifySignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.INSTAGRAM_APP_SECRET || '')
    .update(JSON.stringify(req.body))
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

/**
 * Handle Instagram webhook verification
 */
export function handleInstagramVerification(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_TOKEN) {
    console.log('Instagram webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
}

/**
 * Handle Instagram webhook events
 */
export async function handleInstagramWebhook(req: Request, res: Response) {
  // Verify signature
  if (!verifySignature(req)) {
    return res.sendStatus(403);
  }

  const { object, entry } = req.body;

  if (object !== 'instagram') {
    return res.sendStatus(404);
  }

  // Process each entry
  for (const item of entry as InstagramWebhookEntry[]) {
    // Handle direct messages
    if (item.messaging) {
      for (const message of item.messaging) {
        await processInstagramMessage(message);
      }
    }

    // Handle comments
    if (item.changes) {
      for (const change of item.changes) {
        if (change.field === 'comments') {
          await processInstagramComment(change.value);
        }
      }
    }
  }

  res.sendStatus(200);
}

/**
 * Process incoming Instagram message
 */
async function processInstagramMessage(message: any) {
  try {
    const senderId = message.sender.id;
    const messageText = message.message?.text;
    
    if (!messageText) return;

    // Find user by Instagram page ID
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('user_id')
      .eq('provider', 'instagram')
      .eq('is_active', true)
      .single();

    if (!integration) return;

    // Check if lead exists
    let { data: lead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', integration.user_id)
      .eq('external_id', senderId)
      .single();

    // Create new lead if doesn't exist
    if (!lead) {
      // Get sender profile
      const senderProfile = await fetchInstagramProfile(senderId, integration.user_id);
      
      const { data: newLead, error } = await supabaseAdmin
        .from('leads')
        .insert({
          user_id: integration.user_id,
          external_id: senderId,
          name: senderProfile.name || senderProfile.username || 'Instagram User',
          channel: 'instagram',
          status: 'new',
          last_message_at: new Date().toISOString(),
          tags: ['instagram', 'auto-captured'],
          preferred_name: senderProfile.name?.split(' ')[0]
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        return;
      }

      lead = newLead;

      // Notify via realtime
      await supabaseAdmin
        .from('realtime_events')
        .insert({
          user_id: integration.user_id,
          event_type: 'new_lead',
          payload: { lead: newLead }
        });
    }

    // Save message
    await supabaseAdmin
      .from('messages')
      .insert({
        user_id: integration.user_id,
        lead_id: lead.id,
        content: messageText,
        role: 'user',
        channel: 'instagram',
        external_id: message.message.mid,
        created_at: new Date().toISOString()
      });

    // Analyze intent and update lead status
    const intent = await analyzeLeadIntent(messageText, lead);
    
    // Auto-tag based on intent
    let newStatus = lead.status;
    let newTags = [...(lead.tags || [])];
    
    if (intent.isInterested && intent.confidence > 0.7) {
      newStatus = 'interested';
      newTags.push('hot-lead');
      
      // If very interested, mark as converting
      if (intent.wantsToSchedule || intent.readyToBuy) {
        newStatus = 'converting';
        newTags.push('ready-to-buy');
        
        // Schedule calendar invite
        await scheduleCalendarMeeting(lead, integration.user_id);
      }
    } else if (intent.isNegative && intent.confidence > 0.7) {
      newStatus = 'not_interested';
      newTags.push('cold');
    } else if (intent.needsMoreInfo) {
      newStatus = 'nurturing';
      newTags.push('needs-info');
    }

    // Update lead with new status and activity
    await supabaseAdmin
      .from('leads')
      .update({
        status: newStatus,
        tags: [...new Set(newTags)],
        last_message_at: new Date().toISOString(),
        lead_score: calculateLeadScore(intent, lead),
        intent_analysis: intent
      })
      .eq('id', lead.id);

    // Add to follow-up queue if needed
    if (newStatus !== 'not_interested' && newStatus !== 'converted') {
      await supabaseAdmin
        .from('follow_up_queue')
        .insert({
          user_id: integration.user_id,
          lead_id: lead.id,
          channel: 'instagram',
          status: 'pending',
          scheduled_at: getSmartScheduleTime(intent, lead),
          context: { 
            last_message: messageText,
            intent,
            message_count: (lead.message_count || 0) + 1
          }
        });
    }

    // Update recent activity
    await supabaseAdmin
      .from('recent_activities')
      .insert({
        user_id: integration.user_id,
        lead_id: lead.id,
        activity_type: 'message_received',
        channel: 'instagram',
        description: `${lead.name} sent: "${messageText.substring(0, 50)}..."`,
        metadata: { intent, auto_tagged: true },
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error processing Instagram message:', error);
  }
}

/**
 * Process Instagram comment
 */
async function processInstagramComment(comment: any) {
  try {
    const { from, text, media } = comment;
    
    // Find user by Instagram account
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('user_id')
      .eq('provider', 'instagram')
      .eq('is_active', true)
      .single();

    if (!integration) return;

    // Create or update lead
    let { data: lead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', integration.user_id)
      .eq('external_id', from.id)
      .single();

    if (!lead) {
      const { data: newLead } = await supabaseAdmin
        .from('leads')
        .insert({
          user_id: integration.user_id,
          external_id: from.id,
          name: from.username,
          channel: 'instagram',
          status: 'new',
          tags: ['instagram-comment', 'auto-captured'],
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      
      lead = newLead;
    }

    // Save as message
    await supabaseAdmin
      .from('messages')
      .insert({
        user_id: integration.user_id,
        lead_id: lead!.id,
        content: text,
        role: 'user',
        channel: 'instagram-comment',
        metadata: { media_id: media.id },
        created_at: new Date().toISOString()
      });

    // Analyze and respond
    const intent = await analyzeLeadIntent(text, lead!);
    
    if (intent.isInterested || intent.hasQuestion) {
      // Add to high-priority follow-up
      await supabaseAdmin
        .from('follow_up_queue')
        .insert({
          user_id: integration.user_id,
          lead_id: lead!.id,
          channel: 'instagram',
          status: 'pending',
          scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
          context: { 
            comment_text: text,
            media_id: media.id,
            priority: 'high'
          }
        });
    }

  } catch (error) {
    console.error('Error processing Instagram comment:', error);
  }
}

/**
 * Fetch Instagram user profile
 */
async function fetchInstagramProfile(userId: string, appUserId: string): Promise<any> {
  try {
    // Get access token
    const { data: tokenData } = await supabaseAdmin
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', appUserId)
      .eq('provider', 'instagram')
      .single();

    if (!tokenData) return { username: 'Instagram User' };

    const response = await fetch(
      `https://graph.instagram.com/${userId}?fields=name,username&access_token=${tokenData.access_token}`
    );
    
    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    return { username: 'Instagram User' };
  }
}

/**
 * Calculate lead score based on intent and behavior
 */
function calculateLeadScore(intent: any, lead: any): number {
  let score = lead.lead_score || 50;
  
  // Adjust based on intent
  if (intent.isInterested) score += 20;
  if (intent.wantsToSchedule) score += 30;
  if (intent.readyToBuy) score = Math.max(score, 90);
  if (intent.isNegative) score -= 30;
  if (intent.hasObjection) score -= 10;
  
  // Adjust based on engagement
  const messageCount = lead.message_count || 1;
  if (messageCount > 5) score += 10;
  if (messageCount > 10) score += 10;
  
  // Time-based decay
  const lastMessageDays = (Date.now() - new Date(lead.last_message_at).getTime()) / (1000 * 60 * 60 * 24);
  if (lastMessageDays > 7) score -= 10;
  if (lastMessageDays > 30) score -= 20;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get smart schedule time based on intent and lead history
 */
function getSmartScheduleTime(intent: any, lead: any): string {
  const now = Date.now();
  let delayMs: number;
  
  if (intent.wantsToSchedule || intent.readyToBuy) {
    // Respond within 2-5 minutes for hot leads
    delayMs = (2 + Math.random() * 3) * 60 * 1000;
  } else if (intent.isInterested) {
    // Respond within 15-30 minutes for interested leads
    delayMs = (15 + Math.random() * 15) * 60 * 1000;
  } else if (intent.hasQuestion) {
    // Respond within 10-20 minutes for questions
    delayMs = (10 + Math.random() * 10) * 60 * 1000;
  } else {
    // Standard follow-up timing
    const followUpCount = lead.follow_up_count || 0;
    if (followUpCount === 0) {
      delayMs = (60 + Math.random() * 60) * 60 * 1000; // 1-2 hours
    } else if (followUpCount < 3) {
      delayMs = 24 * 60 * 60 * 1000; // 1 day
    } else {
      delayMs = 3 * 24 * 60 * 60 * 1000; // 3 days
    }
  }
  
  return new Date(now + delayMs).toISOString();
}

/**
 * Schedule calendar meeting for converting lead
 */
async function scheduleCalendarMeeting(lead: any, userId: string) {
  // This will be implemented with Google Calendar API
  // For now, we'll create a calendar event record
  await supabaseAdmin
    .from('calendar_events')
    .insert({
      user_id: userId,
      lead_id: lead.id,
      event_type: 'meeting',
      title: `Meeting with ${lead.name}`,
      scheduled_at: getNextAvailableSlot(userId),
      status: 'pending',
      meeting_link: generateMeetingLink(),
      created_at: new Date().toISOString()
    });
}

function getNextAvailableSlot(userId: string): string {
  // For now, schedule 2 days from now at 2 PM
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(14, 0, 0, 0);
  return date.toISOString();
}

function generateMeetingLink(): string {
  return `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;
}