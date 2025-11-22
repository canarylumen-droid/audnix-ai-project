import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase-admin';
import { storage } from '../../storage';
import crypto from 'crypto';

interface CalendlyWebhookEvent {
  resource: {
    resource_type: string;
    event_type: string;
    created_at: string;
    uri?: string;
  };
  payload: {
    event_type?: string;
    invitee?: {
      email: string;
      name: string;
      first_name?: string;
      last_name?: string;
    };
    event?: {
      start_time: string;
      end_time: string;
      event_type?: {
        name: string;
        duration?: number;
      };
      name?: string;
      location?: {
        type: string;
        location?: string;
      };
    };
    scheduled_event?: {
      start_time: string;
      end_time: string;
      name?: string;
      location?: string;
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
  if (!secret) {
    console.warn('⚠️ CALENDLY_WEBHOOK_SECRET not configured - webhook signature verification skipped');
    return true; // Allow if secret not configured (for development)
  }

  // Calendly uses HMAC-SHA256 with format: v1=<signature>
  const payload = `${timestamp}.${JSON.stringify(req.body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  const incomingSignature = signature.replace('v1=', '');
  return incomingSignature === expectedSignature;
}

/**
 * Handle Calendly webhook verification (challenge)
 */
export function handleCalendlyVerification(req: Request, res: Response) {
  // Calendly sends a challenge request during webhook setup
  if (req.body?.webhook_used_for_testing) {
    res.json({ ok: true });
  }
}

/**
 * Handle Calendly webhook events (meeting booked, cancelled, etc.)
 */
export async function handleCalendlyWebhook(req: Request, res: Response) {
  try {
    // Verify signature
    if (!verifyCalendlySignature(req)) {
      console.warn('Invalid Calendly webhook signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const event: CalendlyWebhookEvent = req.body;

    if (!event.resource || !event.payload) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const eventType = event.resource.event_type || event.payload.event_type;

    // Handle different event types
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
 * Handle when a meeting is booked via Calendly
 */
async function handleMeetingBooked(event: CalendlyWebhookEvent) {
  try {
    const payload = event.payload;
    const invitee = payload.invitee;
    const scheduledEvent = payload.scheduled_event || payload.event;

    if (!invitee || !scheduledEvent) {
      console.warn('Missing invitee or event in webhook payload');
      return;
    }

    const leadEmail = invitee.email;
    const leadName = invitee.name || `${invitee.first_name || ''} ${invitee.last_name || ''}`.trim();
    const startTime = new Date(scheduledEvent.start_time);
    const endTime = new Date(scheduledEvent.end_time);
    const meetingName = scheduledEvent.name || 'Meeting';
    const meetingLocation = typeof scheduledEvent.location === 'string' 
      ? scheduledEvent.location 
      : scheduledEvent.location?.location || 'Virtual Meeting';

    console.log(`📅 Meeting booked: ${leadName} (${leadEmail}) - ${meetingName} at ${startTime.toISOString()}`);

    // Find user by Calendly integration (they own this meeting)
    // This requires a way to map Calendly webhook to user - typically via webhook metadata or stored integration
    // For now, we'll store meeting info for processing

    if (supabaseAdmin) {
      // Create a calendar event record for tracking
      await supabaseAdmin.from('calendar_events').insert({
        source: 'calendly',
        lead_email: leadEmail,
        lead_name: leadName,
        event_title: meetingName,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: meetingLocation,
        status: 'booked',
        webhook_payload: event,
        created_at: new Date().toISOString()
      }).catch(err => {
        // Table might not exist in dev - that's okay
        console.log('Note: calendar_events table not available, booking logged via webhook only');
      });

      // Optional: Send notification to admins or relevant users
      // Find users with this Calendly integration and send them a notification
      const integrations = await supabaseAdmin
        .from('integrations')
        .select('user_id')
        .eq('provider', 'calendly')
        .eq('is_active', true);

      if (integrations.data) {
        for (const integration of integrations.data) {
          // Create notification for user
          await supabaseAdmin.from('notifications').insert({
            user_id: integration.user_id,
            type: 'meeting_booked',
            title: `Meeting Booked: ${leadName}`,
            message: `${leadName} (${leadEmail}) booked a meeting at ${startTime.toLocaleString()}`,
            action_url: '/dashboard/calendar',
            metadata: {
              leadName,
              leadEmail,
              meetingName,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            }
          }).catch(err => console.log('Notification creation skipped'));
        }
      }
    }
  } catch (error: any) {
    console.error('Error processing meeting booking:', error);
  }
}

/**
 * Handle when a meeting is cancelled via Calendly
 */
async function handleMeetingCancelled(event: CalendlyWebhookEvent) {
  try {
    const payload = event.payload;
    const invitee = payload.invitee;

    if (!invitee) {
      console.warn('Missing invitee in cancellation webhook');
      return;
    }

    const leadEmail = invitee.email;
    const leadName = invitee.name || '';

    console.log(`❌ Meeting cancelled: ${leadName} (${leadEmail})`);

    if (supabaseAdmin) {
      // Mark any pending calendar events as cancelled
      await supabaseAdmin
        .from('calendar_events')
        .update({ status: 'cancelled' })
        .eq('lead_email', leadEmail)
        .eq('status', 'booked')
        .catch(err => console.log('Calendar event update skipped'));

      // Find users with this Calendly integration
      const integrations = await supabaseAdmin
        .from('integrations')
        .select('user_id')
        .eq('provider', 'calendly')
        .eq('is_active', true);

      if (integrations.data) {
        for (const integration of integrations.data) {
          // Create cancellation notification
          await supabaseAdmin.from('notifications').insert({
            user_id: integration.user_id,
            type: 'meeting_cancelled',
            title: `Meeting Cancelled: ${leadName}`,
            message: `${leadName} (${leadEmail}) cancelled their meeting`,
            action_url: '/dashboard/calendar',
            metadata: { leadName, leadEmail }
          }).catch(err => console.log('Notification creation skipped'));
        }
      }
    }
  } catch (error: any) {
    console.error('Error processing meeting cancellation:', error);
  }
}
