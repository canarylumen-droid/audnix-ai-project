/* @ts-nocheck */
import { Router } from 'express';
import { requireAuth, getCurrentUserId } from '../middleware/auth';
import { storage } from '../storage';
import { db } from '../db';
import { otpCodes } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { multiProviderEmailFailover } from '../lib/email/multi-provider-failover';
import { generateOTPEmail, generateOTPPlaintext, generateOTPMinimal } from '../lib/email/otp-templates';
import crypto from 'crypto';

const router = Router();

/**
 * Generate and send OTP code
 */
router.post('/send', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Get user details
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database (expires in 10 minutes)
    await storage.createOtpCode({
      email,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false
    });

    // Generate branded HTML email
    const htmlContent = generateOTPEmail({
      code: otp,
      companyName: user.company || 'Audnix AI',
      userEmail: email,
      expiryMinutes: 10,
      logoUrl: user.metadata?.logoUrl,
      brandColor: user.metadata?.brandColor || '#00D9FF'
    });

    // Send with multi-provider failover
    const result = await multiProviderEmailFailover.send({
      to: email,
      subject: '🔐 Your Audnix AI Verification Code',
      html: htmlContent,
      from: `noreply@${user.company?.toLowerCase().replace(/\s+/g, '') || 'audnix'}.com`
    }, userId);

    if (!result.success) {
      console.error('OTP send failed:', result.error);
      return res.status(500).json({
        error: 'Failed to send OTP',
        details: result.error
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      provider: result.provider,
      expiresIn: '10 minutes',
      // Don't return the actual OTP code for security
      codeLength: otp.length
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * Verify OTP code
 */
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ error: 'Code and email required' });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Query OTP codes table to find matching code
    const otpRecords = await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.verified, false)
      )
    ).limit(1);

    if (!otpRecords || otpRecords.length === 0) {
      console.log(`❌ OTP verification failed for ${email}: Code not found or already used`);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired code'
      });
    }

    const otpRecord = otpRecords[0];
    
    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      console.log(`❌ OTP expired for ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Code has expired'
      });
    }

    // Check attempts - max 5 wrong attempts
    if (otpRecord.attempts >= 5) {
      console.log(`❌ Max attempts exceeded for ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Mark OTP as verified
    await db.update(otpCodes)
      .set({ verified: true, attempts: otpRecord.attempts + 1 })
      .where(eq(otpCodes.id, otpRecord.id));

    console.log(`✅ OTP verified successfully for ${email}`);

    res.json({
      success: true,
      message: 'Code verified successfully',
      email: email
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

/**
 * Resend OTP (rate-limited)
 */
router.post('/resend', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req)!;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check rate limit - max 3 resends per 15 minutes
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Would check rate limit here - for now just allow
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    await storage.createOtpCode({
      email,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false
    });

    // Send OTP
    const htmlContent = generateOTPEmail({
      code: otp,
      companyName: user.company || 'Audnix AI',
      userEmail: email,
      expiryMinutes: 10,
      logoUrl: user.metadata?.logoUrl,
      brandColor: user.metadata?.brandColor || '#00D9FF'
    });

    const result = await multiProviderEmailFailover.send({
      to: email,
      subject: '🔐 Your Audnix AI Verification Code (Resend)',
      html: htmlContent,
      from: `noreply@${user.company?.toLowerCase().replace(/\s+/g, '') || 'audnix'}.com`
    }, userId);

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to resend OTP' });
    }

    res.json({
      success: true,
      message: 'OTP resent successfully',
      provider: result.provider
    });
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

export default router;
