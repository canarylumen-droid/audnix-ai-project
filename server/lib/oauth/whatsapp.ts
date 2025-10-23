import crypto from 'crypto';
import { supabaseAdmin } from '../supabase-admin';
import { encrypt, decrypt } from '../crypto/encryption';

interface WhatsAppOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  webhookToken: string;
}

interface WhatsAppTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

interface WhatsAppBusinessProfile {
  id: string;
  name: string;
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}

export class WhatsAppOAuth {
  private config: WhatsAppOAuthConfig;

  constructor() {
    this.config = {
      appId: process.env.WHATSAPP_APP_ID || '',
      appSecret: process.env.WHATSAPP_APP_SECRET || '',
      redirectUri: process.env.WHATSAPP_REDIRECT_URI || 'http://localhost:5000/api/oauth/whatsapp/callback',
      webhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN || ''
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    const state = this.generateState(userId);
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
      response_type: 'code',
      state
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<WhatsAppTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      code,
      redirect_uri: this.config.redirectUri
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Failed to exchange code for token');
    }

    return data;
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(accessToken: string): Promise<WhatsAppTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: accessToken
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to get long-lived token');
    }

    return data;
  }

  /**
   * Get WhatsApp Business Account ID
   */
  async getBusinessAccountId(accessToken: string): Promise<string> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Failed to get business account');
    }

    // Get the first business account
    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }

    throw new Error('No WhatsApp Business Account found');
  }

  /**
   * Get WhatsApp Business Profile
   */
  async getBusinessProfile(accessToken: string, businessAccountId: string): Promise<WhatsAppBusinessProfile> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}?fields=id,name,about,address,description,email,profile_picture_url,websites,vertical&access_token=${accessToken}`
    );
    
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to get business profile');
    }

    return data;
  }

  /**
   * Get phone numbers associated with the WhatsApp Business Account
   */
  async getPhoneNumbers(accessToken: string, businessAccountId: string): Promise<any[]> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}/phone_numbers?access_token=${accessToken}`
    );
    
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to get phone numbers');
    }

    return data.data || [];
  }

  /**
   * Save OAuth token to database
   */
  async saveToken(userId: string, tokenData: WhatsAppTokenResponse, businessData: any): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    const encryptedToken = await encrypt(tokenData.access_token);
    const expiresAt = tokenData.expires_in ? 
      new Date(Date.now() + (tokenData.expires_in * 1000)) : 
      new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)); // 60 days default

    // Save to oauth_tokens table
    const { error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'whatsapp',
        access_token: encryptedToken,
        expires_at: expiresAt.toISOString(),
        metadata: {
          business_account_id: businessData.businessAccountId,
          phone_numbers: businessData.phoneNumbers
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (tokenError) {
      console.error('Error saving OAuth token:', tokenError);
      throw new Error('Failed to save OAuth token');
    }

    // Update user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        whatsapp_business_id: businessData.businessAccountId,
        whatsapp_phone_numbers: businessData.phoneNumbers
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user:', userError);
      throw new Error('Failed to update user record');
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidToken(userId: string): Promise<string | null> {
    if (!supabaseAdmin) {
      return null;
    }

    const { data: tokenData } = await supabaseAdmin
      .from('oauth_tokens')
      .select('access_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'whatsapp')
      .single();

    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      // Token is expired, need to refresh
      // Note: WhatsApp uses Facebook's token system, which requires user re-authentication
      // after 60 days for long-lived tokens
      return null;
    }

    // Decrypt and return token
    const decryptedToken = await decrypt(tokenData.access_token);
    return decryptedToken;
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(userId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    const token = await this.getValidToken(userId);
    
    if (token) {
      // Revoke token with Facebook
      try {
        await fetch(
          `https://graph.facebook.com/v18.0/me/permissions?access_token=${token}`,
          { method: 'DELETE' }
        );
      } catch (error) {
        console.error('Error revoking WhatsApp token:', error);
      }
    }

    // Remove from database
    await supabaseAdmin
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'whatsapp');
  }

  /**
   * Generate secure state parameter
   */
  private generateState(userId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const data = JSON.stringify({ userId, timestamp, random });
    
    // Create signature
    const signature = crypto
      .createHmac('sha256', this.config.appSecret)
      .update(data)
      .digest('hex');
    
    // Encode state
    const state = Buffer.from(JSON.stringify({ data, signature })).toString('base64url');
    return state;
  }

  /**
   * Verify state parameter
   */
  verifyState(state: string): { userId: string } | null {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      const { data, signature } = decoded;
      
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.config.appSecret)
        .update(data)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      const parsedData = JSON.parse(data);
      
      // Check timestamp (valid for 10 minutes)
      const timestamp = parsedData.timestamp;
      const now = Date.now();
      if (now - timestamp > 10 * 60 * 1000) {
        return null;
      }
      
      return { userId: parsedData.userId };
    } catch (error) {
      console.error('Error verifying state:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.appSecret)
      .update(body)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
}