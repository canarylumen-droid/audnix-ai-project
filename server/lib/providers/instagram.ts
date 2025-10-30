import { decrypt } from "../crypto/encryption";

interface InstagramMessage {
  id: string;
  from: { id: string; name: string };
  message: string;
  timestamp: string;
}

interface InstagramCredentials {
  access_token: string;
  page_id: string;
  account_type: "personal" | "creator" | "business";
}

export class InstagramProvider {
  private credentials: InstagramCredentials;
  private isDemoMode: boolean;
  private userId: string = 'me'; // Assuming 'me' for the current user context

  constructor(encryptedMeta: string) {
    this.isDemoMode = process.env.DISABLE_EXTERNAL_API === "true";

    if (this.isDemoMode) {
      this.credentials = {
        access_token: "mock_token",
        page_id: "mock_page_id",
        account_type: "business"
      };
    } else {
      this.credentials = JSON.parse(decrypt(encryptedMeta));
    }
  }

  /**
   * Mock function to get a valid token, replace with actual logic if needed
   */
  private async getValidToken(userId: string): Promise<string | null> {
    if (this.isDemoMode) {
      return "mock_token";
    }
    // In a real scenario, you might need to refresh the token or ensure it's valid
    // For now, we'll just use the stored access token
    return this.credentials.access_token;
  }

  /**
   * Send Instagram Direct Message
   */
  async sendMessage(recipientId: string, text: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_msg_${Date.now()}` };
    }

    const url = `https://graph.facebook.com/v18.0/me/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.credentials.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.message_id };
  }

  /**
   * Send Instagram Audio Message
   */
  async sendAudioMessage(recipientId: string, audioUrl: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_audio_${Date.now()}` };
    }

    const url = `https://graph.facebook.com/v18.0/me/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.credentials.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "audio",
            payload: {
              url: audioUrl,
              is_reusable: true
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.message_id };
  }

  /**
   * Send voice message to Instagram DM
   * Instagram requires audio to be hosted publicly first
   */
  async sendVoiceMessage(recipientId: string, audioBuffer: Buffer): Promise<boolean> {
    try {
      if (this.isDemoMode) {
        console.log('Demo mode: Would send voice message to', recipientId);
        return true;
      }

      const accessToken = this.credentials.access_token;
      if (!accessToken) {
        throw new Error('No valid Instagram access token');
      }

      // Upload audio to a public URL first (using Supabase storage or similar)
      const { uploadToSupabase } = await import('../file-upload');
      const audioUrl = await uploadToSupabase(
        audioBuffer,
        `voice-messages/${recipientId}-${Date.now()}.mp3`,
        'audio/mpeg'
      );

      if (!audioUrl) {
        throw new Error('Failed to upload audio file');
      }

      // Send audio message via Instagram Graph API
      const sendUrl = `https://graph.facebook.com/v18.0/me/messages`;
      const sendResponse = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'audio',
              payload: {
                url: audioUrl,
                is_reusable: true
              }
            }
          }
        })
      });

      if (!sendResponse.ok) {
        const error = await sendResponse.json();
        console.error('Instagram voice send error:', error);
        throw new Error(`Failed to send voice message: ${error.error?.message || 'Unknown error'}`);
      }

      console.log('✅ Instagram voice message sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Instagram voice message:', error);
      return false;
    }
  }

  /**
   * Fetch recent messages from Instagram inbox
   */
  async fetchMessages(limit = 50): Promise<InstagramMessage[]> {
    if (this.isDemoMode) {
      return [
        {
          id: "mock_1",
          from: { id: "user_123", name: "Demo User" },
          message: "Hi! I'm interested in your product",
          timestamp: new Date().toISOString()
        }
      ];
    }

    const url = `https://graph.facebook.com/v18.0/${this.credentials.page_id}/conversations?fields=messages{id,from,message,created_time}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.credentials.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data?.flatMap((conv: any) =>
      conv.messages?.data?.map((msg: any) => ({
        id: msg.id,
        from: msg.from,
        message: msg.message,
        timestamp: msg.created_time
      })) || []
    ) || [];
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<{ id: string; name: string; username?: string }> {
    if (this.isDemoMode) {
      return { id: userId, name: "Demo User", username: "demouser" };
    }

    const url = `https://graph.facebook.com/v18.0/${userId}?fields=id,name,username`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.credentials.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Validate connection status
   */
  async validateConnection(): Promise<boolean> {
    if (this.isDemoMode) {
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${this.credentials.page_id}?fields=id`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.credentials.access_token}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}