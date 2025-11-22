import { OAuth2Client } from 'google-auth-library';

/**
 * Create a Google Calendar booking link for a lead
 */
export async function createCalendarBookingLink(
  userId: string,
  leadName: string,
  duration: number = 30
): Promise<string> {
  // For production: Use Google Calendar API with OAuth
  // For now: Generate a Calendly-style link placeholder
  
  const userName = 'Your Business';
  const encodedName = encodeURIComponent(userName);
  const encodedLead = encodeURIComponent(leadName);
  
  // In production, this would be a real booking link from Google Calendar or Calendly
  return `https://calendar.google.com/calendar/appointments/schedules?name=${encodedName}&attendee=${encodedLead}`;
}

/**
 * Get OAuth2 client for Google Calendar
 */
export function getGoogleOAuth2Client(accessToken: string): OAuth2Client {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail: string;
    meetingLink?: string;
  }
): Promise<any> {
  try {
    const oauth2Client = getGoogleOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
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
        attendees: [
          { email: event.attendeeEmail }
        ],
        conferenceData: event.meetingLink ? undefined : {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * List upcoming events
 */
export async function listUpcomingEvents(
  accessToken: string,
  maxResults: number = 10
): Promise<any[]> {
  try {
    const oauth2Client = getGoogleOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items || [];
  } catch (error: any) {
    console.error('Error listing calendar events:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: accessToken ? 'token provided' : 'no token'
    });
    return [];
  }
}

/**
 * Generate a meeting link to send to a lead
 */
export function generateMeetingLinkMessage(
  leadName: string,
  bookingLink: string,
  platform: 'instagram' | 'whatsapp' | 'email'
): string {
  const messages = {
    instagram: `Hey ${leadName}! 📅 Ready to chat? Book a time that works for you: ${bookingLink}`,
    whatsapp: `Hi ${leadName}! I'd love to connect with you. Here's my calendar link to schedule a call: ${bookingLink}`,
    email: `Hi ${leadName},\n\nThanks for your interest! I'd love to discuss how we can help.\n\nPlease use this link to schedule a time that works best for you:\n${bookingLink}\n\nLooking forward to connecting!\n\nBest regards`
  };
  
  return messages[platform];
}
