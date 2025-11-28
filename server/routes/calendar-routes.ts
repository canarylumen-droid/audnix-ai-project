import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import {
  getAvailableTimeSlots,
  sendBookingLinkToLead,
  bookMeeting,
  formatBookingMessage
} from '../lib/calendar/calendar-booking.js';
import { validateCalendlyToken } from '../lib/calendar/calendly.js';
import { storage } from '../storage.js';
import type { ChannelType } from '../../shared/types.js';

const router = Router();

/**
 * Get available time slots for booking
 */
router.get('/slots', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const daysAhead = req.query.daysAhead as string | undefined;
    const duration = req.query.duration as string | undefined;

    const slots = await getAvailableTimeSlots(
      userId,
      daysAhead ? parseInt(daysAhead, 10) : 7,
      duration ? parseInt(duration, 10) : 30
    );

    res.json({
      success: true,
      count: slots.length,
      slots: slots.map(slot => ({
        start: slot.startTime.toISOString(),
        end: slot.endTime.toISOString(),
        available: slot.available,
        timezone: slot.timezone
      }))
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting time slots:', errorMessage);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

/**
 * Send booking link to lead
 */
router.post('/send-link', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadEmail, leadName, campaignId, duration } = req.body as {
      leadEmail?: string;
      leadName?: string;
      campaignId?: string;
      duration?: number;
    };

    if (!leadEmail || !leadName) {
      res.status(400).json({ error: 'Lead email and name required' });
      return;
    }

    const result = await sendBookingLinkToLead({
      leadEmail,
      leadName,
      userId,
      campaignId: campaignId || '',
      duration: duration || 30
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      success: true,
      bookingLink: result.bookingLink,
      message: `Booking link ready to send to ${leadName}`
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending booking link:', errorMessage);
    res.status(500).json({ error: 'Failed to send booking link' });
  }
});

/**
 * Book meeting when lead accepts
 */
router.post('/book', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadEmail, leadName, startTime, endTime, duration } = req.body as {
      leadEmail?: string;
      leadName?: string;
      startTime?: string;
      endTime?: string;
      duration?: number;
    };

    if (!leadEmail || !startTime) {
      res.status(400).json({
        error: 'Lead email and start time required'
      });
      return;
    }

    const result = await bookMeeting(
      userId,
      leadEmail,
      leadName || 'Guest',
      new Date(startTime),
      new Date(endTime || startTime),
      duration || 30
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      success: true,
      eventId: result.eventId,
      meetingLink: result.meetingLink,
      message: `Meeting booked with ${leadName || 'Guest'}`
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error booking meeting:', errorMessage);
    res.status(500).json({ error: 'Failed to book meeting' });
  }
});

/**
 * Get formatted message for sending booking link
 */
router.post('/format-message', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadName, bookingLink, channel } = req.body as {
      leadName?: string;
      bookingLink?: string;
      channel?: string;
    };

    if (!leadName || !bookingLink || !channel) {
      res.status(400).json({
        error: 'Lead name, booking link, and channel required'
      });
      return;
    }

    if (!['email', 'whatsapp', 'instagram'].includes(channel)) {
      res.status(400).json({
        error: 'Channel must be email, whatsapp, or instagram'
      });
      return;
    }

    const message = formatBookingMessage(leadName, bookingLink, channel as ChannelType);

    res.json({
      success: true,
      message,
      channel
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error formatting message:', errorMessage);
    res.status(500).json({ error: 'Failed to format message' });
  }
});

/**
 * Connect Calendly integration
 */
router.post('/connect-calendly', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const { apiToken } = req.body as { apiToken?: string };

    if (!apiToken || !apiToken.trim()) {
      res.status(400).json({ error: 'Calendly API token required' });
      return;
    }

    const validation = await validateCalendlyToken(apiToken);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Invalid Calendly API token',
        details: validation.error
      });
      return;
    }

    const { encrypt } = await import('../lib/crypto/encryption');
    const encrypted = await encrypt(JSON.stringify({ api_token: apiToken }));

    await storage.createIntegration({
      userId,
      provider: 'calendly',
      connected: true,
      encryptedMeta: encrypted,
      accountType: 'personal'
    });

    res.json({
      success: true,
      message: `Calendly connected! Ready to book meetings.`,
      userName: validation.userName
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error connecting Calendly:', errorMessage);
    res.status(500).json({ error: 'Failed to connect Calendly' });
  }
});

/**
 * Disconnect Calendly
 */
router.post('/disconnect-calendly', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;

    const integrations = await storage.getIntegrations(userId);
    const calendlyIntegration = integrations.find(i => i.provider === 'calendly');

    if (!calendlyIntegration) {
      res.status(400).json({ error: 'Calendly not connected' });
      return;
    }

    await storage.disconnectIntegration(userId, 'calendly');

    res.json({
      success: true,
      message: 'Calendly disconnected'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error disconnecting Calendly:', errorMessage);
    res.status(500).json({ error: 'Failed to disconnect Calendly' });
  }
});

/**
 * Get calendar status (which provider is connected)
 */
router.get('/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req)!;
    const integrations = await storage.getIntegrations(userId);

    const calendly = integrations.find(i => i.provider === 'calendly' && i.connected);
    const google = integrations.find(i => i.provider === 'google_calendar' && i.connected);

    res.json({
      success: true,
      calendly: {
        connected: !!calendly,
        provider: 'calendly',
        accountType: calendly?.accountType || null
      },
      google: {
        connected: !!google,
        provider: 'google_calendar',
        accountType: google?.accountType || null
      },
      primary: calendly ? 'calendly' : google ? 'google_calendar' : null,
      message: calendly 
        ? 'Using Calendly for instant booking' 
        : google 
        ? 'Using Google Calendar for booking'
        : 'No calendar connected. Connect Calendly or Google Calendar to enable booking.'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting calendar status:', errorMessage);
    res.status(500).json({ error: 'Failed to get calendar status' });
  }
});

/**
 * Public booking page for leads (no auth required)
 */
router.get('/public/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const leadEmail = req.query.leadEmail as string | undefined;
    const leadName = req.query.leadName as string | undefined;

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const slots = await getAvailableTimeSlots(userId, 14, 30);

    res.json({
      success: true,
      hostName: user.name || user.company,
      hostEmail: user.email,
      leadEmail: leadEmail || null,
      leadName: leadName || null,
      availableSlots: slots.map(s => ({
        start: s.startTime.toISOString(),
        end: s.endTime.toISOString()
      }))
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error loading public booking page:', errorMessage);
    res.status(500).json({ error: 'Failed to load booking page' });
  }
});

export default router;
