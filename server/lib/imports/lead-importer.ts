import { storage } from "../../storage";
import { InstagramOAuth } from "../oauth/instagram";
import { decrypt } from "../crypto/encryption";
import type { Lead, Message } from "@shared/schema";

/**
 * Import leads and conversation history from Instagram
 */
export async function importInstagramLeads(userId: string): Promise<{
  leadsImported: number;
  messagesImported: number;
  errors: string[];
}> {
  const results = {
    leadsImported: 0,
    messagesImported: 0,
    errors: [] as string[]
  };

  try {
    // Get user's Instagram integration
    const integrations = await storage.getIntegrations(userId);
    const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);

    if (!igIntegration) {
      results.errors.push('Instagram not connected');
      return results;
    }

    // Decrypt tokens
    const decryptedMeta = JSON.parse(igIntegration.encryptedMeta);
    const accessToken = decryptedMeta.tokens?.access_token;

    if (!accessToken) {
      results.errors.push('No access token found');
      return results;
    }

    // Fetch Instagram conversations
    const oauth = new InstagramOAuth();
    const conversations = await oauth.getConversations(accessToken);

    for (const conversation of conversations) {
      try {
        // Check if lead already exists by external_id
        const existingLeads = await storage.getLeads({ userId, limit: 1000 });
        const existingLead = existingLeads.find(l => l.externalId === conversation.id);

        let lead: any;
        if (!existingLead) {
          // Create new lead
          const leadData = {
            userId,
            externalId: conversation.id,
            name: conversation.participants?.[0]?.username || 'Instagram User',
            channel: 'instagram' as const,
            email: null,
            phone: null,
            status: 'new' as const,
            score: 0,
            warm: false,
            lastMessageAt: conversation.updated_time ? new Date(conversation.updated_time) : null,
            tags: [],
            metadata: { username: conversation.participants?.[0]?.username }
          };

          // We need to add a createLead method to storage
          // For now, we'll skip this and log
          console.log('Would create lead:', leadData);
          results.leadsImported++;
        } else {
          lead = existingLead;
        }

        // Import message history
        if (conversation.messages) {
          for (const msg of conversation.messages) {
            const messageData = {
              leadId: lead?.id || existingLead?.id,
              userId,
              provider: 'instagram' as const,
              direction: msg.from?.id === conversation.participants?.[0]?.id ? 'inbound' as const : 'outbound' as const,
              body: msg.message || '',
              audioUrl: null,
              metadata: { ig_message_id: msg.id }
            };

            await storage.createMessage(messageData);
            results.messagesImported++;
          }
        }
      } catch (error: any) {
        results.errors.push(`Error importing conversation ${conversation.id}: ${error.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error('Instagram import error:', error);
    results.errors.push(`Import failed: ${error.message}`);
    return results;
  }
}

/**
 * Import leads and conversations from Gmail
 */
export async function importGmailLeads(userId: string): Promise<{
  leadsImported: number;
  messagesImported: number;
  errors: string[];
}> {
  const results = {
    leadsImported: 0,
    messagesImported: 0,
    errors: [] as string[]
  };

  try {
    const integrations = await storage.getIntegrations(userId);
    const gmailIntegration = integrations.find(i => i.provider === 'gmail' && i.connected);

    if (!gmailIntegration) {
      results.errors.push('Gmail not connected');
      return results;
    }

    // TODO: Implement Gmail API integration using oauth2client
    // For now, return placeholder
    results.errors.push('Gmail import not yet implemented');
    return results;
  } catch (error: any) {
    console.error('Gmail import error:', error);
    results.errors.push(`Import failed: ${error.message}`);
    return results;
  }
}

/**
 * Import leads from WhatsApp Business API
 */
export async function importWhatsAppLeads(userId: string): Promise<{
  leadsImported: number;
  messagesImported: number;
  errors: string[];
}> {
  const results = {
    leadsImported: 0,
    messagesImported: 0,
    errors: [] as string[]
  };

  try {
    const integrations = await storage.getIntegrations(userId);
    const waIntegration = integrations.find(i => i.provider === 'whatsapp' && i.connected);

    if (!waIntegration) {
      results.errors.push('WhatsApp not connected');
      return results;
    }

    // TODO: Implement WhatsApp Business API integration
    results.errors.push('WhatsApp import not yet implemented');
    return results;
  } catch (error: any) {
    console.error('WhatsApp import error:', error);
    results.errors.push(`Import failed: ${error.message}`);
    return results;
  }
}

/**
 * Import leads from Manychat
 */
export async function importManychatLeads(userId: string): Promise<{
  leadsImported: number;
  messagesImported: number;
  errors: string[];
}> {
  const results = {
    leadsImported: 0,
    messagesImported: 0,
    errors: [] as string[]
  };

  try {
    const integrations = await storage.getIntegrations(userId);
    const mcIntegration = integrations.find(i => i.provider === 'manychat' && i.connected);

    if (!mcIntegration) {
      results.errors.push('Manychat not connected');
      return results;
    }

    const decryptedMeta = JSON.parse(mcIntegration.encryptedMeta);
    const apiKey = decryptedMeta.tokens?.api_key;

    if (!apiKey) {
      results.errors.push('No Manychat API key found');
      return results;
    }

    // Fetch subscribers from Manychat
    const response = await fetch('https://api.manychat.com/fb/subscriber/getInfo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      results.errors.push(`Manychat API error: ${response.statusText}`);
      return results;
    }

    const data = await response.json();
    
    // TODO: Process Manychat subscribers and create leads
    results.errors.push('Manychat import processing not yet complete');
    return results;
  } catch (error: any) {
    console.error('Manychat import error:', error);
    results.errors.push(`Import failed: ${error.message}`);
    return results;
  }
}
