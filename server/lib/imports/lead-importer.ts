
import { db } from '../../db.js';
import { followUpQueue } from '../../../shared/schema.js';
import { InstagramOAuth } from "../oauth/instagram.js";
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
  const results = {
    leadsImported: 0,
    messagesImported: 0,
    errors: [] as string[]
  };

  try {
    // Check user's plan and existing lead count
    const user = await storage.getUserById(userId);
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const currentLeadCount = existingLeads.length;

    // Trial users limited to 500 leads
    const isFreeTrial = !user?.subscriptionTier || user.plan === 'trial';
    const maxLeadsForFree = 500;

    if (isFreeTrial && currentLeadCount >= maxLeadsForFree) {
      results.errors.push(`Free trial limit reached (${maxLeadsForFree} leads). Upgrade to import more.`);
      return results;
    }

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
    // Check user's plan and existing lead count
    const user = await storage.getUserById(userId);
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const currentLeadCount = existingLeads.length;

    const planLimits: Record<string, number> = {
      'free': 500,
      'trial': 500,
      'starter': 2500,
      'pro': 7000,
      'enterprise': 20000
    };
    const maxLeads = planLimits[user?.subscriptionTier || 'free'] || 500;

    if (currentLeadCount >= maxLeads) {
      results.errors.push(`Lead limit reached (${maxLeads} leads). Upgrade to import more.`);
      return results;
    }

    const integrations = await storage.getIntegrations(userId);
    const gmailIntegration = integrations.find(i => i.provider === 'gmail' && i.connected);

    if (!gmailIntegration) {
      results.errors.push('Gmail not connected');
      return results;
    }

    // Get email access token from integration
    const decryptedMetaJson = decrypt(gmailIntegration.encryptedMeta);
    const decryptedMeta = JSON.parse(decryptedMetaJson);
    const accessToken = decryptedMeta.tokens?.access_token || decryptedMeta.accessToken;

    if (!accessToken) {
      results.errors.push('Email token expired. Please reconnect email.');
      return results;
    }

    // Use Gmail API to fetch threads
    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch threads (limit to last 100)
    const threadsResponse = await gmail.users.threads.list({
      userId: 'me',
      maxResults: 100,
      q: 'category:primary' // Only primary inbox
    });

    const threads = threadsResponse.data.threads || [];
    const leadsToImport = Math.min(threads.length, maxLeads - currentLeadCount);

    for (let i = 0; i < leadsToImport; i++) {
      const thread = threads[i];

      try {
        // Get full thread details
        const threadDetails = await gmail.users.threads.get({
          userId: 'me',
          id: thread.id!
        });

        const messages = threadDetails.data.messages || [];
        if (messages.length === 0) continue;

        // Extract sender from first message
        const firstMessage = messages[0];
        const headers = firstMessage.payload?.headers || [];
        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
        const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');

        if (!fromHeader?.value) continue;

        // Parse email address safely - sanitize to prevent injection
        const emailMatch = fromHeader.value.match(/<(.+?)>/) || fromHeader.value.match(/(\S+@\S+)/);
        const email = emailMatch ? emailMatch[1].trim() : fromHeader.value.trim();
        // Sanitize name by removing HTML tags and special characters
        let name = fromHeader.value.replace(/<.*?>/g, '').trim() || email;
        // Remove potentially dangerous characters but keep basic names
        name = name.replace(/[<>\"']/g, '').substring(0, 100).trim();

        // Check if lead already exists
        const existingLead = existingLeads.find(l => l.email === email);
        if (existingLead) continue;

        // Create lead
        const lead = await storage.createLead({
          userId,
          externalId: thread.id!,
          name,
          email,
          channel: 'email',
          status: 'new',
          lastMessageAt: messages[0].internalDate ? new Date(parseInt(messages[0].internalDate)) : null,
          metadata: {
            subject: subjectHeader?.value,
            thread_id: thread.id,
            imported_from_gmail: true
          }
        });

        results.leadsImported++;

        // Import all messages in thread
        for (const msg of messages) {
          const msgHeaders = msg.payload?.headers || [];
          const fromMsg = msgHeaders.find(h => h.name?.toLowerCase() === 'from')?.value || '';
          const isOutbound = fromMsg.includes(user?.email || '');

          // Get message body
          let body = '';
          if (msg.payload?.body?.data) {
            body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
          } else if (msg.payload?.parts) {
            const textPart = msg.payload.parts.find(p => p.mimeType === 'text/plain');
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
          }

          await storage.createMessage({
            leadId: lead.id,
            userId,
            provider: 'gmail',
            direction: isOutbound ? 'outbound' : 'inbound',
            body: body.substring(0, 5000), // Limit to 5000 chars
            metadata: {
              message_id: msg.id,
              thread_id: thread.id,
              subject: subjectHeader?.value
            }
          });

          results.messagesImported++;
        }

      } catch (error: any) {
        results.errors.push(`Failed to import thread: ${error.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error('Gmail import error:', error);
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
    const response = await fetch('https://api.manychat.com/fb/subscriber/findByCustomField', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        field_name: 'email',
        field_value: '' // Get all subscribers
      })
    });

    if (!response.ok) {
      results.errors.push(`Manychat API error: ${response.statusText}`);
      return results;
    }

    const data = await response.json();
    const subscribers = data.data || [];

    // Check plan limits
    const user = await storage.getUserById(userId);
    const existingLeads = await storage.getLeads({ userId, limit: 10000 });
    const planLimits: Record<string, number> = {
      'free': 500,
      'trial': 500,
      'starter': 2500,
      'pro': 7000,
      'enterprise': 20000
    };
    const maxLeads = planLimits[user?.subscriptionTier || 'free'] || 500;
    const leadsToImport = Math.min(subscribers.length, maxLeads - existingLeads.length);

    for (let i = 0; i < leadsToImport; i++) {
      const subscriber = subscribers[i];

      try {
        // Check if lead already exists
        const existingLead = existingLeads.find(l =>
          l.externalId === subscriber.id ||
          l.email === subscriber.email
        );

        if (existingLead) continue;

        // Create lead from Manychat subscriber
        await storage.createLead({
          userId,
          externalId: subscriber.id,
          name: subscriber.name || subscriber.first_name || 'Manychat Subscriber',
          email: subscriber.email || null,
          phone: subscriber.phone || null,
          channel: 'instagram', // Manychat is usually Instagram/FB
          status: 'new',
          metadata: {
            manychat_subscriber_id: subscriber.id,
            tags: subscriber.tags || [],
            custom_fields: subscriber.custom_fields || {},
            imported_from_manychat: true
          }
        });

        results.leadsImported++;
      } catch (error: any) {
        results.errors.push(`Failed to import subscriber ${subscriber.name}: ${error.message}`);
      }
    }

    return results;
  } catch (error: any) {
    console.error('Manychat import error:', error);
    results.errors.push(`Import failed: ${error.message}`);
    return results;
  }
}