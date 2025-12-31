import { Router, Request, Response } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { encrypt, decrypt } from '../lib/crypto/encryption.js';
import nodemailer from 'nodemailer';

const router = Router();

interface SmtpConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
  secure?: boolean;
  verified?: boolean;
}

interface UserSettings {
  emailProvider: string;
  smtp: SmtpConfig;
  notifications: {
    emailEnabled: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  automation: {
    autoRespond: boolean;
    autoBookMeetings: boolean;
    voiceNotes: boolean;
  };
  sync: {
    intervalSeconds: number;
    lastSyncAt: string | null;
  };
}

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await db.execute(sql`
      SELECT * FROM user_settings WHERE user_id = ${userId}
    `);

    if (result.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO user_settings (user_id) VALUES (${userId})
        ON CONFLICT (user_id) DO NOTHING
      `);

      res.json({
        emailProvider: 'sendgrid',
        smtp: { verified: false },
        notifications: { emailEnabled: true, dailyDigest: true, weeklyReport: true },
        automation: { autoRespond: true, autoBookMeetings: true, voiceNotes: true },
        sync: { intervalSeconds: 30, lastSyncAt: null },
      });
      return;
    }

    const row = result.rows[0] as any;

    let smtpPassword: string | undefined;
    if (row.smtp_password_encrypted) {
      try {
        smtpPassword = decrypt(row.smtp_password_encrypted);
      } catch {
        smtpPassword = undefined;
      }
    }

    const settings: UserSettings = {
      emailProvider: row.email_provider || 'sendgrid',
      smtp: {
        host: row.smtp_host || undefined,
        port: row.smtp_port || 587,
        username: row.smtp_username || undefined,
        password: smtpPassword ? '••••••••' : undefined,
        fromEmail: row.smtp_from_email || undefined,
        fromName: row.smtp_from_name || undefined,
        secure: row.smtp_secure !== false,
        verified: row.smtp_verified === true,
      },
      notifications: {
        emailEnabled: row.email_notifications_enabled !== false,
        dailyDigest: row.daily_digest_enabled !== false,
        weeklyReport: row.weekly_report_enabled !== false,
      },
      automation: {
        autoRespond: row.auto_respond_enabled !== false,
        autoBookMeetings: row.auto_book_meetings !== false,
        voiceNotes: row.voice_notes_enabled !== false,
      },
      sync: {
        intervalSeconds: row.sync_interval_seconds || 30,
        lastSyncAt: row.last_sync_at?.toISOString() || null,
      },
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/smtp', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { host, port, username, password, fromEmail, fromName, secure } = req.body;

    if (!host || !username || !fromEmail) {
      res.status(400).json({ error: 'Host, username, and from email are required' });
      return;
    }

    const encryptedPassword = password ? encrypt(password) : null;

    await db.execute(sql`
      INSERT INTO user_settings (
        user_id, email_provider, smtp_host, smtp_port, smtp_username, 
        smtp_password_encrypted, smtp_from_email, smtp_from_name, smtp_secure, smtp_verified
      )
      VALUES (
        ${userId}, 'custom_smtp', ${host}, ${port || 587}, ${username},
        ${encryptedPassword}, ${fromEmail}, ${fromName || null}, ${secure !== false}, false
      )
      ON CONFLICT (user_id) DO UPDATE SET
        email_provider = 'custom_smtp',
        smtp_host = ${host},
        smtp_port = ${port || 587},
        smtp_username = ${username},
        smtp_password_encrypted = COALESCE(${encryptedPassword}, user_settings.smtp_password_encrypted),
        smtp_from_email = ${fromEmail},
        smtp_from_name = ${fromName || null},
        smtp_secure = ${secure !== false},
        smtp_verified = false,
        updated_at = NOW()
    `);

    res.json({ success: true, message: 'SMTP settings saved. Test connection to verify.' });
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    res.status(500).json({ error: 'Failed to save SMTP settings' });
  }
});

router.post('/smtp/test', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await db.execute(sql`
      SELECT smtp_host, smtp_port, smtp_username, smtp_password_encrypted, 
             smtp_from_email, smtp_from_name, smtp_secure
      FROM user_settings WHERE user_id = ${userId}
    `);

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'No SMTP settings configured' });
      return;
    }

    const row = result.rows[0] as any;

    if (!row.smtp_host || !row.smtp_password_encrypted) {
      res.status(400).json({ error: 'Incomplete SMTP configuration' });
      return;
    }

    let password: string;
    try {
      password = decrypt(row.smtp_password_encrypted);
    } catch {
      res.status(400).json({ error: 'Failed to decrypt SMTP password' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: row.smtp_host,
      port: row.smtp_port || 587,
      secure: row.smtp_secure && row.smtp_port === 465,
      auth: {
        user: row.smtp_username,
        pass: password,
      },
      connectionTimeout: 10000,
    });

    await transporter.verify();

    await db.execute(sql`
      UPDATE user_settings 
      SET smtp_verified = true, smtp_last_tested_at = NOW(), updated_at = NOW()
      WHERE user_id = ${userId}
    `);

    res.json({ success: true, message: 'SMTP connection verified successfully!' });
  } catch (error: any) {
    console.error('SMTP test failed:', error);
    res.status(400).json({ 
      error: 'SMTP connection failed', 
      details: error.message || 'Check your credentials and server settings' 
    });
  }
});

router.put('/notifications', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { emailEnabled, dailyDigest, weeklyReport } = req.body;

    await db.execute(sql`
      INSERT INTO user_settings (user_id, email_notifications_enabled, daily_digest_enabled, weekly_report_enabled)
      VALUES (${userId}, ${emailEnabled !== false}, ${dailyDigest !== false}, ${weeklyReport !== false})
      ON CONFLICT (user_id) DO UPDATE SET
        email_notifications_enabled = ${emailEnabled !== false},
        daily_digest_enabled = ${dailyDigest !== false},
        weekly_report_enabled = ${weeklyReport !== false},
        updated_at = NOW()
    `);

    res.json({ success: true, message: 'Notification preferences saved' });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    res.status(500).json({ error: 'Failed to save notification settings' });
  }
});

router.put('/automation', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { autoRespond, autoBookMeetings, voiceNotes } = req.body;

    await db.execute(sql`
      INSERT INTO user_settings (user_id, auto_respond_enabled, auto_book_meetings, voice_notes_enabled)
      VALUES (${userId}, ${autoRespond !== false}, ${autoBookMeetings !== false}, ${voiceNotes !== false})
      ON CONFLICT (user_id) DO UPDATE SET
        auto_respond_enabled = ${autoRespond !== false},
        auto_book_meetings = ${autoBookMeetings !== false},
        voice_notes_enabled = ${voiceNotes !== false},
        updated_at = NOW()
    `);

    res.json({ success: true, message: 'Automation preferences saved' });
  } catch (error) {
    console.error('Error saving automation settings:', error);
    res.status(500).json({ error: 'Failed to save automation settings' });
  }
});

router.post('/sync', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await db.execute(sql`
      UPDATE user_settings SET last_sync_at = NOW() WHERE user_id = ${userId}
    `);

    res.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating sync:', error);
    res.status(500).json({ error: 'Failed to update sync' });
  }
});

export default router;
