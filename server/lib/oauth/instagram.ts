import crypto from 'crypto';
// import { supabaseAdmin } from '../supabase-admin.js'; // Removed
import { storage } from '../../storage.js';
import { encrypt, decrypt } from '../crypto/encryption.js';
import { getOAuthRedirectUrl } from '../config/oauth-redirects.js';

interface InstagramOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
  permissions?: string[];
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

interface InstagramUserProfile {
  id: string;
  username: string;
  name?: string;
  account_type?: string;
}

export class InstagramOAuth {
  private config: InstagramOAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      redirectUri: getOAuthRedirectUrl('instagram')
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    const state = this.generateState(userId);
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'instagram_basic,instagram_manage_messages,instagram_manage_comments',
      response_type: 'code',
      state
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<InstagramTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
      code
    });

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to exchange code for token');
    }

    return data;
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(accessToken: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.config.clientSecret,
      access_token: accessToken
    });

    const response = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to get long-lived token');
    }

    return data;
  }

  /**
   * Refresh long-lived token (should be called before expiry)
   */
  async refreshLongLivedToken(accessToken: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: accessToken
    });

    const response = await fetch(`https://graph.instagram.com/refresh_access_token?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to refresh token');
    }

    return data;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<InstagramUserProfile> {
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,account_type&access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to get user profile');
    }

    return data;
  }

  /**
   * Save OAuth token to database
   */
  async saveToken(userId: string, tokenData: InstagramTokenResponse, expiresIn: number = 5184000): Promise<void> {
    const encryptedToken = await encrypt(tokenData.access_token);
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));

    // Save to oauth_accounts table via storage
    await storage.saveOAuthAccount({
      userId: userId,
      provider: 'instagram',
      providerAccountId: tokenData.user_id,
      accessToken: encryptedToken,
      expiresAt: expiresAt,
      tokenType: 'bearer', // Instagram uses Bearer?
      scope: 'instagram_basic,instagram_manage_messages,instagram_manage_comments'
    });

    // Update user record with Instagram info
    await storage.updateUser(userId, {
      metadata: {
        instagram_access_token: encryptedToken,
        instagram_token_expires: expiresAt.toISOString(),
        instagram_user_id: tokenData.user_id
      }
    }); // Schema needs to support this metadata structure or columns
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidToken(userId: string): Promise<string | null> {
    const tokenData = await storage.getOAuthAccount(userId, 'instagram');

    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    const expiresAt = tokenData.expiresAt ? new Date(tokenData.expiresAt) : new Date(0);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Refresh if less than 24 hours until expiry
    if (hoursUntilExpiry < 24 && tokenData.accessToken) {
      try {
        const decryptedToken = await decrypt(tokenData.accessToken);
        const refreshedData = await this.refreshLongLivedToken(decryptedToken);

        // Save new token
        await this.saveToken(userId, {
          access_token: refreshedData.access_token,
          user_id: tokenData.providerAccountId, // Reuse existing user_id if not provided in refresh? Usually refresh just gives token.
          // refreshLongLivedToken result: { access_token, token_type, expires_in }
          // It doesn't return user_id. We must rely on stored user_id.
        }, refreshedData.expires_in);

        return refreshedData.access_token;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }

    if (!tokenData.accessToken) return null;
    return await decrypt(tokenData.accessToken);
  }

  /**
   * Revoke access token
   */
  async revokeToken(userId: string): Promise<void> {
    const token = await this.getValidToken(userId);
    if (!token) return;

    // Call Instagram API to revoke token
    // Note: Instagram doesn't have a revoke endpoint, so we just delete from DB

    // Delete from oauth_accounts table
    await storage.deleteOAuthAccount(userId, 'instagram');

    // Clear from users table
    await storage.updateUser(userId, {
      metadata: {
        instagram_access_token: null,
        instagram_token_expires: null,
        instagram_user_id: null,
        instagram_username: null
      }
    });
  }

  /**
   * Generate secure state parameter
   */
  private generateState(userId: string): string {
    const data = `${userId}:${Date.now()}`;
    return encrypt(data);
  }

  /**
   * Verify state parameter
   */
  verifyState(state: string): { userId: string; timestamp: number } | null {
    try {
      const decrypted = decrypt(state);
      const [userId, timestamp] = decrypted.split(':');

      // Check if state is less than 10 minutes old
      const age = Date.now() - parseInt(timestamp);
      if (age > 10 * 60 * 1000) {
        return null;
      }

      return { userId, timestamp: parseInt(timestamp) };
    } catch (error) {
      console.error('Failed to verify state:', error);
      return null;
    }
  }

  /**
   * Get Instagram conversations (threads) for a user
   */
  async getConversations(accessToken: string): Promise<Array<{
    id: string;
    participants?: Array<{ id: string; username: string }>;
    updated_time?: string;
  }>> {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me/conversations?fields=id,participants,updated_time&access_token=${accessToken}`
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Failed to get conversations');
      }
      return data.data || [];
    } catch (error) {
      console.error('Failed to get Instagram conversations:', error);
      return [];
    }
  }

  /**
   * Get Instagram media (posts/reels) for a user
   */
  async getMedia(accessToken: string, limit: number = 20): Promise<Array<{
    id: string;
    caption?: string;
    media_type: string;
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    username: string;
    like_count?: number;
    comments_count?: number;
  }>> {
    try {
      const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count';
      const response = await fetch(
        `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Failed to get media');
      }
      return data.data || [];
    } catch (error) {
      console.error('Failed to get Instagram media:', error);
      return [];
    }
  }

  /**
   * Get all messages from a conversation thread
   */
  async getAllMessages(accessToken: string, conversationId: string): Promise<Array<{
    id: string;
    message?: string;
    from?: { id: string };
    created_time?: string;
    audio_url?: string;
    attachments?: Array<unknown>;
  }>> {
    try {
      const response = await fetch(
        `https://graph.instagram.com/${conversationId}/messages?fields=id,message,from,created_time&access_token=${accessToken}`
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Failed to get messages');
      }
      return data.data || [];
    } catch (error) {
      console.error('Failed to get Instagram messages:', error);
      return [];
    }
  }
}