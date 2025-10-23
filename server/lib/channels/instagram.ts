/**
 * Instagram messaging functions
 */

interface InstagramMessage {
  id: string;
  text: string;
  timestamp: string;
  from: {
    id: string;
    username?: string;
  };
}

/**
 * Send a message via Instagram Direct Message API
 */
export async function sendInstagramMessage(
  accessToken: string,
  recipientId: string,
  message: string
): Promise<void> {
  const endpoint = `https://graph.instagram.com/v18.0/me/messages`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      },
      access_token: accessToken
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send Instagram message');
  }
}

/**
 * Get Instagram conversations
 */
export async function getInstagramConversations(
  accessToken: string,
  limit: number = 20
): Promise<InstagramMessage[]> {
  const endpoint = `https://graph.instagram.com/v18.0/me/conversations?fields=messages{id,text,timestamp,from}&limit=${limit}&access_token=${accessToken}`;
  
  const response = await fetch(endpoint);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to get conversations');
  }

  return data.data || [];
}

/**
 * Subscribe to Instagram webhooks
 */
export async function subscribeToInstagramWebhooks(
  accessToken: string,
  callbackUrl: string
): Promise<void> {
  // Instagram webhook subscription logic
  // This would be configured in the Facebook App Dashboard
  console.log('Instagram webhook subscription should be configured in Facebook App Dashboard');
}