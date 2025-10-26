import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export class GoogleCalendarOAuth {
  private oauth2Client: OAuth2Client;
  private config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:5000/api/oauth/google-calendar/callback'
    };

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  /**
   * Generate OAuth URL for user to authorize
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    email?: string;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    this.oauth2Client.setCredentials(tokens);

    // Get user info to verify email
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      email: userInfo.data.email || undefined,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
    };
  }

  /**
   * List upcoming calendar events
   */
  async listUpcomingEvents(accessToken: string, maxResults: number = 10): Promise<any[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    accessToken: string,
    event: {
      summary: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      attendeeEmail?: string;
      location?: string;
    }
  ): Promise<any> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const eventData: any = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    if (event.attendeeEmail) {
      eventData.attendees = [{ email: event.attendeeEmail }];
    }

    if (event.location) {
      eventData.location = event.location;
    }

    // Add Google Meet conference
    eventData.conferenceData = {
      createRequest: {
        requestId: Math.random().toString(36).substring(7),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: eventData,
    });

    return response.data;
  }

  /**
   * Generate booking link message for different platforms
   */
  static generateBookingMessage(
    leadName: string,
    bookingUrl: string,
    platform: 'instagram' | 'whatsapp' | 'email'
  ): string {
    const messages = {
      instagram: `Hey ${leadName}! 📅 Let's schedule a time to chat. Pick a time that works for you: ${bookingUrl}`,
      whatsapp: `Hi ${leadName}! I'd love to connect with you. Here's my calendar to book a call: ${bookingUrl}`,
      email: `Hi ${leadName},\n\nThanks for your interest! I'd love to discuss how we can help.\n\nPlease use this link to schedule a time that works best for you:\n${bookingUrl}\n\nLooking forward to connecting!\n\nBest regards`,
    };

    return messages[platform];
  }
}

// Export singleton instance
export const googleCalendarOAuth = new GoogleCalendarOAuth();
