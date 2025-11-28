import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase-admin';
import crypto from 'crypto';

interface CalendlyEventLocation {
  type: string;
  location?: string;
}

interface CalendlyInvitee {
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
}

interface CalendlyScheduledEvent {
  start_time: string;
  end_time: string;
  name?: string;
  location?: string | CalendlyEventLocation;
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
      event_type?: {
        name: string;
        duration?: number;
      };
      name?: string;
      location?: CalendlyEventLocation;
    };
    scheduled_event?: CalendlyScheduledEvent;
  };
}

interface IntegrationRecord {
  user_id: string;
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
    return true;
  }

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
export function handleCalendlyVerification(req: Request, res: Response): void {
  if (req.body?.webhook_used_for_testing) {
    res.json({ ok: true });
  }
}

/**
 * Handle Calendly webhook events (meeting booked, cancelled, etc.)
 */
export async function handleCalendlyWebhook(req: Request, res: Response): Promise<void> {
  try {
    if (!verifyCalendlySignature(req)) {
      console.warn('Invalid Calendly webhook signature');
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

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
  } catch (error: unknown) {
    console.error('Error handling Calendly webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Extract location string from Calendly event location (handles both string and object formats)
 */
function extractLocationString(location: string | CalendlyEventLocation | undefined): string {
  if (!location) return 'Virtual Meeting';
  if (typeof location === 'string') return location;
  return location.location || 'Virtual Meeting';
}

/**
 * Handle when a meeting is booked via Calendly
 */
async function handleMeetingBooked(event: CalendlyWebhookEvent): Promise<void> {
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
    const meetingLocation = extractLocationString(scheduledEvent.location);

    console.log(`📅 Meeting booked: ${leadName} (${leadEmail}) - ${meetingName} at ${startTime.toISOString()}`);
    // Using Neon database for calendar events and notifications - no Supabase needed
  } catch (error: unknown) {
    console.error('Error processing meeting booking:', error);
  }
}

/**
 * Handle when a meeting is cancelled via Calendly
 */
async function handleMeetingCancelled(event: CalendlyWebhookEvent): Promise<void> {
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
      const { error: updateError } = await supabaseAdmin
        .from('calendar_events')
        .update({ status: 'cancelled' })
        .eq('lead_email', leadEmail)
        .eq('status', 'booked');

      if (updateError) {
        console.log('Calendar event update skipped');
      }

      const integrations = await supabaseAdmin
        .from('integrations')
        .select('user_id')
        .eq('provider', 'calendly')
        .eq('is_active', true);

      if (integrations.data) {
        for (const integration of integrations.data as IntegrationRecord[]) {
          const { error: notifyError } = await supabaseAdmin.from('notifications').insert({
            user_id: integration.user_id,
            type: 'meeting_cancelled',
            title: `Meeting Cancelled: ${leadName}`,
            message: `${leadName} (${leadEmail}) cancelled their meeting`,
            action_url: '/dashboard/calendar',
            metadata: { leadName, leadEmail }
          });

          if (notifyError) {
            console.log('Notification creation skipped');
          }
        }
      }
    }
  } catch (error: unknown) {
    console.error('Error processing meeting cancellation:', error);
  }
}
