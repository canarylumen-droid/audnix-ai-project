import { decrypt } from "../crypto/encryption";

interface WhatsAppCredentials {
  access_token: string;
  phone_number_id: string;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
}

export class WhatsAppProvider {
  private credentials: WhatsAppCredentials;
  private isDemoMode: boolean;

  constructor(encryptedMeta: string) {
    this.isDemoMode = process.env.DISABLE_EXTERNAL_API === "true";
    
    if (this.isDemoMode) {
      this.credentials = {
        access_token: "mock_token",
        phone_number_id: "mock_phone_id"
      };
    } else {
      this.credentials = JSON.parse(decrypt(encryptedMeta));
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(to: string, text: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_whatsapp_${Date.now()}` };
    }

    const url = `https://graph.facebook.com/v18.0/${this.credentials.phone_number_id}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.credentials.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.messages?.[0]?.id || "" };
  }

  /**
   * Send WhatsApp voice message
   */
  async sendAudioMessage(to: string, audioUrl: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_audio_${Date.now()}` };
    }

    const url = `https://graph.facebook.com/v18.0/${this.credentials.phone_number_id}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.credentials.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "audio",
        audio: { link: audioUrl }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp audio API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.messages?.[0]?.id || "" };
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    if (this.isDemoMode) {
      return;
    }

    const url = `https://graph.facebook.com/v18.0/${this.credentials.phone_number_id}/messages`;
    
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.credentials.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      })
    });
  }

  /**
   * Validate connection status
   */
  async validateConnection(): Promise<boolean> {
    if (this.isDemoMode) {
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${this.credentials.phone_number_id}`;
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
