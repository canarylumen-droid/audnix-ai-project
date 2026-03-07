import { storage } from "../../storage.js";
import { generateReply } from "./ai-service.js";
import { wsSync } from "../websocket-sync.js";

/**
 * Analyzes the conversation history of a lead to determine the deal's value
 * based on the offer discussed or generalized brand information.
 */
export async function evaluateLeadDealValue(userId: string, leadId: string): Promise<number> {
  try {
    const lead = await storage.getLeadById(leadId);
    if (!lead || lead.userId !== userId) return 0;

    const messages = await storage.getMessagesByLeadId(leadId);
    if (!messages || messages.length === 0) return 0;

    // Combine recent messages into a transcript for the AI
    const recentMessages = messages.slice(-20);
    const transcript = recentMessages.map(m => 
      `${m.direction === 'inbound' ? 'Lead' : 'Agent'}: ${m.body}`
    ).join('\n');

    // Retrieve brand knowledge to check for default pricing
    const brandKnowledge = await storage.getBrandKnowledge(userId);
    
    // We want the AI to return just a number, representing the final estimated deal value in USD
    const systemPrompt = `You are an expert revenue intelligence analyst specializing in extracting finalized commercial deal values from negotiation conversations.

Your task is to analyze a conversation transcript and determine the FINAL agreed or most likely deal value in USD.

Follow these strict rules:

1. Identify explicit monetary amounts mentioned in the conversation.
2. If multiple values appear, prioritize the FINAL agreed amount or the latest confirmed offer.
3. If the deal is discussed in a currency other than USD, convert it logically to USD if the value is clearly stated.
4. If a price range is mentioned, select the value that appears most likely to be accepted based on negotiation context.
5. If no explicit agreement exists but the conversation strongly implies a likely price, infer the most probable value.
- The value must be a number (no strings, no symbols, no currency signs).

Example Output:
{"dealValue": 1500}

Brand Context:
${brandKnowledge ? brandKnowledge.substring(0, 1000) : 'None'}
`;

const userPrompt = `Analyze the following negotiation conversation and determine the final deal value.

Conversation Transcript:
${transcript}

Return only the JSON output.`;

    const aiRes = await generateReply(systemPrompt, userPrompt, { jsonMode: true, temperature: 0.1 });
    if (!aiRes || !aiRes.text) return 0;

    const parsed = JSON.parse(aiRes.text);
    const dealValue = typeof parsed.dealValue === 'number' ? parsed.dealValue : 
                      typeof parsed.deal_value === 'number' ? parsed.deal_value : 
                      parseFloat(parsed.dealValue) || 0;

    // Save or update the deal in the pipeline
    const existingDeals = await storage.getDeals(userId);
    const existingDeal = existingDeals.find((d: any) => d.leadId === leadId || d.lead_id === leadId);

    if (existingDeal) {
      // Update existing deal
      await storage.updateDeal(existingDeal.id, userId, { 
        value: dealValue,
        status: lead.status === 'converted' || lead.status === 'booked' ? 'closed_won' : (lead.status as any),
        aiAnalysis: { ...existingDeal.aiAnalysis, offerPrice: dealValue }
      });
    } else {
      // Create new deal
      await storage.createDeal({
        userId,
        leadId,
        brand: lead.company || lead.name || 'Unknown',
        channel: lead.channel,
        value: dealValue,
        status: lead.status === 'converted' || lead.status === 'booked' ? 'closed_won' : 'open',
        aiAnalysis: { offerPrice: dealValue }
      });
    }

    // Notify clients of the update
    wsSync.notifyDealsUpdated(userId);

    return dealValue;
  } catch (error) {
    console.error(`[DealEvaluator] Error evaluating deal value for lead ${leadId}:`, error);
    return 0;
  }
}
