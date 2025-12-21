import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase-admin.js';
import { analyzeLeadIntent, IntentAnalysis } from '../ai/intent-analyzer.js';
import { followUpWorker } from '../ai/follow-up-worker.js';
import { saveConversationToMemory } from '../ai/conversation-ai.js';
import { scheduleAutomatedDMReply, checkUserAutomationSettings } from '../ai/dm-automation.js';
import { storage } from '../../storage.js';
import crypto from 'crypto';
import { recordWebhookEvent } from '../../routes/instagram-status.js';

interface InstagramMessage {
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
}

interface InstagramCommentValue {
  from: { id: string; username: string };
  media: { id: string };
  text: string;
  id: string;
}

interface InstagramWebhookEntry {
  id: string;
  time: number;
  messaging?: InstagramMessage[];
  changes?: Array<{
    field: string;
    value: InstagramCommentValue;
  }>;
}

interface InstagramProfile {
  name?: string;
  username?: string;
}

interface LeadRecord {
  id: string;
  user_id: string;
  external_id: string;
  name: string;
  channel: string;
  status: string;
  tags: string[];
  last_message_at: string;
  lead_score?: number;
  message_count?: number;
  follow_up_count?: number;
  preferred_name?: string;
  intent_analysis?: IntentAnalysis;
}

interface IntegrationRecord {
  user_id: string;
}

function verifySignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  
  // Check for explicit test mode flag (controlled, not automatic)
  const isTestMode = process.env.INSTAGRAM_WEBHOOK_TEST_MODE === 'true';
  
  if (!signature) {
    console.log('[IG_WEBHOOK] No x-hub-signature-256 header found');
    if (isTestMode) {
      console.warn('[IG_WEBHOOK] TEST MODE: Allowing unsigned request (disable in production!)');
      return true;
    }
    return false;
  }

  const appSecret = process.env.META_APP_SECRET || '';
  if (!appSecret) {
    console.error('[IG_WEBHOOK] META_APP_SECRET not configured');
    if (isTestMode) {
      console.warn('[IG_WEBHOOK] TEST MODE: Allowing request without META_APP_SECRET');
      return true;
    }
    return false;
  }

  // Raw body must be preserved by middleware for signature verification
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.error('[IG_WEBHOOK] Raw body not available - middleware not configured for this route');
    console.error('[IG_WEBHOOK] Ensure route uses express.json with verify callback to preserve rawBody');
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const expectedFull = `sha256=${expectedSignature}`;
  const isValid = signature === expectedFull;
  
  if (!isValid) {
    console.log('[IG_WEBHOOK] Signature mismatch');
    console.log('[IG_WEBHOOK] Received:', signature);
    console.log('[IG_WEBHOOK] Expected:', expectedFull);
  }

  return isValid;
}

export function handleInstagramVerification(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_VERIFY_TOKEN;
  
  console.log('[Instagram Webhook] Verification request received');
  console.log('[Instagram Webhook] Mode:', mode);
  console.log('[Instagram Webhook] Token received:', token);
  console.log('[Instagram Webhook] Token configured:', !!verifyToken);
  
  // If no token configured, show helpful error
  if (!verifyToken) {
    console.error('[Instagram Webhook] ❌ META_VERIFY_TOKEN not configured!');
    console.error('[Instagram Webhook] Set META_VERIFY_TOKEN in environment to fix this');
    console.log('[Instagram Webhook] Token received from Meta:', token);
    res.status(403).json({ error: 'META_VERIFY_TOKEN not configured on server' });
    return;
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Instagram Webhook] ✅ Verification successful');
    res.status(200).type('text/plain').send(challenge);
  } else {
    console.error('[Instagram Webhook] ❌ Verification failed');
    console.error('[Instagram Webhook] Expected token:', verifyToken);
    console.error('[Instagram Webhook] Received token:', token);
    res.sendStatus(403);
  }
}

export async function handleInstagramWebhook(req: Request, res: Response): Promise<void> {
  try {
    console.log('[IG_EVENT] Webhook received:', JSON.stringify(req.body, null, 2));
    recordWebhookEvent();
    
    if (!verifySignature(req)) {
      console.log('[IG_EVENT] Signature verification failed');
      res.sendStatus(403);
      return;
    }

    const { object, entry } = req.body as { object: string; entry: InstagramWebhookEntry[] };
    console.log(`[IG_EVENT] Object: ${object}, Entries: ${entry?.length || 0}`);

    if (object !== 'instagram') {
      console.log(`[IG_EVENT] Ignoring non-instagram object: ${object}`);
      res.sendStatus(404);
      return;
    }

    for (const item of entry) {
      console.log(`[IG_EVENT] Processing entry ID: ${item.id}, Time: ${item.time}`);
      
      if (item.messaging) {
        for (const message of item.messaging) {
          const eventType = message.message ? 'message' : 
                           message.postback ? 'postback' : 
                           'unknown';
          console.log(`[IG_EVENT] Message event: ${eventType}, Sender: ${message.sender.id}`);
          
          if (message.message?.text) {
            console.log(`[IG_EVENT] Message text: "${message.message.text.substring(0, 100)}..."`);
          }
          
          await processInstagramMessage(message);
        }
      }

      if (item.changes) {
        for (const change of item.changes) {
          console.log(`[IG_EVENT] Change event: ${change.field}`);
          
          if (change.field === 'comments') {
            console.log(`[IG_EVENT] Comment from: ${change.value.from?.username}, text: "${change.value.text?.substring(0, 100)}..."`);
            await processInstagramComment(change.value);
          } else if (change.field === 'message_reactions') {
            console.log(`[IG_EVENT] Message reaction received`);
          } else if (change.field === 'messaging_seen') {
            console.log(`[IG_EVENT] Message seen event`);
          } else if (change.field === 'messaging_postbacks') {
            console.log(`[IG_EVENT] Postback event`);
          } else if (change.field === 'messaging_referral') {
            console.log(`[IG_EVENT] Referral event`);
          }
        }
      }
    }

    console.log('[IG_EVENT] Webhook processed successfully');
    res.sendStatus(200);
  } catch (error) {
    console.error('[IG_EVENT] Error handling Instagram webhook:', error);
    res.sendStatus(500);
  }
}

async function processInstagramMessage(message: InstagramMessage): Promise<void> {
  try {
    const senderId = message.sender.id;
    const messageText = message.message?.text;
    
    if (!messageText) return;

    if (!supabaseAdmin) {
      console.error('Supabase admin not configured');
      return;
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integrations')
      .select('user_id')
      .eq('provider', 'instagram')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      if (integrationError) {
        console.error('Error fetching integration:', integrationError);
      }
      return;
    }

    const typedIntegration = integration as IntegrationRecord;

    const { data: existingLead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', typedIntegration.user_id)
      .eq('external_id', senderId)
      .single();

    if (leadError && leadError.code !== 'PGRST116') {
      console.error('Error fetching lead:', leadError);
    }

    let lead: LeadRecord | null = existingLead as LeadRecord | null;

    if (!lead) {
      const senderProfile = await fetchInstagramProfile(senderId, typedIntegration.user_id);
      
      const { data: newLead, error: createError } = await supabaseAdmin
        .from('leads')
        .insert({
          user_id: typedIntegration.user_id,
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

      if (createError) {
        console.error('Error creating lead:', createError);
        return;
      }

      lead = newLead as LeadRecord;

      const { error: realtimeError } = await supabaseAdmin
        .from('realtime_events')
        .insert({
          user_id: typedIntegration.user_id,
          event_type: 'new_lead',
          payload: { lead: newLead }
        });

      if (realtimeError) {
        console.error('Error inserting realtime event:', realtimeError);
      }
    }

    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: typedIntegration.user_id,
        lead_id: lead.id,
        content: messageText,
        role: 'user',
        channel: 'instagram',
        external_id: message.message?.mid,
        created_at: new Date().toISOString()
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
    }

    const intent = await analyzeLeadIntent(messageText, lead);
    
    let newStatus = lead.status;
    let newTags = [...(lead.tags || [])];
    
    if (intent.isInterested && intent.confidence > 0.7) {
      newStatus = 'interested';
      newTags.push('hot-lead');
      
      if (intent.wantsToSchedule || intent.readyToBuy) {
        newStatus = 'converting';
        newTags.push('ready-to-buy');
        
        await scheduleCalendarMeeting(lead, typedIntegration.user_id);
      }
    } else if (intent.isNegative && intent.confidence > 0.7) {
      newStatus = 'not_interested';
      newTags.push('cold');
    } else if (intent.needsMoreInfo) {
      newStatus = 'nurturing';
      newTags.push('needs-info');
    }

    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        status: newStatus,
        tags: Array.from(new Set(newTags)),
        last_message_at: new Date().toISOString(),
        lead_score: calculateLeadScore(intent, lead),
        intent_analysis: intent
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Error updating lead:', updateError);
    }

    if (newStatus !== 'not_interested' && newStatus !== 'converted') {
      const { error: queueError } = await supabaseAdmin
        .from('follow_up_queue')
        .insert({
          user_id: typedIntegration.user_id,
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

      if (queueError) {
        console.error('Error adding to follow-up queue:', queueError);
      }
    }

    const { error: activityError } = await supabaseAdmin
      .from('recent_activities')
      .insert({
        user_id: typedIntegration.user_id,
        lead_id: lead.id,
        activity_type: 'message_received',
        channel: 'instagram',
        description: `${lead.name} sent: "${messageText.substring(0, 50)}..."`,
        metadata: { intent, auto_tagged: true },
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('Error recording activity:', activityError);
    }

    try {
      const messages = await storage.getMessagesByLeadId(lead.id);
      const leadData = await storage.getLeadById(lead.id);
      
      if (messages.length > 0 && leadData) {
        await saveConversationToMemory(typedIntegration.user_id, leadData, messages);
      }
    } catch (memoryError) {
      console.error('Failed to save conversation to memory:', memoryError);
    }

    try {
      const automationSettings = await checkUserAutomationSettings(typedIntegration.user_id);
      
      if (automationSettings.enabled && newStatus !== 'not_interested') {
        console.log(`[IG_EVENT] Scheduling automated DM reply for lead ${lead.name}`);
        
        await scheduleAutomatedDMReply(
          typedIntegration.user_id,
          lead.id,
          senderId,
          messageText,
          intent
        );
        
        console.log(`[IG_EVENT] Automated reply scheduled with 2-8 min delay`);
      } else {
        console.log(`[IG_EVENT] DM automation skipped - enabled: ${automationSettings.enabled}, status: ${newStatus}`);
      }
    } catch (automationError) {
      console.error('[IG_EVENT] Error scheduling DM automation:', automationError);
    }

  } catch (error) {
    console.error('Error processing Instagram message:', error);
  }
}

async function processInstagramComment(comment: InstagramCommentValue): Promise<void> {
  try {
    const { from, text, media } = comment;
    
    if (!supabaseAdmin) {
      console.error('Supabase admin not configured');
      return;
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integrations')
      .select('user_id')
      .eq('provider', 'instagram')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      if (integrationError) {
        console.error('Error fetching integration:', integrationError);
      }
      return;
    }

    const typedIntegration = integration as IntegrationRecord;

    const { data: existingLead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', typedIntegration.user_id)
      .eq('external_id', from.id)
      .single();

    if (leadError && leadError.code !== 'PGRST116') {
      console.error('Error fetching lead:', leadError);
    }

    let lead: LeadRecord | null = existingLead as LeadRecord | null;

    if (!lead) {
      const { data: newLead, error: createError } = await supabaseAdmin
        .from('leads')
        .insert({
          user_id: typedIntegration.user_id,
          external_id: from.id,
          name: from.username,
          channel: 'instagram',
          status: 'new',
          tags: ['instagram-comment', 'auto-captured'],
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating lead:', createError);
        return;
      }

      lead = newLead as LeadRecord;
    }

    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: typedIntegration.user_id,
        lead_id: lead.id,
        content: text,
        role: 'user',
        channel: 'instagram-comment',
        metadata: { media_id: media.id },
        created_at: new Date().toISOString()
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
    }

    const intent = await analyzeLeadIntent(text, lead);
    
    if (intent.isInterested || intent.hasQuestion) {
      const { error: queueError } = await supabaseAdmin
        .from('follow_up_queue')
        .insert({
          user_id: typedIntegration.user_id,
          lead_id: lead.id,
          channel: 'instagram',
          status: 'pending',
          scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          context: { 
            comment_text: text,
            media_id: media.id,
            priority: 'high'
          }
        });

      if (queueError) {
        console.error('Error adding to follow-up queue:', queueError);
      }

      try {
        const automationSettings = await checkUserAutomationSettings(typedIntegration.user_id);
        
        if (automationSettings.enabled) {
          console.log(`[IG_EVENT] Scheduling automated DM reply for comment from ${from.username}`);
          
          await scheduleAutomatedDMReply(
            typedIntegration.user_id,
            lead.id,
            from.id,
            text,
            intent
          );
        }
      } catch (automationError) {
        console.error('[IG_EVENT] Error scheduling comment DM automation:', automationError);
      }
    }

  } catch (error) {
    console.error('Error processing Instagram comment:', error);
  }
}

async function fetchInstagramProfile(userId: string, appUserId: string): Promise<InstagramProfile> {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin not configured');
      return { username: 'Instagram User' };
    }

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', appUserId)
      .eq('provider', 'instagram')
      .single();

    if (tokenError || !tokenData) {
      if (tokenError) {
        console.error('Error fetching token:', tokenError);
      }
      return { username: 'Instagram User' };
    }

    if (!/^\d+$/.test(userId)) {
      console.error('Invalid Instagram user ID format');
      return { username: 'Instagram User' };
    }

    const allowedHost = 'graph.instagram.com';
    const url = new URL(`https://${allowedHost}/${userId}`);
    url.searchParams.set('fields', 'name,username');
    url.searchParams.set('access_token', tokenData.access_token);
    
    if (url.hostname !== allowedHost) {
      return { username: 'Instagram User' };
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('Instagram API error:', response.status, response.statusText);
      return { username: 'Instagram User' };
    }
    
    const profile = await response.json() as InstagramProfile;
    return profile;
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    return { username: 'Instagram User' };
  }
}

function calculateLeadScore(intent: IntentAnalysis, lead: LeadRecord): number {
  let score = lead.lead_score || 50;
  
  if (intent.isInterested) score += 20;
  if (intent.wantsToSchedule) score += 30;
  if (intent.readyToBuy) score = Math.max(score, 90);
  if (intent.isNegative) score -= 30;
  if (intent.hasObjection) score -= 10;
  
  const messageCount = lead.message_count || 1;
  if (messageCount > 5) score += 10;
  if (messageCount > 10) score += 10;
  
  const lastMessageDays = (Date.now() - new Date(lead.last_message_at).getTime()) / (1000 * 60 * 60 * 24);
  if (lastMessageDays > 7) score -= 10;
  if (lastMessageDays > 30) score -= 20;
  
  return Math.max(0, Math.min(100, score));
}

function getSmartScheduleTime(intent: IntentAnalysis, lead: LeadRecord): string {
  const now = Date.now();
  let delayMs: number;
  
  if (intent.wantsToSchedule || intent.readyToBuy) {
    delayMs = (2 + Math.random() * 3) * 60 * 1000;
  } else if (intent.isInterested) {
    delayMs = (15 + Math.random() * 15) * 60 * 1000;
  } else if (intent.hasQuestion) {
    delayMs = (10 + Math.random() * 10) * 60 * 1000;
  } else {
    const followUpCount = lead.follow_up_count || 0;
    if (followUpCount === 0) {
      delayMs = (60 + Math.random() * 60) * 60 * 1000;
    } else if (followUpCount < 3) {
      delayMs = 24 * 60 * 60 * 1000;
    } else {
      delayMs = 3 * 24 * 60 * 60 * 1000;
    }
  }
  
  return new Date(now + delayMs).toISOString();
}

async function scheduleCalendarMeeting(lead: LeadRecord, userId: string): Promise<void> {
  if (!supabaseAdmin) {
    console.error('Supabase admin not configured');
    return;
  }

  const { error } = await supabaseAdmin
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

  if (error) {
    console.error('Error scheduling calendar meeting:', error);
  }
}

function getNextAvailableSlot(_userId: string): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(14, 0, 0, 0);
  return date.toISOString();
}

function generateMeetingLink(): string {
  return `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;
}
