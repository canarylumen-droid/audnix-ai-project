import { google } from 'googleapis';
import crypto from 'crypto';
import { supabaseAdmin } from '../supabase-admin';
import { encrypt, decrypt } from '../crypto/encryption';

interface GmailOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GmailTokenResponse {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export class GmailOAuth {
  private config: GmailOAuthConfig;
  private oauth2Client: any;

  constructor() {
    this.config = {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/oauth/gmail/callback'
    };

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    const state = this.generateState(userId);
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh token
      scope: scopes,
      state: state,
      prompt: 'consent' // Force consent to ensure refresh token
    });

    return url;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<GmailTokenResponse> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens as GmailTokenResponse;
    } catch (error: any) {
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  /**
   * Get Gmail profile information
   */
  async getGmailProfile(accessToken: string): Promise<GmailProfile> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    try {
      const response = await gmail.users.getProfile({ userId: 'me' });
      
      return {
        emailAddress: response.data.emailAddress || '',
        messagesTotal: response.data.messagesTotal || 0,
        threadsTotal: response.data.threadsTotal || 0,
        historyId: response.data.historyId || ''
      };
    } catch (error: any) {
      throw new Error(`Failed to get Gmail profile: ${error.message}`);
    }
  }

  /**
   * Get user's Google profile
   */
  async getUserProfile(accessToken: string): Promise<any> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    
    try {
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GmailTokenResponse> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials as GmailTokenResponse;
    } catch (error: any) {
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Save OAuth tokens to database
   */
  async saveToken(userId: string, tokens: GmailTokenResponse, profile: any): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;
    
    const expiresAt = tokens.expiry_date ? 
      new Date(tokens.expiry_date) : 
      new Date(Date.now() + (60 * 60 * 1000)); // 1 hour default

    // Save to oauth_tokens table
    const { error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'gmail',
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
        metadata: {
          email: profile.emailAddress || profile.email,
          name: profile.name,
          picture: profile.picture,
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
        gmail_email: profile.emailAddress || profile.email,
        gmail_connected: true
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
      .eq('provider', 'gmail')
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
        const newExpiresAt = newTokens.expiry_date ? 
          new Date(newTokens.expiry_date) : 
          new Date(Date.now() + (60 * 60 * 1000));

        await supabaseAdmin
          .from('oauth_tokens')
          .update({
            access_token: encryptedNewAccessToken,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('provider', 'gmail');

        return newTokens.access_token;
      } catch (error) {
        console.error('Error refreshing Gmail token:', error);
        return null;
      }
    }

    // Token is still valid
    const decryptedToken = await decrypt(tokenData.access_token);
    return decryptedToken;
  }

  /**
   * Refresh all expired tokens (run periodically)
   */
  static async refreshExpiredTokens(): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      const { data: expiredTokens } = await supabaseAdmin
        .from('oauth_tokens')
        .select('user_id, refresh_token, provider')
        .eq('provider', 'gmail')
        .lt('expires_at', new Date(Date.now() + 10 * 60 * 1000).toISOString());

      if (!expiredTokens || expiredTokens.length === 0) return;

      for (const token of expiredTokens) {
        const oauth = new GmailOAuth();
        await oauth.getValidToken(token.user_id);
      }

      console.log(`✅ Refreshed ${expiredTokens.length} Gmail tokens`);
    } catch (error) {
      console.error('Error refreshing expired tokens:', error);
    }
  }

  /**
   * Revoke OAuth tokens
   */
  async revokeToken(userId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    const token = await this.getValidToken(userId);
    
    if (token) {
      // Revoke token with Google
      try {
        await this.oauth2Client.revokeToken(token);
      } catch (error) {
        console.error('Error revoking Gmail token:', error);
      }
    }

    // Remove from database
    await supabaseAdmin
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'gmail');

    // Update user record
    await supabaseAdmin
      .from('users')
      .update({
        gmail_email: null,
        gmail_connected: false
      })
      .eq('id', userId);
  }

  /**
   * Send email using Gmail API
   */
  async sendEmail(userId: string, to: string, subject: string, body: string, isHtml: boolean = false): Promise<void> {
    const token = await this.getValidToken(userId);
    if (!token) {
      throw new Error('Gmail not connected or token expired');
    }

    this.oauth2Client.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    // Get sender email
    const profile = await this.getGmailProfile(token);
    const from = profile.emailAddress;

    // Create email
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      isHtml ? 'Content-Type: text/html; charset=utf-8' : 'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ];
    const message = messageParts.join('\r\n');

    // Encode in base64
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
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