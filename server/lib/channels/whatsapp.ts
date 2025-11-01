import { supabaseAdmin } from '../supabase-admin';
import { formatWhatsAppLink, formatWhatsAppMeeting, type DMButton } from '../ai/dm-formatter';

/**
 * WhatsApp messaging functions using WhatsApp Business API with rich formatting
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