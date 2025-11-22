import { Router } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import {
  getAvailableTimeSlots,
  sendBookingLinkToLead,
  bookMeeting,
  formatBookingMessage
} from '../lib/calendar/calendar-booking';
import { validateCalendlyToken } from '../lib/calendar/calendly';
import { storage } from '../storage';

const router = Router();

/**
 * Get available time slots for booking
 */
router.get('/slots', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { daysAhead = 7, duration = 30 } = req.query;

    const slots = await getAvailableTimeSlots(
      userId,
      parseInt(daysAhead as string),
      parseInt(duration as string)
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
  } catch (error: any) {
    console.error('Error getting time slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

/**
 * Send booking link to lead
 */
router.post('/send-link', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadEmail, leadName, campaignId, duration } = req.body;

    if (!leadEmail || !leadName) {
      return res.status(400).json({ error: 'Lead email and name required' });
    }

    const result = await sendBookingLinkToLead({
      leadEmail,
      leadName,
      userId,
      campaignId,
      duration: duration || 30
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      bookingLink: result.bookingLink,
      message: `Booking link ready to send to ${leadName}`
    });
  } catch (error: any) {
    console.error('Error sending booking link:', error);
    res.status(500).json({ error: 'Failed to send booking link' });
  }
});

/**
 * Book meeting when lead accepts
 */
router.post('/book', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { leadEmail, leadName, startTime, endTime, duration } = req.body;

    if (!leadEmail || !startTime) {
      return res.status(400).json({
        error: 'Lead email and start time required'
      });
    }

    const result = await bookMeeting(
      userId,
      leadEmail,
      leadName,
      new Date(startTime),
      new Date(endTime),
      duration || 30
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      eventId: result.eventId,
      meetingLink: result.meetingLink,
      message: `Meeting booked with ${leadName}`
    });
  } catch (error: any) {
    console.error('Error booking meeting:', error);
    res.status(500).json({ error: 'Failed to book meeting' });
  }
});

/**
 * Get formatted message for sending booking link
 */
router.post('/format-message', requireAuth, async (req, res) => {
  try {
    const { leadName, bookingLink, channel } = req.body;

    if (!leadName || !bookingLink || !channel) {
      return res.status(400).json({
        error: 'Lead name, booking link, and channel required'
      });
    }

    if (!['email', 'whatsapp', 'instagram'].includes(channel)) {
      return res.status(400).json({
        error: 'Channel must be email, whatsapp, or instagram'
      });
    }

    const message = formatBookingMessage(leadName, bookingLink, channel);

    res.json({
      success: true,
      message,
      channel
    });
  } catch (error: any) {
    console.error('Error formatting message:', error);
    res.status(500).json({ error: 'Failed to format message' });
  }
});

/**
 * Connect Calendly integration
 */
router.post('/connect-calendly', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { apiToken } = req.body;

    if (!apiToken || !apiToken.trim()) {
      return res.status(400).json({ error: 'Calendly API token required' });
    }

    // Validate token
    const validation = await validateCalendlyToken(apiToken);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid Calendly API token',
        details: validation.error
      });
    }

    // Encrypt and save
    const { encrypt } = await import('../lib/crypto/encryption');
    const encrypted = await encrypt(JSON.stringify({ api_token: apiToken }));

    // Save to integrations
    await storage.saveIntegration(userId, 'calendly', {
      provider: 'calendly',
      connected: true,
      encryptedMeta: encrypted,
      account_type: `Calendly (${validation.userName})`
    });

    res.json({
      success: true,
      message: `Calendly connected! Ready to book meetings.`,
      userName: validation.userName
    });
  } catch (error: any) {
    console.error('Error connecting Calendly:', error);
    res.status(500).json({ error: 'Failed to connect Calendly' });
  }
});

/**
 * Disconnect Calendly
 */
router.post('/disconnect-calendly', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;

    // Remove integration
    const integrations = await storage.getIntegrations(userId);
    const calendlyIntegration = integrations.find(i => i.provider === 'calendly');

    if (!calendlyIntegration) {
      return res.status(400).json({ error: 'Calendly not connected' });
    }

    // Disconnect (mark as not connected or delete)
    await storage.disconnectIntegration(userId, 'calendly');

    res.json({
      success: true,
      message: 'Calendly disconnected'
    });
  } catch (error: any) {
    console.error('Error disconnecting Calendly:', error);
    res.status(500).json({ error: 'Failed to disconnect Calendly' });
  }
});

/**
 * Get calendar status (which provider is connected)
 */
router.get('/status', requireAuth, async (req, res) => {
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
        accountType: calendly?.account_type || null
      },
      google: {
        connected: !!google,
        provider: 'google_calendar',
        accountType: google?.account_type || null
      },
      primary: calendly ? 'calendly' : google ? 'google_calendar' : null,
      message: calendly 
        ? 'Using Calendly for instant booking' 
        : google 
        ? 'Using Google Calendar for booking'
        : 'No calendar connected. Connect Calendly or Google Calendar to enable booking.'
    });
  } catch (error: any) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({ error: 'Failed to get calendar status' });
  }
});

/**
 * Public booking page for leads (no auth required)
 */
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { leadEmail, leadName } = req.query;

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
  } catch (error: any) {
    console.error('Error loading public booking page:', error);
    res.status(500).json({ error: 'Failed to load booking page' });
  }
});

export default router;
