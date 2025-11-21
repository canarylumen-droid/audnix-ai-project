
import { Router } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';
import { encrypt } from '../lib/crypto/encryption';

const router = Router();

/**
 * Connect custom email domain
 */
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { smtpHost, smtpPort, email, password } = req.body;

    if (!smtpHost || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Encrypt credentials
    const credentials = {
      smtp_host: smtpHost,
      smtp_port: parseInt(smtpPort) || 587,
      smtp_user: email,
      smtp_pass: password,
      provider: 'custom'
    };

    const encryptedMeta = await encrypt(JSON.stringify(credentials));

    // Save integration
    await storage.createIntegration({
      userId,
      provider: 'custom_email',
      encryptedMeta,
      connected: true,
      accountType: email,
    });

    // Auto-import emails after connection
    try {
      const { importCustomEmails } = await import('../lib/channels/email');
      const emails = await importCustomEmails(credentials, 50);

      let leadsImported = 0;
      let messagesImported = 0;

      for (const emailData of emails) {
        const senderEmail = emailData.from?.split('<')[1]?.split('>')[0] || emailData.from;
        
        let lead = await storage.getLeadByEmail(userId, senderEmail);
        
        if (!lead) {
          lead = await storage.createLead({
            userId,
            name: emailData.from?.split('<')[0]?.trim() || senderEmail.split('@')[0],
            email: senderEmail,
            channel: 'email',
            status: 'new',
            metadata: {
              imported_from_custom_email: true,
              subject: emailData.subject
            }
          });
          leadsImported++;
        }

        await storage.createMessage({
          userId,
          leadId: lead.id,
          channel: 'email',
          direction: 'inbound',
          content: emailData.text || emailData.html || '',
          status: 'received',
          metadata: {
            subject: emailData.subject,
            receivedAt: emailData.date
          }
        });
        messagesImported++;
      }

      res.json({
        success: true,
        message: 'Custom email connected successfully',
        leadsImported,
        messagesImported
      });
    } catch (importError: any) {
      console.error('Auto-import failed:', importError);
      // Still return success for connection, but note import failed
      res.json({
        success: true,
        message: 'Custom email connected, but initial import failed. You can manually import later.',
        importError: importError.message
      });
    }
  } catch (error: any) {
    console.error('Error connecting custom email:', error);
    res.status(500).json({ error: 'Failed to connect custom email' });
  }
});

/**
 * Import emails from custom domain
 */
router.post('/import', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    
    // Get custom email integration
    const integration = await storage.getIntegration(userId, 'custom_email');
    
    if (!integration) {
      return res.status(400).json({ error: 'Custom email not connected' });
    }

    // Decrypt credentials
    const { decrypt } = await import('../lib/crypto/encryption');
    const credentialsStr = await decrypt(integration.encryptedMeta!);
    const credentials = JSON.parse(credentialsStr);

    // Import emails
    const { importCustomEmails } = await import('../lib/channels/email');
    const emails = await importCustomEmails(credentials, 50);

    // Store leads and messages
    let leadsImported = 0;
    let messagesImported = 0;

    for (const email of emails) {
      const senderEmail = email.from?.split('<')[1]?.split('>')[0] || email.from;
      
      // Check if lead exists
      let lead = await storage.getLeadByEmail(userId, senderEmail);
      
      if (!lead) {
        // Create new lead
        lead = await storage.createLead({
          userId,
          name: email.from?.split('<')[0]?.trim() || senderEmail.split('@')[0],
          email: senderEmail,
          channel: 'email',
          status: 'new',
          metadata: {
            imported_from_custom_email: true,
            subject: email.subject
          }
        });
        leadsImported++;
      }

      // Store message
      await storage.createMessage({
        userId,
        leadId: lead.id,
        channel: 'email',
        direction: 'inbound',
        content: email.text || email.html || '',
        status: 'received',
        metadata: {
          subject: email.subject,
          receivedAt: email.date
        }
      });
      messagesImported++;
    }

    res.json({
      success: true,
      leadsImported,
      messagesImported,
      message: 'Import completed successfully'
    });
  } catch (error: any) {
    console.error('Error importing custom emails:', error);
    res.status(500).json({ error: 'Failed to import emails' });
  }
});

/**
 * Disconnect custom email
 */
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    
    await storage.deleteIntegration(userId, 'custom_email');

    res.json({
      success: true,
      message: 'Custom email disconnected'
    });
  } catch (error: any) {
    console.error('Error disconnecting custom email:', error);
    res.status(500).json({ error: 'Failed to disconnect custom email' });
  }
});

export default router;
