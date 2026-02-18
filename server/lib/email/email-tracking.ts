import crypto from 'crypto';
import { db } from '../../db.js';
import { sql } from 'drizzle-orm';
import { isValidUUID } from '../utils/validation.js';

export interface EmailTrackingData {
  messageId: string;
  userId: string;
  leadId?: string;
  recipientEmail: string;
  subject: string;
  sentAt: Date;
}

export interface EmailEvent {
  type: 'open' | 'click';
  messageId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  linkUrl?: string;
}

export function generateTrackingToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function generateTrackingPixel(baseUrl: string, token: string): string {
  return `<img src="${baseUrl}/api/email-tracking/track/open/${token}" width="1" height="1" style="display:none;" alt="" />`;
}

export function wrapLinksWithTracking(html: string, baseUrl: string, messageToken: string): string {
  const linkRegex = /<a\s+([^>]*href=["'])([^"']+)(["'][^>]*)>/gi;
  
  return html.replace(linkRegex, (match, prefix, url, suffix) => {
    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.includes('/api/email/track/')) {
      return match;
    }
    
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${baseUrl}/api/email-tracking/track/click/${messageToken}?url=${encodedUrl}`;
    return `<a ${prefix}${trackingUrl}${suffix}>`;
  });
}

export async function createTrackedEmail(data: EmailTrackingData): Promise<{ token: string; pixelHtml: string }> {
  const token = generateTrackingToken();
  const baseUrl = process.env.BASE_URL || 'https://audnixai.com';
  
  try {
    const validLeadId = isValidUUID(data.leadId) ? data.leadId : null;

    await db.execute(sql`
      INSERT INTO email_tracking (
        id, user_id, lead_id, recipient_email, subject, token, sent_at, created_at
      ) VALUES (
        gen_random_uuid(),
        ${data.userId},
        ${validLeadId},
        ${data.recipientEmail},
        ${data.subject},
        ${token},
        ${data.sentAt.toISOString()},
        NOW()
      )
    `);
  } catch (error) {
    console.error('Failed to create email tracking record:', error);
  }
  
  const pixelHtml = generateTrackingPixel(baseUrl, token);
  return { token, pixelHtml };
}

export async function recordEmailEvent(event: EmailEvent): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO email_events (
        id, token, event_type, ip_address, user_agent, link_url, created_at
      )
      SELECT 
        gen_random_uuid(),
        ${event.messageId},
        ${event.type},
        ${event.ipAddress || null},
        ${event.userAgent || null},
        ${event.linkUrl || null},
        ${event.timestamp.toISOString()}
      WHERE NOT EXISTS (
        SELECT 1 FROM email_events 
        WHERE token = ${event.messageId} 
        AND event_type = ${event.type}
        ${event.type === 'click' ? sql`AND link_url = ${event.linkUrl}` : sql``}
      )
    `);
    
    // Get userId and leadId to notify
    const trackResult = await db.execute(sql`
      SELECT user_id, lead_id, recipient_email, subject 
      FROM email_tracking 
      WHERE token = ${event.messageId}
    `);
    
    const trackingInfo = trackResult.rows[0] as any;

    if (event.type === 'open') {
      await db.execute(sql`
        UPDATE email_tracking 
        SET first_opened_at = COALESCE(first_opened_at, ${event.timestamp.toISOString()}),
            open_count = COALESCE(open_count, 0) + 1
        WHERE token = ${event.messageId}
      `);
    } else if (event.type === 'click') {
      await db.execute(sql`
        UPDATE email_tracking 
        SET first_clicked_at = COALESCE(first_clicked_at, ${event.timestamp.toISOString()}),
            click_count = COALESCE(click_count, 0) + 1
        WHERE token = ${event.messageId}
      `);
    }

    // Real-time Notification
    if (trackingInfo) {
      // Update lead metadata for filtering
      if (trackingInfo.lead_id && event.type === 'open') {
        try {
          await db.execute(sql`
            UPDATE leads 
            SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{isOpened}', 'true'::jsonb),
                updated_at = NOW()
            WHERE id = ${trackingInfo.lead_id}
          `);
        } catch (err) {
          console.error('Failed to update lead metadata for open event:', err);
        }
      }

      const { wsSync } = await import('../websocket-sync.js');
      
      // Notify activity feed
      wsSync.notifyActivityUpdated(trackingInfo.user_id, {
        type: event.type === 'open' ? 'email_opened' : 'email_clicked',
        leadId: trackingInfo.lead_id,
        details: {
          email: trackingInfo.recipient_email,
          subject: trackingInfo.subject,
          link: event.linkUrl,
          timestamp: event.timestamp
        }
      });

      // Also trigger a generic notification toast
      if (trackingInfo.lead_id) {
         wsSync.notifyNotification(trackingInfo.user_id, {
           type: 'lead_activity',
           title: event.type === 'open' ? 'Email Opened' : 'Link Clicked',
           message: `${trackingInfo.recipient_email} ${event.type === 'open' ? 'opened your email' : 'clicked a link in your email'}: "${trackingInfo.subject}"`,
           leadId: trackingInfo.lead_id
         });
      }
    }

  } catch (error) {
    console.error('Failed to record email event:', error);
  }
}

export async function getEmailStats(userId: string, days: number = 30): Promise<{
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}> {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as sent,
        COUNT(CASE WHEN open_count > 0 THEN 1 END) as opened,
        COUNT(CASE WHEN click_count > 0 THEN 1 END) as clicked
      FROM email_tracking
      WHERE user_id = ${userId}
      AND sent_at > NOW() - INTERVAL '${sql.raw(days.toString())} days'
    `);
    
    const row = result.rows[0] as { sent: string; opened: string; clicked: string } | undefined;
    const sent = parseInt(row?.sent || '0');
    const opened = parseInt(row?.opened || '0');
    const clicked = parseInt(row?.clicked || '0');
    
    return {
      sent,
      opened,
      clicked,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
    };
  } catch (error) {
    console.error('Failed to get email stats:', error);
    return { sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 };
  }
}

export function injectTrackingIntoEmail(html: string, token: string): string {
  const baseUrl = process.env.BASE_URL || 'https://audnixai.com';
  
  let trackedHtml = wrapLinksWithTracking(html, baseUrl, token);
  
  const trackingPixel = generateTrackingPixel(baseUrl, token);
  
  if (trackedHtml.includes('</body>')) {
    trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`);
  } else {
    trackedHtml += trackingPixel;
  }
  
  return trackedHtml;
}
