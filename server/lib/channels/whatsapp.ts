import { supabaseAdmin } from '../supabase-admin';
import { formatWhatsAppLink, formatWhatsAppMeeting, type DMButton } from '../ai/dm-formatter';

/**
 * WhatsApp messaging functions using WhatsApp Business API with rich formatting

import { storage } from '../../storage';

/**
 * Check if we can send a session message to this phone number
 * WhatsApp allows session messages only within 24 hours of last inbound message
 */
async function checkMessagingWindow(userId: string, recipientPhone: string): Promise<boolean> {
  if (!supabaseAdmin) {
    return false;
  }

  // Get the lead by phone number
  const lead = await storage.getLeadByPhone(userId, recipientPhone);
  
  if (!lead) {
    // No lead exists = never messaged us = can't send
    return false;
  }

  // Get the most recent INBOUND message from this lead
  const { data: recentMessage } = await supabaseAdmin
    .from('messages')
    .select('created_at')
    .eq('lead_id', lead.id)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!recentMessage) {
    // Lead exists but has never sent us a message
    return false;
  }

  // Check if message was within last 24 hours
  const lastMessageTime = new Date(recentMessage.created_at);
  const now = new Date();
  const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastMessage <= 24;
}


 */

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
}

interface WhatsAppMessageOptions {
  button?: DMButton;
  isMeetingLink?: boolean;
}

/**
 * Send a message via WhatsApp Business API with optional rich formatting
 */
export async function sendWhatsAppMessage(
  userId: string,
  recipientPhone: string,
  message: string,
  options: WhatsAppMessageOptions = {}
): Promise<void> {
  // CRITICAL: Enforce 24-hour messaging window
  // WhatsApp only allows session messages to users who messaged you in last 24 hours
  const canSendSessionMessage = await checkMessagingWindow(userId, recipientPhone);
  
  if (!canSendSessionMessage) {
    throw new Error(
      'Cannot send message: User has not messaged you in the last 24 hours. ' +
      'Use a WhatsApp Template Message instead, or wait for the user to message you first.'
    );
  }
  
  // Apply formatting if button is provided
  let formattedMessage = message;
  if (options.button) {
    if (options.isMeetingLink) {
      formattedMessage = formatWhatsAppMeeting(message, options.button.url);
    } else {
      formattedMessage = formatWhatsAppLink(message, options.button);
    }
  }
  // Get WhatsApp credentials for user
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }
  
  const { data: integration } = await supabaseAdmin
    .from('integrations')
    .select('credentials')
    .eq('user_id', userId)
    .eq('provider', 'whatsapp')
    .eq('is_active', true)
    .single();

  if (!integration?.credentials) {
    throw new Error('WhatsApp not connected');
  }

  const config = integration.credentials as WhatsAppConfig;
  const endpoint = `https://graph.facebook.com/${config.apiVersion || 'v18.0'}/${config.phoneNumberId}/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'text',
      text: {
        preview_url: options.button ? true : false, // Enable link preview for buttons
        body: formattedMessage
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send WhatsApp message');
  }
}

/**
 * Send a template message via WhatsApp
 */
export async function sendWhatsAppTemplate(
  userId: string,
  recipientPhone: string,
  templateName: string,
  parameters: string[]
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }
  
  const { data: integration } = await supabaseAdmin
    .from('integrations')
    .select('credentials')
    .eq('user_id', userId)
    .eq('provider', 'whatsapp')
    .eq('is_active', true)
    .single();

  if (!integration?.credentials) {
    throw new Error('WhatsApp not connected');
  }

  const config = integration.credentials as WhatsAppConfig;
  const endpoint = `https://graph.facebook.com/${config.apiVersion || 'v18.0'}/${config.phoneNumberId}/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en'
        },
        components: parameters.length > 0 ? [
          {
            type: 'body',
            parameters: parameters.map(text => ({ type: 'text', text }))
          }
        ] : undefined
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send WhatsApp template');
  }
}

/**
 * Send audio/voice message via WhatsApp Business API
 * Note: Audio file must be publicly accessible HTTPS URL in supported format (mp3, ogg, amr)
 */
export async function sendWhatsAppAudio(
  userId: string,
  recipientPhone: string,
  audioUrl: string
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }
  
  if (!audioUrl.startsWith('https://')) {
    throw new Error('Audio URL must be HTTPS for WhatsApp Business API');
  }
  
  const supportedFormats = ['.mp3', '.ogg', '.amr'];
  const hasValidFormat = supportedFormats.some(format => audioUrl.toLowerCase().includes(format));
  
  if (!hasValidFormat) {
    console.warn(`WhatsApp audio URL may not be in supported format (mp3, ogg, amr): ${audioUrl}`);
  }
  
  const { data: integration } = await supabaseAdmin
    .from('integrations')
    .select('credentials')
    .eq('user_id', userId)
    .eq('provider', 'whatsapp')
    .eq('is_active', true)
    .single();

  if (!integration?.credentials) {
    throw new Error('WhatsApp not connected');
  }

  const config = integration.credentials as WhatsAppConfig;
  const endpoint = `https://graph.facebook.com/${config.apiVersion || 'v18.0'}/${config.phoneNumberId}/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'audio',
      audio: {
        link: audioUrl


/**
 * Check if a lead requires a template message (outside 24-hour window)
 * This can be used by the UI to show appropriate messaging options
 */
export async function requiresTemplateMessage(
  userId: string,
  recipientPhone: string
): Promise<boolean> {
  const canSendSession = await checkMessagingWindow(userId, recipientPhone);
  return !canSendSession;
}

/**
 * Get time remaining in messaging window
 * Returns hours remaining, or null if window has expired
 */
export async function getMessagingWindowTimeRemaining(
  userId: string,
  recipientPhone: string
): Promise<number | null> {
  if (!supabaseAdmin) {
    return null;
  }

  const lead = await storage.getLeadByPhone(userId, recipientPhone);
  if (!lead) return null;

  const { data: recentMessage } = await supabaseAdmin
    .from('messages')
    .select('created_at')
    .eq('lead_id', lead.id)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!recentMessage) return null;

  const lastMessageTime = new Date(recentMessage.created_at);
  const now = new Date();
  const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = 24 - hoursSinceLastMessage;

  return hoursRemaining > 0 ? hoursRemaining : null;
}

      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send WhatsApp audio');
  }
}

/**
 * Get WhatsApp message status
 */
export async function getWhatsAppMessageStatus(
  userId: string,
  messageId: string
): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }
  
  const { data: integration } = await supabaseAdmin
    .from('integrations')
    .select('credentials')
    .eq('user_id', userId)
    .eq('provider', 'whatsapp')
    .eq('is_active', true)
    .single();

  if (!integration?.credentials) {
    throw new Error('WhatsApp not connected');
  }

  const config = integration.credentials as WhatsAppConfig;
  const endpoint = `https://graph.facebook.com/${config.apiVersion || 'v18.0'}/${messageId}?fields=status&access_token=${config.accessToken}`;

  const response = await fetch(endpoint);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to get message status');
  }

  return data.status;
}