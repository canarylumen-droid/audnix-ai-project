import crypto from 'crypto';
import { supabaseAdmin } from '../supabase-admin.js';
import { encrypt, decrypt } from '../crypto/encryption.js';

/**
 * WhatsApp OAuth using Twilio
 * Users connect their Twilio account to send WhatsApp messages
 */
export class WhatsAppOAuth {
  /**
   * Save Twilio WhatsApp credentials
   */
  async saveCredentials(userId: string, credentials: {
    accountSid: string;
    authToken: string;
    fromNumber: string; // Their Twilio WhatsApp number
  }): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    const encryptedMeta = await encrypt(JSON.stringify(credentials));

    // Save to oauth_tokens table
    const { error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'whatsapp',
        access_token: encryptedMeta,
        expires_at: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString(), // 1 year
        metadata: {
          from_number: credentials.fromNumber
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (tokenError) {
      console.error('Error saving Twilio credentials:', tokenError);
      throw new Error('Failed to save Twilio credentials');
    }

    // Create integration record
    await supabaseAdmin
      .from('integrations')
      .upsert({
        user_id: userId,
        provider: 'whatsapp',
        account_type: credentials.fromNumber,
        credentials: { from_number: credentials.fromNumber },
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });
  }

  /**
   * Get valid Twilio credentials
   */
  async getCredentials(userId: string): Promise<{
    accountSid: string;
    authToken: string;
    fromNumber: string;
  } | null> {
    if (!supabaseAdmin) {
      return null;
    }

    const { data: tokenData } = await supabaseAdmin
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'whatsapp')
      .single();

    if (!tokenData) {
      return null;
    }

    // Decrypt credentials
    const decryptedCredentials = await decrypt(tokenData.access_token);
    return JSON.parse(decryptedCredentials);
  }

  /**
   * Revoke/disconnect WhatsApp
   */
  async revokeCredentials(userId: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured');
    }

    // Remove from database
    await supabaseAdmin
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'whatsapp');

    // Update integration status
    await supabaseAdmin
      .from('integrations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'whatsapp');
  }

  /**
   * Validate Twilio credentials
   */
  async validateCredentials(credentials: {
    accountSid: string;
    authToken: string;
  }): Promise<boolean> {
    try {
      // Validate accountSid format to prevent SSRF
      if (!/^AC[a-f0-9]{32}$/i.test(credentials.accountSid)) {
        return false;
      }
      
      // Only allow requests to Twilio API
      const allowedHost = 'api.twilio.com';
      const url = new URL(`https://${allowedHost}/2010-04-01/Accounts/${credentials.accountSid}.json`);
      
      // Double-check the host to prevent DNS rebinding attacks
      if (url.hostname !== allowedHost) {
        return false;
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64')}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}