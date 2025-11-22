/**
 * Calendar Booking Integration
 * 
 * Automatically creates calendar booking links and sends them to leads
 * Supports: Google Calendar + Calendly integration
 */

import { storage } from '../../storage';
import { createCalendarEvent, listUpcomingEvents } from './google-calendar';

interface BookingSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  timezone: string;
}

interface BookingRequest {
  leadEmail: string;
  leadName: string;
  userId: string;
  campaignId: string;
  duration?: number; // minutes
}

/**
 * Get available time slots for booking
 */
export async function getAvailableTimeSlots(
  userId: string,
  daysAhead: number = 7,
  slotDuration: number = 30
): Promise<BookingSlot[]> {
  try {
    // Get user's Google Calendar integration
    const integrations = await storage.getIntegrations(userId);
    const calendarIntegration = integrations.find(
      i => i.provider === 'google_calendar' && i.connected
    );

    if (!calendarIntegration?.encryptedMeta) {
      console.warn('Google Calendar not connected for user:', userId);
      return [];
    }

    // Decrypt token
    const { decrypt } = await import('../crypto/encryption');
    const decrypted = await decrypt(calendarIntegration.encryptedMeta);
    const credentials = JSON.parse(decrypted);

    // Get upcoming events
    const events = await listUpcomingEvents(credentials.access_token, 50);

    // Generate available slots
    const slots: BookingSlot[] = [];
    const now = new Date();
    const businessHours = { start: 9, end: 17 }; // 9 AM - 5 PM

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Generate slots for this day
      for (let hour = businessHours.start; hour < businessHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

          // Check if slot conflicts with existing events
          const hasConflict = events.some((event: any) => {
            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            return (
              (slotStart >= eventStart && slotStart < eventEnd) ||
              (slotEnd > eventStart && slotEnd <= eventEnd)
            );
          });

          if (!hasConflict && slotStart > now) {
            slots.push({
              startTime: slotStart,
              endTime: slotEnd,
              available: true,
              timezone: 'America/New_York'
            });
          }
        }
      }
    }

    return slots.slice(0, 20); // Return top 20 slots
  } catch (error: any) {
    console.error('Error getting available time slots:', error);
    return [];
  }
}

/**
 * Create and send booking link to lead
 */
export async function sendBookingLinkToLead(
  request: BookingRequest
): Promise<{
  success: boolean;
  bookingLink?: string;
  error?: string;
}> {
  try {
    const { leadEmail, leadName, userId, duration = 30 } = request;

    // Get user details
    const user = await storage.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get available slots
    const slots = await getAvailableTimeSlots(userId, 7, duration);
    if (slots.length === 0) {
      return {
        success: false,
        error: 'No available time slots. Please connect Google Calendar.'
      };
    }

    // Generate Calendly-style shareable link
    const bookingLink = `${process.env.APP_URL || 'https://audnixai.com'}/book/${userId}?leadEmail=${encodeURIComponent(leadEmail)}&leadName=${encodeURIComponent(leadName)}`;

    return {
      success: true,
      bookingLink
    };
  } catch (error: any) {
    console.error('Error sending booking link:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Book meeting when lead accepts
 */
export async function bookMeeting(
  userId: string,
  leadEmail: string,
  leadName: string,
  slotStart: Date,
  slotEnd: Date,
  duration: number = 30
): Promise<{
  success: boolean;
  eventId?: string;
  meetingLink?: string;
  error?: string;
}> {
  try {
    // Get user's Google Calendar integration
    const integrations = await storage.getIntegrations(userId);
    const calendarIntegration = integrations.find(
      i => i.provider === 'google_calendar' && i.connected
    );

    if (!calendarIntegration?.encryptedMeta) {
      return {
        success: false,
        error: 'Google Calendar not connected'
      };
    }

    // Decrypt token
    const { decrypt } = await import('../crypto/encryption');
    const decrypted = await decrypt(calendarIntegration.encryptedMeta);
    const credentials = JSON.parse(decrypted);

    // Get user info
    const user = await storage.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Create calendar event
    const event = await createCalendarEvent(credentials.access_token, {
      summary: `Meeting with ${leadName}`,
      description: `Follow-up meeting\nLead: ${leadName}\nEmail: ${leadEmail}`,
      startTime: slotStart,
      endTime: slotEnd,
      attendeeEmail: leadEmail
    });

    if (!event) {
      return {
        success: false,
        error: 'Failed to create calendar event'
      };
    }

    return {
      success: true,
      eventId: event.id,
      meetingLink: event.conferenceData?.entryPoints?.[0]?.uri || event.htmlLink
    };
  } catch (error: any) {
    console.error('Error booking meeting:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format booking message for different channels
 */
export function formatBookingMessage(
  leadName: string,
  bookingLink: string,
  channel: 'email' | 'whatsapp' | 'instagram'
): string {
  const templates = {
    email: `Hi ${leadName},

Thanks for your interest! I'd love to discuss how we can help you.

Please book a time that works best for you using this link:
${bookingLink}

Looking forward to connecting!`,

    whatsapp: `Hey ${leadName}! 👋

Ready to chat? Click the link below to schedule a call that works for you:

${bookingLink}

Looking forward to connecting! 🚀`,

    instagram: `Hi ${leadName}! 📅

I'd love to connect with you. Here's my calendar to schedule a quick call:

${bookingLink}

Let's chat! 💬`
  };

  return templates[channel];
}
