import { campaignQueueManager, campaignQueue, hasRedis } from './campaign-queue.js';
import { storage } from '../../storage.js';

/**
 * Re-export the campaign queue as outreachQueue for backward compatibility.
 */
export const outreachQueue = campaignQueue;

/**
 * Bridge function to start the outreach worker. 
 * Since campaignWorker is auto-started in campaign-queue.ts, this is a no-op 
 * but kept for compatibility with server/index.ts.
 */
export function startOutreachWorker() {
  console.log('[OutreachBridge] Outreach Worker bridge active (delegated to CampaignWorker)');
}

/**
 * Bridge function to dispatch an outreach campaign using the new 
 * per-mailbox BullMQ system. Maintains compatibility with existing routes.
 */
export async function dispatchOutreachCampaign(userId: string, campaignId: string) {
  const campaign = await storage.getOutreachCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // startCampaign will register repeatable jobs for all mailboxes assigned to this campaign
  await campaignQueueManager.startCampaign(campaign);
  
  return {
    jobId: `campaign-root:${campaignId}`,
    queued: hasRedis
  };
}
