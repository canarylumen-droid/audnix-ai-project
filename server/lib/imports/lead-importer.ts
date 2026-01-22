
import { db } from '../../db.js';
import { storage } from '../../storage.js';
import { decrypt } from "../crypto/encryption.js";
import type { Lead, Message } from "../../../shared/schema.js";

/**
 * Import leads and conversation history from Instagram
 */
export async function importInstagramLeads(userId: string): Promise<{
  leadsImported: number;
  messagesImported: number;
  errors: string[];
}> {
  const results = { leadsImported: 0, messagesImported: 0, errors: [] as string[] };
  try {
    const user = await storage.getUserById(userId);
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const currentLeadCount = existingLeads.length;

    const maxLeads = user?.plan === 'pro' || user?.plan === 'enterprise' ? 10000 : 500;
    if (currentLeadCount >= maxLeads) {
      results.errors.push(`Lead limit reached (${maxLeads} leads).`);
      return results;
    }

    const integrations = await storage.getIntegrations(userId);
    const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);
    if (!igIntegration) {
      results.errors.push('Instagram not connected');
      return results;
    }

    const decryptedMeta = JSON.parse(decrypt(igIntegration.encryptedMeta));
    const accessToken = decryptedMeta.tokens?.access_token;
    if (!accessToken) {
      results.errors.push('No access token found');
      return results;
    }

    const { InstagramOAuth } = await import('../oauth/instagram.js');
    const oauth = new InstagramOAuth();
    const conversations = await oauth.getConversations(accessToken);

    for (const conversation of conversations) {
      try {
        let lead = existingLeads.find(l => l.externalId === conversation.id);
        if (!lead) {
          lead = await storage.createLead({
            userId,
            externalId: conversation.id,
            name: conversation.participants?.[0]?.username || 'Instagram User',
            channel: 'instagram',
            status: 'new',
            lastMessageAt: conversation.updated_time ? new Date(conversation.updated_time) : null,
            metadata: { username: conversation.participants?.[0]?.username }
          });
          results.leadsImported++;
        }

        const allMessages = await oauth.getAllMessages(accessToken, conversation.id);
        const existingMessages = await storage.getMessages(lead.id);

        for (const msg of allMessages) {
          const exists = existingMessages.some(m => (m.metadata as any)?.ig_message_id === msg.id);
          if (!exists) {
            await storage.createMessage({
              leadId: lead.id,
              userId,
              provider: 'instagram',
              direction: msg.from?.id === conversation.participants?.[0]?.id ? 'inbound' : 'outbound',
              body: msg.message || '',
              audioUrl: msg.audio_url || null,
              metadata: { ig_message_id: msg.id, timestamp: msg.created_time }
            });
            results.messagesImported++;
          }
        }
      } catch (e: any) { results.errors.push(e.message); }
    }
    return results;
  } catch (error: any) {
    results.errors.push(error.message);
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
  const results = { leadsImported: 0, messagesImported: 0, errors: [] as string[] };
  try {
    const integrations = await storage.getIntegrations(userId);
    const mcIntegration = integrations.find(i => i.provider === 'manychat' && i.connected);
    if (!mcIntegration) return results;

    const decryptedMeta = JSON.parse(decrypt(mcIntegration.encryptedMeta));
    const apiKey = decryptedMeta.tokens?.api_key;
    if (!apiKey) return results;

    const response = await fetch('https://api.manychat.com/fb/subscriber/findByCustomField', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_name: 'email', field_value: '' })
    });

    const data = await response.json() as any;
    const subscribers = data.data || [];

    for (const sub of subscribers) {
      try {
        await storage.createLead({
          userId,
          externalId: sub.id,
          name: sub.name || sub.first_name || 'Manychat User',
          email: sub.email || null,
          phone: sub.phone || null,
          channel: 'instagram',
          status: 'new',
          metadata: { manychat_id: sub.id, imported_from_manychat: true }
        });
        results.leadsImported++;
      } catch (e) { }
    }
    return results;
  } catch (e: any) { results.errors.push(e.message); return results; }
}