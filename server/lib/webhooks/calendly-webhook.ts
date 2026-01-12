import { Request, Response } from 'express';
import { db } from "../../db.js";
import { calendarBookings, integrations, notifications } from "../../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import crypto from 'crypto';
import { wsSync } from "../websocket-sync.js";

interface CalendlyEventLocation {
  type: string;
  location?: string;
}

interface CalendlyInvitee {
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  uri?: string;
}

interface CalendlyWebhookEvent {
  resource: {
    resource_type: string;
    event_type: string;
    created_at: string;
    uri?: string;
  };
  payload: {
    event_type?: string;
    invitee?: CalendlyInvitee;
    event?: {
      start_time: string;
      end_time: string;
      uri: string;
      event_type?: {
        name: string;
        duration?: number;
      };
      name?: string;
      location?: CalendlyEventLocation;
    };
    scheduled_event?: {
      start_time: string;
      end_time: string;
      uri: string;
      name?: string;
      location?: CalendlyEventLocation;
    };
  };
}

/**
 * Verify Calendly webhook signature
 */
export function verifyCalendlySignature(req: Request): boolean {
  const signature = req.headers['calendly-webhook-signature'] as string;
  const timestamp = req.headers['calendly-webhook-timestamp'] as string;

  if (!signature || !timestamp) return false;

  const secret = process.env.CALENDLY_WEBHOOK_SECRET || '';
  if (!secret) return true; // Skip if no secret configured

  const payload = `${timestamp}.${JSON.stringify(req.body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex'); // Calendly uses hex for v1 signatures

  const incomingSignature = signature.replace('v1=', '');
  return incomingSignature === expectedSignature;
}

/**
 * Handle Calendly webhook events
 */
export async function handleCalendlyWebhook(req: Request, res: Response): Promise<void> {
  try {
    const event: CalendlyWebhookEvent = req.body;

    if (!event.resource || !event.payload) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    const eventType = event.resource.event_type || event.payload.event_type;

    switch (eventType) {
      case 'invitee.created':
        await handleMeetingBooked(event);
        break;
      case 'invitee.canceled':
        await handleMeetingCancelled(event);
        break;
      default:
        console.log(`Unhandled Calendly webhook event: ${eventType}`);
    }

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error handling Calendly webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle when a meeting is booked
 */
async function handleMeetingBooked(event: CalendlyWebhookEvent): Promise<void> {
  try {
    const payload = event.payload;
    const invitee = payload.invitee;
    const scheduledEvent = payload.scheduled_event || payload.event;

    if (!invitee || !scheduledEvent) return;

    // Find the user associated with this Calendly account
    // For now, we'll try to find any user with a Calendly integration
    // In production, you'd match by user URI or another unique ID
    const [integration] = await db.select().from(integrations).where(eq(integrations.provider, 'calendly')).limit(1);
    if (!integration) return;

    const userId = integration.userId;

    const [booking] = await db.insert(calendarBookings).values({
      userId,
      provider: 'calendly',
      externalEventId: scheduledEvent.uri,
      title: scheduledEvent.name || 'Discovery Call',
      startTime: new Date(scheduledEvent.start_time),
      endTime: new Date(scheduledEvent.end_time),
      meetingUrl: scheduledEvent.location ? (scheduledEvent.location as any).location : null,
      attendeeEmail: invitee.email,
      attendeeName: invitee.name || `${invitee.first_name || ''} ${invitee.last_name || ''}`.trim(),
      status: 'scheduled',
      isAiBooked: true // Assume AI booked for now if it came via our flow
    }).returning();

    // Notify user
    await db.insert(notifications).values({
      userId,
      type: 'conversion',
      title: 'New Meeting Booked! 📅',
      message: `${booking.attendeeName} just scheduled a meeting for ${new Date(booking.startTime).toLocaleDateString()}`,
    });

    // Broadcast to dashboard
    wsSync.broadcastToUser(userId, {
      type: 'CALENDAR_UPDATED',
      payload: booking
    });

  } catch (error) {
    console.error('Error in handleMeetingBooked:', error);
  }
}

/**
 * Handle when a meeting is cancelled
 */
async function handleMeetingCancelled(event: CalendlyWebhookEvent): Promise<void> {
  try {
    const scheduledEvent = event.payload.scheduled_event || event.payload.event;
    if (!scheduledEvent) return;

    const [booking] = await db.update(calendarBookings)
      .set({ status: 'cancelled' })
      .where(eq(calendarBookings.externalEventId, scheduledEvent.uri))
      .returning();

    if (booking) {
      wsSync.broadcastToUser(booking.userId, {
        type: 'CALENDAR_UPDATED',
        payload: { ...booking, status: 'cancelled' }
      });
    }
  } catch (error) {
    console.error('Error in handleMeetingCancelled:', error);
  }
}

/**
 * Handle Calendly verification ping
 */
export function handleCalendlyVerification(req: Request, res: Response): void {
  res.status(200).json({ ok: true, message: 'Calendly webhook verified' });
}
