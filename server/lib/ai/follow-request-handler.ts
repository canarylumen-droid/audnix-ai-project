
import { storage } from '../../storage';

interface FollowRequestContext {
  leadName: string;
  leadStatus: 'converted' | 'not_interested' | 'warm';
  isBrand: boolean;
  channel: 'instagram' | 'whatsapp';
}

/**
 * Generate professional follow request message
 */
export async function generateFollowRequest(context: FollowRequestContext): Promise<string> {
  const { leadName, leadStatus, isBrand } = context;
  
  const firstName = leadName.split(' ')[0];
  
  if (leadStatus === 'converted') {
    if (isBrand) {
      return `${firstName}, I'd love to stay connected with your brand. Would you mind following me on Instagram so we can keep in touch and collaborate in the future?`;
    }
    return `${firstName}, I'd love to stay connected! Do you mind following me on Instagram so we can keep each other updated?`;
  }
  
  if (leadStatus === 'not_interested') {
    return `No worries ${firstName}! I appreciate you checking this out. Would you mind following me on Instagram anyway? I share valuable content that might interest you later.`;
  }
  
  // Warm leads
  return `Hey ${firstName}, would you mind following me on Instagram so we can stay connected? I share tips and updates regularly.`;
}

/**
 * Determine if we should ask for follow based on lead behavior
 */
export async function shouldAskForFollow(leadId: string): Promise<boolean> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return false;
  
  // Ask for follow if:
  // 1. Lead converted
  // 2. Lead marked as not interested
  // 3. Lead engaged but didn't convert after 3+ messages
  
  const messages = await storage.getMessagesByLeadId(leadId);
  const messageCount = messages.length;
  
  return (
    lead.status === 'converted' ||
    lead.status === 'not_interested' ||
    (lead.warm && messageCount >= 6) // 3 back-and-forth exchanges
  );
}

/**
 * Handle follow request response
 */
export async function handleFollowResponse(
  leadId: string,
  response: string,
  channel: 'instagram' | 'whatsapp'
): Promise<{ wantsToFollow: boolean; followButtonUrl?: string }> {
  const lowerResponse = response.toLowerCase();
  
  const positiveSignals = ['yes', 'sure', 'ok', 'okay', 'definitely', 'of course', 'absolutely'];
  const wantsToFollow = positiveSignals.some(signal => lowerResponse.includes(signal));
  
  if (wantsToFollow && channel === 'instagram') {
    // Get user's Instagram handle from integrations
    const lead = await storage.getLeadById(leadId);
    if (lead) {
      const integrations = await storage.getIntegrations(lead.userId);
      const igIntegration = integrations.find(i => i.provider === 'instagram');
      
      if (igIntegration && igIntegration.encryptedMeta) {
        const { decrypt } = await import('../crypto/encryption');
        const meta = JSON.parse(decrypt(igIntegration.encryptedMeta));
        
        return {
          wantsToFollow: true,
          followButtonUrl: `https://www.instagram.com/${meta.username || 'your_handle'}/`
        };
      }
    }
  }
  
  return { wantsToFollow };
}
