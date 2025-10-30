const SUPER_MEMORY_API_KEY = process.env.SUPER_MEMORY_API_KEY;
const SUPER_MEMORY_API_URL = 'https://api.supermemory.ai/v1';

if (!SUPER_MEMORY_API_KEY) {
  console.warn('SUPER_MEMORY_API_KEY not set. Conversation memory will be limited to database storage only.');
}

/**
 * Store conversation in Super Memory for permanent long-term storage
 * @param userId - User ID
 * @param leadId - Lead ID
 * @param conversationData - Conversation data to store
 */
export async function storeConversationMemory(
  userId: string,
  leadId: string,
  conversationData: {
    messages: Array<{ role: string; content: string; timestamp: string }>;
    leadName: string;
    leadChannel: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; memoryId?: string }> {
  if (!SUPER_MEMORY_API_KEY) {
    console.log(`⚠️ Super Memory: Skipping save for ${conversationData.leadName} (API key not configured)`);
    return { success: false };
  }

  try {
    const response = await fetch(`${SUPER_MEMORY_API_URL}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPER_MEMORY_API_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        content: {
          type: 'conversation',
          lead_id: leadId,
          lead_name: conversationData.leadName,
          channel: conversationData.leadChannel,
          messages: conversationData.messages,
          metadata: conversationData.metadata || {},
        },
        tags: ['conversation', conversationData.leadChannel, userId],
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Super Memory API error:', response.status, errorText);
      return { success: false };
    }

    const data = await response.json() as any;
    console.log(`✓ Super Memory: Saved conversation with ${conversationData.leadName} (${data.id})`);
    return { success: true, memoryId: data.id };
  } catch (error: any) {
    console.error('Super Memory storage error:', error.message);
    return { success: false };
  }
}

/**
 * Retrieve conversation history from Super Memory
 * @param userId - User ID
 * @param leadId - Optional lead ID to filter
 * @returns Conversation history
 */
export async function retrieveConversationMemory(
  userId: string,
  leadId?: string
): Promise<{ success: boolean; conversations?: any[] }> {
  if (!SUPER_MEMORY_API_KEY) {
    return { success: false };
  }

  try {
    const params = new URLSearchParams({
      user_id: userId,
      tags: 'conversation',
      limit: '100',
    });

    if (leadId) {
      params.append('filter', `lead_id:${leadId}`);
    }

    const response = await fetch(`${SUPER_MEMORY_API_URL}/memories?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPER_MEMORY_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Super Memory API error:', response.statusText);
      return { success: false };
    }

    const data = await response.json() as any;
    return { success: true, conversations: data.memories || [] };
  } catch (error: any) {
    console.error('Super Memory retrieval error:', error.message);
    return { success: false };
  }
}

/**
 * Update existing conversation memory
 * @param memoryId - Memory ID
 * @param updatedData - Updated conversation data
 */
export async function updateConversationMemory(
  memoryId: string,
  updatedData: {
    messages: Array<{ role: string; content: string; timestamp: string }>;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean }> {
  if (!SUPER_MEMORY_API_KEY) {
    return { success: false };
  }

  try {
    const response = await fetch(`${SUPER_MEMORY_API_URL}/memories/${memoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPER_MEMORY_API_KEY}`,
      },
      body: JSON.stringify({
        content: {
          messages: updatedData.messages,
          metadata: updatedData.metadata || {},
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Super Memory API error:', response.statusText);
      return { success: false };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Super Memory update error:', error.message);
    return { success: false };
  }
}

/**
 * Search conversation history with semantic search
 * @param userId - User ID
 * @param query - Search query
 * @returns Search results
 */
export async function searchConversationMemory(
  userId: string,
  query: string
): Promise<{ success: boolean; results?: any[] }> {
  if (!SUPER_MEMORY_API_KEY) {
    return { success: false };
  }

  try {
    const response = await fetch(`${SUPER_MEMORY_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPER_MEMORY_API_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        query,
        tags: ['conversation'],
        limit: 20,
      }),
    });

    if (!response.ok) {
      console.error('Super Memory API error:', response.statusText);
      return { success: false };
    }

    const data = await response.json() as any;
    return { success: true, results: data.results || [] };
  } catch (error: any) {
    console.error('Super Memory search error:', error.message);
    return { success: false };
  }
}