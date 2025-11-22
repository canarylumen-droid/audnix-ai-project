import { getOAuthRedirectUrl } from '../config/oauth-redirects';
import fetch from 'node-fetch';

export class CalendlyOAuth {
  private config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };

  constructor() {
    this.config = {
      clientId: process.env.CALENDLY_CLIENT_ID || '',
      clientSecret: process.env.CALENDLY_CLIENT_SECRET || '',
      redirectUri: getOAuthRedirectUrl('calendly')
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      console.warn('⚠️ Calendly OAuth: Credentials not configured. Users can still use manual API key.');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      ...(state && { state })
    });

    return `https://auth.calendly.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    user?: { name: string; email: string };
  }> {
    try {
      const response = await fetch('https://auth.calendly.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data: any = await response.json();

      // Get user info from Calendly
      let userInfo = null;
      if (data.access_token) {
        userInfo = await this.getUserInfo(data.access_token);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || undefined,
        expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
        user: userInfo ? { name: userInfo.name || 'Calendly User', email: userInfo.email } : undefined
      };
    } catch (error: any) {
      console.error('Calendly token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    try {
      const response = await fetch('https://auth.calendly.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data: any = await response.json();

      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      };
    } catch (error: any) {
      console.error('Calendly token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get user info from Calendly
   */
  private async getUserInfo(accessToken: string): Promise<{ name: string; email: string } | null> {
    try {
      const response = await fetch('https://api.calendly.com/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();
      return {
        name: data.resource?.name || 'Calendly User',
        email: data.resource?.email || '',
      };
    } catch (error) {
      console.error('Failed to get Calendly user info:', error);
      return null;
    }
  }
}

export const calendlyOAuth = new CalendlyOAuth();
