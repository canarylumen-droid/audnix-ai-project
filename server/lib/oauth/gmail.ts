import { google } from 'googleapis';
import crypto from 'crypto';
import { storage } from '../../storage.js';
import { encrypt, decrypt } from '../crypto/encryption.js';
import { getOAuthRedirectUrl } from '../config/oauth-redirects.js';

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
      redirectUri: getOAuthRedirectUrl('gmail')
    };

    // Shared global client instance for stateless operations (auth url, code exchange)
    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  /**
   * Helper to create a dedicated OAuth2 client for a single user request.
   * This is critical to prevent credentials from leaking between concurrent users.
   */
  private createClient(credentials?: any): any {
    const client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
    if (credentials) {
      client.setCredentials(credentials);
    }
    return client;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<GmailTokenResponse> {
    if (process.env.MOCK_OAUTH === 'true') {
      console.log('🧪 [MOCK_OAUTH] Mocking Gmail token exchange...');
      return {
        access_token: 'mock-google-access-token',
        refresh_token: 'mock-google-refresh-token',
        scope: 'mock-scope',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000
      } as GmailTokenResponse;
    }

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
    const client = this.createClient({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: client });

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
    if (process.env.MOCK_OAUTH === 'true') {
      console.log('🧪 [MOCK_OAUTH] Mocking Google user profile...');
      return {
        email: 'mock-user@gmail.com',
        name: 'Mock User',
        id: '123456789'
      };
    }

    const client = this.createClient({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: client });

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
    if (process.env.MOCK_OAUTH === 'true') {
      console.log('🧪 [MOCK_OAUTH] Mocking Gmail token refresh...');
      return {
        access_token: 'mock-google-refreshed-access-token',
        refresh_token: refreshToken,
        scope: 'mock-scope',
        token_type: 'Bearer',
        expiry_date: Date.now() + 3600000
      } as GmailTokenResponse;
    }

    const client = this.createClient({ refresh_token: refreshToken });

    try {
      const { credentials } = await client.refreshAccessToken();
      return credentials as GmailTokenResponse;
    } catch (error: any) {
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Save OAuth tokens to database
   */
  async saveToken(userId: string, tokens: GmailTokenResponse, profile: any): Promise<void> {
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 60 * 60 * 1000); // 1 hour default

    const email = profile.emailAddress || profile.email;

    await storage.saveOAuthAccount({
      userId,
      provider: 'google',
      providerAccountId: email,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      scope: tokens.scope,
      tokenType: tokens.token_type
    });
  }

  /**
   * Get valid access token, refreshing if needed
   */
  async getValidToken(userId: string, emailAddress?: string): Promise<string | null> {
    const tokenData = await storage.getOAuthAccount(userId, 'google', emailAddress);

    if (!tokenData) return null;

    const expiresAt = tokenData.expiresAt ? new Date(tokenData.expiresAt) : new Date(0);
    const now = new Date();

    // Refresh if expired or expiring within 5 minutes
    if (expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
      if (!tokenData.refreshToken) return null;

      try {
        const decryptedRefreshToken = decrypt(tokenData.refreshToken);
        const newTokens = await this.refreshAccessToken(decryptedRefreshToken);
        const encryptedNewAccessToken = encrypt(newTokens.access_token);
        
        // Use new refresh token if provided by Google, otherwise keep the old one
        const encryptedNewRefreshToken = newTokens.refresh_token 
          ? encrypt(newTokens.refresh_token) 
          : tokenData.refreshToken;

        const newExpiresAt = newTokens.expiry_date
          ? new Date(newTokens.expiry_date)
          : new Date(Date.now() + (newTokens as any).expires_in * 1000 || Date.now() + 3600 * 1000);

        await storage.saveOAuthAccount({
          userId,
          provider: 'google',
          providerAccountId: tokenData.providerAccountId,
          accessToken: encryptedNewAccessToken,
          refreshToken: encryptedNewRefreshToken,
          expiresAt: newExpiresAt,
          scope: newTokens.scope,
          tokenType: newTokens.token_type
        });

        return newTokens.access_token;
      } catch (error) {
        console.error('Error refreshing Gmail token:', error);
        return null;
      }
    }

    if (!tokenData.accessToken) return null;
    return decrypt(tokenData.accessToken);
  }

  /**
   * Refresh all soon-expiring tokens (called by background worker)
   */
  static async refreshExpiredTokens(): Promise<void> {
    try {
      const expiredAccounts = await storage.getSoonExpiringOAuthAccounts('google', 10);
      if (!expiredAccounts || expiredAccounts.length === 0) return;

      for (const account of expiredAccounts) {
        const oauth = new GmailOAuth();
        await oauth.getValidToken(account.userId);
      }

      console.log(`✅ Refreshed ${expiredAccounts.length} Gmail tokens`);
    } catch (error) {
      console.error('Error refreshing expired tokens:', error);
    }
  }

  /**
   * Revoke OAuth tokens and remove from database
   */
  async revokeToken(userId: string, emailAddress?: string): Promise<void> {
    const token = await this.getValidToken(userId, emailAddress);

    if (token) {
      try {
        await this.oauth2Client.revokeToken(token);
      } catch {
        // Silently fail if token already revoked or invalid
      }
    }

    await storage.deleteOAuthAccount(userId, 'google', emailAddress);
  }

  /**
   * Send email using Gmail API
   */
  async sendEmail(userId: string, to: string, subject: string, body: string, isHtml = false, fromEmail?: string): Promise<void> {
    const token = await this.getValidToken(userId, fromEmail);
    if (!token) {
      throw new Error(`Gmail not connected for ${fromEmail || 'user'} or token expired`);
    }

    const client = this.createClient({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth: client });

    const profile = await this.getGmailProfile(token);
    const fromAddress = profile.emailAddress;

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${fromAddress}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      isHtml ? 'Content-Type: text/html; charset=utf-8' : 'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ];
    const messageContent = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(messageContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage }
      });
    } catch (error: any) {
      throw new Error(`Failed to send email via Gmail API: ${error.message}`);
    }
  }

  /**
   * List recent messages from Gmail
   */
  async listMessages(userId: string, limit = 20): Promise<any[]> {
    const token = await this.getValidToken(userId);
    if (!token) throw new Error('Gmail not connected or token expired');

    const client = this.createClient({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth: client });

    try {
      const response = await gmail.users.messages.list({ userId: 'me', maxResults: limit });
      return response.data.messages || [];
    } catch (error: any) {
      throw new Error(`Failed to list messages: ${error.message}`);
    }
  }

  /**
   * Get full message details from Gmail
   */
  async getMessageDetails(userId: string, messageId: string): Promise<any> {
    const token = await this.getValidToken(userId);
    if (!token) throw new Error('Gmail not connected or token expired');

    const client = this.createClient({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth: client });

    try {
      const response = await gmail.users.messages.get({ userId: 'me', id: messageId });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get message details: ${error.message}`);
    }
  }
}

// Singleton instance — imported by google-redirect.ts and oauth.ts
export const gmailOAuth = new GmailOAuth();
