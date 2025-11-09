import crypto from 'crypto';
import { supabaseAdmin } from '../supabase-admin';
import { encrypt, decrypt } from '../crypto/encryption';
import { getOAuthRedirectUrl } from '../config/oauth-redirects';

interface OutlookOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId: string;
}

interface OutlookTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface OutlookProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
}

export class OutlookOAuth {
  private config: OutlookOAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.OUTLOOK_CLIENT_ID || '',
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
      redirectUri: getOAuthRedirectUrl('outlook'),
      tenantId: process.env.OUTLOOK_TENANT_ID || 'common' // 'common' allows any Microsoft account
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    const state = this.generateState(userId);
    
    const scopes = [
      'offline_access', // Required for refresh token
      'User.Read',
      'Mail.ReadWrite',
      'Mail.Send',
      'Calendar.ReadWrite',
      'Contacts.ReadWrite'
    ];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state: state,
      prompt: 'consent' // Force consent to ensure refresh token
    });

    return `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<OutlookTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error || 'Failed to exchange code for token');
    }

    return data as OutlookTokenResponse;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OutlookTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'offline_access User.Read Mail.ReadWrite Mail.Send Calendar.ReadWrite Contacts.ReadWrite'
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error || 'Failed to refresh token');
    }

    return data as OutlookTokenResponse;
  }

  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(accessToken: string): Promise<OutlookProfile> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get user profile');
    }

    return data as OutlookProfile;
  }

  /**
   * Get user's calendar events
   */
  async getCalendarEvents(accessToken: string, startDateTime?: string, endDateTime?: string): Promise<any[]> {
    let url = 'https://graph.microsoft.com/v1.0/me/calendarview';
    
    if (startDateTime && endDateTime) {
      const params = new URLSearchParams({
        startDateTime,
        endDateTime
      });
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get calendar events');
    }

    return data.value || [];
  }

  /**
   * Send email using Microsoft Graph
   */
  async sendEmail(
    accessToken: string, 
    to: string[], 
    subject: string, 
    body: string, 
    isHtml: boolean = false
  ): Promise<void> {
    const message = {
      subject: subject,
      body: {
        contentType: isHtml ? 'HTML' : 'Text',
        content: body
      },
      toRecipients: to.map(email => ({
        emailAddress: { address: email }
      }))
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, saveToSentItems: true })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send email');
    }
  }

  /**
   * Save OAuth tokens to database
   */
  async saveToken(userId: string, tokens: OutlookTokenResponse, profile: OutlookProfile): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;
    
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Save to oauth_tokens table
    const { error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'outlook',
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
        metadata: {
          email: profile.mail || profile.userPrincipalName,
          name: profile.displayName,
          microsoft_id: profile.id,
          scopes: tokens.scope
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
        outlook_email: profile.mail || profile.userPrincipalName,
        outlook_connected: true
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
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'outlook')
      .single();

    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    // Refresh if expired or about to expire (5 minutes buffer)
    if (expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
      if (!tokenData.refresh_token) {
        // No refresh token available, user needs to re-authenticate
        return null;
      }

      try {
        // Refresh the token
        const decryptedRefreshToken = await decrypt(tokenData.refresh_token);
        const newTokens = await this.refreshAccessToken(decryptedRefreshToken);
        
        // Update stored tokens
        const encryptedNewAccessToken = await encrypt(newTokens.access_token);
        const encryptedNewRefreshToken = newTokens.refresh_token ? 
          await encrypt(newTokens.refresh_token) : 
          tokenData.refresh_token;
        
        const newExpiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));

        await supabaseAdmin
          .from('oauth_tokens')
          .update({
            access_token: encryptedNewAccessToken,
            refresh_token: encryptedNewRefreshToken,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('provider', 'outlook');

        return newTokens.access_token;
      } catch (error) {
        console.error('Error refreshing Outlook token:', error);
        return null;
      }
    }

    // Token is still valid
    const decryptedToken = await decrypt(tokenData.access_token);
    return decryptedToken;
  }

  /**
   * Revoke OAuth tokens
   */
  async revokeToken(userId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    // Note: Microsoft doesn't provide a programmatic way to revoke tokens
    // Users must revoke access through their Microsoft account settings
    
    // Remove from database
    await supabaseAdmin
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'outlook');

    // Update user record
    await supabaseAdmin
      .from('users')
      .update({
        outlook_email: null,
        outlook_connected: false
      })
      .eq('id', userId);
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(
    accessToken: string,
    subject: string,
    start: Date,
    end: Date,
    attendees: string[] = [],
    body?: string,
    location?: string
  ): Promise<any> {
    const event = {
      subject: subject,
      body: body ? {
        contentType: 'HTML',
        content: body
      } : undefined,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'UTC'
      },
      location: location ? {
        displayName: location
      } : undefined,
      attendees: attendees.map(email => ({
        emailAddress: { address: email },
        type: 'required'
      }))
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create calendar event');
    }

    return data;
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
      .createHmac('sha256', this.config.clientSecret)
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
        .createHmac('sha256', this.config.clientSecret)
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
}