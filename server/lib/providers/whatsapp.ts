import { decrypt } from "../crypto/encryption";

interface WhatsAppCredentials {
  // Twilio credentials for WhatsApp
  accountSid: string;
  authToken: string;
  fromNumber: string; // Twilio WhatsApp number (e.g., whatsapp:+14155238886)
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
        accountSid: "mock_account_sid",
        authToken: "mock_auth_token",
        fromNumber: "whatsapp:+1234567890"
      };
    } else {
      this.credentials = credentials;
    }
  }

  /**
   * Send WhatsApp text message via Twilio
   */
  async sendMessage(to: string, text: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_whatsapp_${Date.now()}` };
    }

    // Ensure phone number has whatsapp: prefix
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.credentials.accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('From', this.credentials.fromNumber);
    formData.append('To', toWhatsApp);
    formData.append('Body', text);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.credentials.accountSid}:${this.credentials.authToken}`).toString('base64')}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio WhatsApp API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.sid };
  }

  /**
   * Send WhatsApp voice message via Twilio (SUPPORTED)
   */
  async sendAudioMessage(to: string, audioUrl: string): Promise<{ messageId: string }> {
    if (this.isDemoMode) {
      return { messageId: `mock_audio_${Date.now()}` };
    }

    // Ensure phone number has whatsapp: prefix
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.credentials.accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('From', this.credentials.fromNumber);
    formData.append('To', toWhatsApp);
    formData.append('MediaUrl', audioUrl); // Twilio supports media URLs for audio

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.credentials.accountSid}:${this.credentials.authToken}`).toString('base64')}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio WhatsApp audio error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.sid };
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