import { decrypt } from "../crypto/encryption.js";

interface WhatsAppCredentials {
  // WhatsApp Business API credentials
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  // Twilio credentials (legacy support)
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
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

  constructor(credentials: WhatsAppCredentials) {
    this.isDemoMode = process.env.DISABLE_EXTERNAL_API === "true";

    if (this.isDemoMode) {
      this.credentials = {
        phoneNumberId: "mock_phone_number_id",
        accessToken: "mock_access_token",
        accountSid: "mock_account_sid",
        authToken: "mock_auth_token",
        fromNumber: "whatsapp:+1234567890"
      };
    } else {
      this.credentials = credentials;
    }
  }

  /**
   * Send WhatsApp text message via WhatsApp Business API
   */
  async sendMessage(to: string, text: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_whatsapp_${Date.now()}` };
    }

    const url = `https://graph.facebook.com/v18.0/${this.credentials.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.credentials.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ''), // Remove non-digits
        type: "text",
        text: { body: text }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp Business API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.messages[0].id };
  }

  /**
   * Send WhatsApp voice/audio message via WhatsApp Business API
   */
  async sendAudioMessage(to: string, audioUrl: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_audio_${Date.now()}` };
    }

    const url = `https://graph.facebook.com/v18.0/${this.credentials.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.credentials.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ''),
        type: "audio",
        audio: { link: audioUrl }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp audio error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.messages[0].id };
  }

  /**
   * Mark message as read (not supported by Twilio, no-op)
   */
  async markAsRead(messageId: string): Promise<void> {
    // Twilio doesn't support read receipts for WhatsApp
    return;
  }

  /**
   * Validate Twilio connection
   */
  async validateConnection(): Promise<boolean> {
    if (this.isDemoMode) {
      return true;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.credentials.accountSid}.json`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Basic ${Buffer.from(`${this.credentials.accountSid}:${this.credentials.authToken}`).toString('base64')}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}