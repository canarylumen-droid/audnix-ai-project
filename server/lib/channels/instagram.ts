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
 * Send a text message via Instagram Direct Message API
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
 * Send a voice message via Instagram Direct Message API
 * @param accessToken Instagram access token
 * @param recipientId Instagram user ID to send to
 * @param audioUrl Public URL of the audio file (must be accessible by Instagram)
 */
export async function sendInstagramVoiceMessage(
  accessToken: string,
  recipientId: string,
  audioUrl: string
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
        attachment: {
          type: 'audio',
          payload: {
            url: audioUrl,
            is_reusable: false
          }
        }
      },
      access_token: accessToken
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send Instagram voice message');
  }
}

/**
 * Send media (image/video) via Instagram Direct Message API
 * @param accessToken Instagram access token
 * @param recipientId Instagram user ID to send to
 * @param mediaUrl Public URL of the media file
 * @param mediaType Type of media: 'image' or 'video'
 */
export async function sendInstagramMedia(
  accessToken: string,
  recipientId: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' = 'image'
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
        attachment: {
          type: mediaType,
          payload: {
            url: mediaUrl,
            is_reusable: false
          }
        }
      },
      access_token: accessToken
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send Instagram media');
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