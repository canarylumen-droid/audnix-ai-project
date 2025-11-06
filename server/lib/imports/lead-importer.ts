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
    const decryptedMetaJson = decrypt(igIntegration.encryptedMeta);
    const decryptedMeta = JSON.parse(decryptedMetaJson);
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

          // Actually create the lead
          lead = await storage.createLead(leadData);
          results.leadsImported++;
        } else {
          lead = existingLead;
        }

        // Import COMPLETE message history (all messages, not just recent)
        if (lead) {
          try {
            // Fetch ALL messages from the conversation thread
            const allMessages = await oauth.getAllMessages(accessToken, conversation.id);
            
            for (const msg of allMessages) {
              // Check if message already exists
              const existingMessages = await storage.getMessages(lead.id);
              const exists = existingMessages.some(m => 
                (m.metadata as any)?.ig_message_id === msg.id
              );
              
              if (!exists) {
                const messageData = {
                  leadId: lead.id,
                  userId,
                  provider: 'instagram' as const,
                  direction: msg.from?.id === conversation.participants?.[0]?.id ? 'inbound' as const : 'outbound' as const,
                  body: msg.message || '',
                  audioUrl: msg.audio_url || null,
                  metadata: { 
                    ig_message_id: msg.id,
                    timestamp: msg.created_time,
                    has_media: !!msg.attachments?.length,
                  }
                };

                await storage.createMessage(messageData);
                results.messagesImported++;
              }
            }
          } catch (error) {
            console.error(`Error importing messages for ${conversation.id}:`, error);
            results.errors.push(`Failed to import messages for conversation ${conversation.id}`);
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

    const decryptedMetaJson = decrypt(mcIntegration.encryptedMeta);
    const decryptedMeta = JSON.parse(decryptedMetaJson);
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
