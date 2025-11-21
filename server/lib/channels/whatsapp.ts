import { supabaseAdmin } from '../supabase-admin';
import { formatWhatsAppLink, formatWhatsAppMeeting, type DMButton } from '../ai/dm-formatter';

/**
 * WhatsApp messaging functions using WhatsApp Business API with rich formatting

import { storage } from '../../storage';

/**
 * Check if we can send a message to this phone number
 * For imported leads: Allow first-time outreach (they're in your contacts)
 * For ongoing conversations: Respect 24-hour window
 */
async function checkMessagingWindow(userId: string, recipientPhone: string): Promise<{ 
  canSend: boolean; 
  isFirstMessage: boolean;
  reason?: string;
}> {
  if (!supabaseAdmin) {
    return { canSend: false, isFirstMessage: false, reason: 'Database not configured' };
  }

  // Get the lead by phone number
  const lead = await storage.getLeadByPhone(userId, recipientPhone);
  
  if (!lead) {
    // Lead doesn't exist in database - could be a new CSV import
    // Allow sending if using WhatsApp Business Cloud API (not WhatsApp Web)
    // The actual API call will fail if we don't have permission
    return { canSend: true, isFirstMessage: true, reason: 'New lead - attempting cold outreach' };
  }

  // Check if we've ever sent a message to this lead
  const { data: sentMessages } = await supabaseAdmin
    .from('messages')
    .select('created_at')
    .eq('lead_id', lead.id)
    .eq('direction', 'outbound')
    .limit(1);

  const isFirstMessage = !sentMessages || sentMessages.length === 0;

  // If this is the first message to an imported contact, allow it
  if (isFirstMessage) {
    return { canSend: true, isFirstMessage: true };
  }

  // For follow-ups, check the 24-hour window
  const { data: recentInbound } = await supabaseAdmin
    .from('messages')
    .select('created_at')
    .eq('lead_id', lead.id)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!recentInbound) {
    // We sent messages but they never replied - can't send more
    return { 
      canSend: false, 
      isFirstMessage: false, 
      reason: 'No response from lead - waiting for reply' 
    };
  }

  // Check if message was within last 24 hours
  const lastMessageTime = new Date(recentInbound.created_at);
  const now = new Date();
  const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastMessage <= 24) {
    return { canSend: true, isFirstMessage: false };
  }

  return { 
    canSend: false, 
    isFirstMessage: false, 
    reason: `Last reply was ${Math.round(hoursSinceLastMessage)}h ago - outside 24h window` 
  };
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
  // Check messaging permissions
  const messagingStatus = await checkMessagingWindow(userId, recipientPhone);
  
  if (!messagingStatus.canSend) {
    throw new Error(
      `Cannot send message: ${messagingStatus.reason || 'Unknown reason'}. ` +
      (messagingStatus.isFirstMessage ? '' : 'Consider using a WhatsApp Template Message.')
    );
  }

  // Log if this is first outreach to imported contact
  if (messagingStatus.isFirstMessage) {
    console.log(`📤 First-time outreach to imported contact: ${recipientPhone}`);
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