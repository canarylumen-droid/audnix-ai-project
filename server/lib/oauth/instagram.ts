import crypto from 'crypto';
import { supabaseAdmin } from '../supabase-admin.js';
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
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    const encryptedToken = await encrypt(tokenData.access_token);
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));

    // Save to oauth_tokens table
    const { error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'instagram',
        access_token: encryptedToken,
        expires_at: expiresAt.toISOString(),
        metadata: {
          instagram_user_id: tokenData.user_id,
          permissions: tokenData.permissions
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (tokenError) {
      console.error('Error saving OAuth token:', tokenError);
      throw new Error('Failed to save OAuth token');
    }

    // Update user record with Instagram info
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        instagram_access_token: encryptedToken,
        instagram_token_expires: expiresAt.toISOString(),
        instagram_user_id: tokenData.user_id
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

    const { data: tokenData, error } = await supabaseAdmin
      .from('oauth_tokens')
      .select('access_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'instagram')
      .single();

    if (error || !tokenData) {
      return null;
    }

    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Refresh if less than 24 hours until expiry
    if (hoursUntilExpiry < 24) {
      try {
        const decryptedToken = await decrypt(tokenData.access_token);
        const refreshedData = await this.refreshLongLivedToken(decryptedToken);

        // Save new token
        await this.saveToken(userId, {
          access_token: refreshedData.access_token,
          user_id: userId,
        }, refreshedData.expires_in);

        return refreshedData.access_token;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }

    return await decrypt(tokenData.access_token);
  }

  /**
   * Revoke access token
   */
  async revokeToken(userId: string): Promise<void> {
    const token = await this.getValidToken(userId);
    if (!token || !supabaseAdmin) return;

    // Call Instagram API to revoke token
    // Note: Instagram doesn't have a revoke endpoint, so we just delete from DB

    // Delete from oauth_tokens table
    await supabaseAdmin
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'instagram');

    // Clear from users table
    await supabaseAdmin
      .from('users')
      .update({
        instagram_access_token: null,
        instagram_token_expires: null,
        instagram_user_id: null,
        instagram_username: null
      })
      .eq('id', userId);
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