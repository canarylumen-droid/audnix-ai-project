import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage.js';
import { supabaseAdmin, isSupabaseAdminConfigured } from './lib/supabase-admin.js';
import {
  isDemoMode as stripeDemoMode,
  createStripeCustomer,
  createSubscription,
  updateSubscriptionPlan,
  cancelSubscription,
  PLANS,
  TOPUPS,
  verifyWebhookSignature,
  processTopupSuccess,
  createSubscriptionCheckout,
  createTopupCheckout,
  getSubscriptionPaymentLink,
  getTopupPaymentLink
} from './lib/billing/stripe.js';
import { generateInsights } from './lib/ai/openai.js';
import { uploadVoice, uploadPDF, uploadAvatar, uploadToSupabase, storeVoiceSample, processPDFEmbeddings } from './lib/file-upload.js';
import { scheduleInitialFollowUp } from './lib/ai/follow-up-worker.js';
import { processPDF } from './lib/pdf-processor.js';
import { encrypt } from './lib/crypto/encryption.js';
import oauthRoutes from './routes/oauth.js';
import webhookRouter from './routes/webhook.js';
import workerRouter from './routes/worker.js';
import commentAutomationRouter from './routes/comment-automation-routes.js';
import videoAutomationRoutes from './routes/video-automation-routes.js';
import aiRoutes from './routes/ai-routes.js';
import voiceRoutes from './routes/voice-routes.js';
// WhatsApp removed - not needed for MVP
// import whatsappRoutes from './routes/whatsapp-routes.js';
// import whatsappOTPRoutes from './routes/whatsapp-otp-routes.js';
import customEmailRoutes from './routes/custom-email-routes.js';
import emailStatsRoutes from './routes/email-stats-routes.js';
import otpRoutes from './routes/otp-routes.js';
import calendarRoutes from './routes/calendar-routes.js';
import bulkActionsRoutes from './routes/bulk-actions-routes.js';
import { paymentApprovalRouter } from './routes/payment-approval.js';
import { paymentCheckoutRouter } from './routes/payment-checkout.js';
import adminPdfRoutes from './routes/admin-pdf-routes.js';
import adminPdfRoutesV2 from './routes/admin-pdf-routes-v2.js';
import leadIntelligenceRouter from './routes/lead-intelligence.js';
import aiSalesSuggestionRouter from './routes/ai-sales-suggestion.js';
import emailOTPRoutes from './routes/email-otp-routes.js';
import stripePaymentConfirmation from './routes/stripe-payment-confirmation.js';
import authUsernameOnboarding from './routes/auth-username-onboarding.js';
import authClean from './routes/auth-clean.js';
import userAuth from './routes/user-auth.js';
import adminAuth from './routes/admin-auth.js';
// WhatsApp removed - not needed for MVP
// import whatsappConnect from './routes/whatsapp-connect.js';
import dashboardRoutes from './routes/dashboard-routes.js';
import salesEngineRouter from './routes/sales-engine.js';
import emailTrackingRoutes from './routes/email-tracking-routes.js';
import dnsVerificationRoutes from './routes/dns-verification-routes.js';
import instagramStatusRoutes from './routes/instagram-status.js';
import { followUpWorker } from './lib/ai/follow-up-worker.js';
import { weeklyInsightsWorker } from './lib/ai/weekly-insights-worker.js';
import { requireAuth, requireAdmin, optionalAuth, getCurrentUserId } from './middleware/auth.js';
import {
  validateEmail,
  validateLeadId,
  validateMessageBody,
  validateLeadName,
  validateSearchQuery,
  validatePlanKey,
  validateProvider,
  handleValidationErrors,
  sanitizeBody
} from './middleware/input-validation.js';

// Import AI modules for lead learning and content moderation
import { contentModerationService } from './lib/ai/content-moderation.js';
import { leadLearningSystem } from './lib/ai/lead-learning-system.js';

// Import necessary modules for PDF processing and lead export
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for PDF uploads

export async function registerRoutes(app: Express): Promise<Server> {
  // Add no-cache headers to ALL API responses
  app.use("/api/", (req, res, next) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    next();
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Security: Apply body sanitization to all routes
  app.use(sanitizeBody);

  // Get user count (for real-time counter)
  app.get("/api/users/count", async (req, res) => {
    try {
      const count = await storage.getUserCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting user count:", error);
      res.status(500).json({ error: "Failed to get user count" });
    }
  });

  // Demo webhook - for testing demo mode - PROTECTED: Only available in development or for admins
  app.post("/api/webhook/demo", requireAdmin, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Demo endpoint is disabled in production" });
    }

    try {
      const demoUser = {
        email: `demo${Date.now()}@example.com`,
        name: `Demo User ${Math.floor(Math.random() * 1000)}`,
        supabaseId: `demo_${Date.now()}`,
        plan: "trial" as const,
      };

      const user = await storage.createUser(demoUser);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({ error: "Failed to create demo user" });
    }
  });

  // ⚠️ DEPRECATED: Supabase auth callback disabled - using password + OTP auth instead
  // All authentication now handled via:
  // 1. POST /api/user/auth/signup/request-otp (SendGrid OTP)
  // 2. POST /api/user/auth/login (password auth)
  // 3. Session stored in PostgreSQL (Neon)
  app.get("/api/auth/callback", async (req, res) => {
    console.warn("❌ Supabase OAuth callback disabled - use email/password auth instead");
    return res.redirect("/auth?error=oauth_disabled");
  });

  // Custom email OTP - Send code (independent of Supabase)
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email required" });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in database
      await storage.createOtpCode({
        email,
        code,
        expiresAt,
        attempts: 0,
        verified: false
      });

      // Send email using SendGrid API
      // For now, just log it (replace with actual email sending)
      console.log(`OTP Code for ${email}: ${code}`);

      res.json({ success: true, message: "Check your email for the code" });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send code" });
    }
  });

  // Custom email OTP - Verify code
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;

      const otpRecord = await storage.getLatestOtpCode(email);

      if (!otpRecord) {
        return res.status(400).json({ error: "No code found. Request a new one." });
      }

      if (otpRecord.verified) {
        return res.status(400).json({ error: "Code already used" });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({ error: "Code expired. Request a new one." });
      }

      if (otpRecord.attempts >= 3) {
        return res.status(400).json({ error: "Too many attempts. Request a new code." });
      }

      if (otpRecord.code !== code) {
        await storage.incrementOtpAttempts(otpRecord.id);
        return res.status(400).json({ error: "Invalid code" });
      }

      // Mark as verified
      await storage.markOtpVerified(otpRecord.id);

      // Create or get user
      let user = await storage.getUserByEmail(email);
      if (!user) {
        // Generate nice username from email (capitalize first letter)
        const emailUsername = email.split('@')[0];
        const username = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
        
        user = await storage.createUser({
          email,
          name: username,
          username: username,
          plan: "trial",
          supabaseId: null,
          lastLogin: new Date(),
        });
      } else {
        // Update last login for returning user
        await storage.updateUser(user.id, { lastLogin: new Date() });
      }

      // Create session with 24-hour expiry
      req.session.regenerate((regErr) => {
        if (regErr) {
          return res.status(500).json({ error: "Session error" });
        }

        (req.session as any).userId = user!.id;
        (req.session as any).userEmail = user!.email;
        (req.session as any).createdAt = new Date();
        // Set 24-hour cookie expiry
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Session save error" });
          }
          res.json({ success: true, user });
        });
      });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Resend OTP with 60-second cooldown
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email required" });
      }

      const normalizedEmail = email.toLowerCase();

      // Check if there's a recent OTP (within 60 seconds) to enforce cooldown
      const latestOtp = await storage.getLatestOtpCode(normalizedEmail);
      if (latestOtp) {
        const otpCreatedAt = new Date(latestOtp.createdAt || Date.now());
        const secondsSinceLastOtp = (Date.now() - otpCreatedAt.getTime()) / 1000;
        const cooldownSeconds = 60;

        if (secondsSinceLastOtp < cooldownSeconds) {
          const remainingSeconds = Math.ceil(cooldownSeconds - secondsSinceLastOtp);
          return res.status(429).json({ 
            error: `Please wait ${remainingSeconds} seconds before requesting a new code`,
            retryAfter: remainingSeconds
          });
        }
      }

      // Generate new 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in database
      await storage.createOtpCode({
        email: normalizedEmail,
        code,
        expiresAt,
        attempts: 0,
        verified: false
      });

      // Send email using SendGrid API (for now just log it if not configured)
      const sendgridKey = process.env.TWILIO_SENDGRID_API_KEY;
      if (sendgridKey) {
        const { twilioEmailOTP } = await import('./lib/auth/twilio-email-otp.js');
        await twilioEmailOTP.resendEmailOTP(normalizedEmail);
      } else {
        console.log(`[DEV] OTP Code for ${normalizedEmail}: ${code}`);
      }

      res.json({ success: true, message: "A new code has been sent to your email" });
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      res.status(500).json({ error: "Failed to resend code" });
    }
  });

  // Direct email/password signup (no email verification)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email required" });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists. Please log in instead." });
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      // ADMIN WHITELIST: Check if email is in admin list (from environment variable)
      const adminWhitelistEnv = process.env.ADMIN_WHITELIST_EMAILS || '';
      const adminWhitelist = adminWhitelistEnv
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);
      const isAdmin = adminWhitelist.includes(email.toLowerCase());
      
      // OWNER WHITELIST: Check if email qualifies for enterprise plan (owners get premium access)
      const ownerWhitelistEnv = process.env.OWNER_WHITELIST_EMAILS || '';
      const ownerWhitelist = ownerWhitelistEnv
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);
      const isOwner = ownerWhitelist.includes(email.toLowerCase());
      
      // Determine plan: owners get enterprise, everyone else gets trial
      const userPlan = isOwner ? 'enterprise' : 'trial';

      // Create user account
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        plan: userPlan,
        role: isAdmin ? 'admin' : 'member',
      });

      // Automatically log them in
      req.session.userId = user.id;
      req.session.userEmail = user.email;

      // Save session before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Direct email/password login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email required" });
      }

      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.password) {
        return res.status(400).json({ error: "This account uses social login. Please use Google to sign in." });
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Create session
      req.session.regenerate((regErr) => {
        if (regErr) {
          console.error("Error regenerating session:", regErr);
          return res.status(500).json({ error: "Session error" });
        }

        (req.session as any).userId = user.id;
        (req.session as any).userEmail = user.email;

        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ error: "Session save error" });
          }

          res.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              username: user.username
            }
          });
        });
      });
    } catch (error: any) {
      console.error("Error in login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Check username availability
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.body;

      if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).json({ error: "Invalid username format" });
      }

      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      res.json({ success: true, message: "Username available" });
    } catch (error: any) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  // Set username for logged-in user
  app.post("/api/auth/set-username", async (req, res) => {
    try {
      console.log('📝 [set-username] Request received');
      console.log('📝 [set-username] Session ID:', req.sessionID);
      console.log('📝 [set-username] Session userId:', req.session?.userId);
      console.log('📝 [set-username] Cookies:', req.headers.cookie ? 'Present' : 'Missing');
      
      const userId = req.session?.userId;
      if (!userId) {
        console.error('❌ [set-username] No userId in session - auth failed');
        console.error('❌ [set-username] Session data:', JSON.stringify(req.session));
        return res.status(401).json({ 
          error: "Not authenticated",
          hint: "Session may have expired. Please login again."
        });
      }

      const { username } = req.body;

      if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).json({ error: "Invalid username format" });
      }

      // Check if username is already taken by someone else
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Update user's username
      const updatedUser = await storage.updateUser(userId, { username });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update username" });
      }

      console.log(`✅ [set-username] Username set successfully for ${userId}: ${username}`);

      res.json({ 
        success: true, 
        message: "Username updated",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name
        }
      });
    } catch (error: any) {
      console.error("❌ [set-username] Error:", error);
      res.status(500).json({ error: "Failed to set username" });
    }
  });

  // Sign out endpoint - using PostgreSQL sessions only (no Supabase auth)
  app.post("/api/auth/signout", async (req, res) => {
    try {
      // Destroy session (stored in PostgreSQL)
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ error: "Failed to destroy session" });
          }

          // Clear the session cookie (using correct cookie name)
          res.clearCookie('audnix.sid', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
          });

          res.status(200).json({ success: true, message: "Signed out successfully" });
        });
      } else {
        res.status(200).json({ success: true, message: "Signed out successfully" });
      }
    } catch (error) {
      console.error("Error signing out:", error);
      res.status(500).json({ error: "Failed to sign out" });
    }
  });

  // Create or update user (called after successful Supabase auth)
  app.post("/api/users", async (req, res) => {
    try {
      const { supabaseId, email, name, username } = req.body;

      if (!supabaseId || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user already exists
      let user = await storage.getUserBySupabaseId(supabaseId);

      if (user) {
        // Update last login
        user = await storage.updateUser(user.id, {
          lastLogin: new Date(),
        });
      } else {
        // Create new user with trial
        user = await storage.createUser({
          supabaseId,
          email,
          name,
          username,
          plan: "trial",
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Error creating/updating user:", error);
      res.status(500).json({ error: "Failed to process user" });
    }
  });

  // ==================== Onboarding API ====================

  app.post("/api/onboarding", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const { userRole, source, useCase, businessSize, tags, companyName } = req.body;

      console.log("[Onboarding] POST request - userId:", userId, "data:", { userRole, source, useCase, businessSize, tags: tags?.length, companyName });

      // Validation
      if (!userId) {
        console.error("[Onboarding] No userId in session");
        return res.status(401).json({ error: "Session expired. Please log in again." });
      }

      if (!userRole) {
        return res.status(400).json({ error: "User role is required" });
      }

      // Verify user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        console.error("[Onboarding] User not found in database:", userId);
        return res.status(404).json({ error: "User not found. Please log in again." });
      }

      // Check if profile already exists
      let existingProfile;
      try {
        existingProfile = await storage.getOnboardingProfile(userId);
      } catch (err) {
        console.log("[Onboarding] No existing profile found, creating new one");
      }
      
      let profile;
      if (existingProfile) {
        // Update existing profile
        console.log("[Onboarding] Updating existing profile for user:", userId);
        profile = await storage.updateOnboardingProfile(userId, {
          userRole,
          source: source || null,
          useCase: useCase || null,
          businessSize: businessSize || null,
          tags: tags || [],
          completed: true,
          completedAt: new Date(),
        });
      } else {
        // Create new profile
        console.log("[Onboarding] Creating new profile for user:", userId);
        profile = await storage.createOnboardingProfile({
          userId,
          userRole,
          source: source || null,
          useCase: useCase || null,
          businessSize: businessSize || null,
          tags: tags || [],
          completed: true,
          completedAt: new Date(),
        });
      }

      // Mark onboarding as completed in user metadata and store company name
      console.log("[Onboarding] Updating user metadata with onboarding status");
      await storage.updateUser(userId, {
        metadata: {
          ...(user.metadata || {}),
          onboardingCompleted: true,
          companyName: companyName || null,
        },
        businessName: companyName || user.businessName,
      });

      console.log("[Onboarding] Successfully saved onboarding profile for user:", userId);
      res.json({ success: true, profile });
    } catch (error: any) {
      console.error("[Onboarding] Error saving onboarding:", error.message, error.stack);
      res.status(500).json({ 
        error: "Failed to save onboarding data", 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  });

  app.get("/api/onboarding", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const profile = await storage.getOnboardingProfile(userId);
      res.json({ profile });
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      res.status(500).json({ error: "Failed to fetch onboarding data" });
    }
  });

  // ==================== Leads API ====================

  app.get("/api/leads", requireAuth, async (req, res) => {
    try {
      const { status, channel, search, limit = 50 } = req.query;
      const userId = getCurrentUserId(req)!;

      const leads = await storage.getLeads({
        userId,
        status: status as string,
        channel: channel as string,
        search: search as string,
        limit: parseInt(limit as string),
      });

      res.json({ leads });
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lead = await storage.getLeadById(id);

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ lead });
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const lead = await storage.updateLead(id, updates);

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ lead });
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // ==================== Messages API ====================

  app.get("/api/leads/:leadId/messages", async (req, res) => {
    try {
      const { leadId } = req.params;
      const messages = await storage.getMessagesByLeadId(leadId);

      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/leads/:leadId/messages", requireAuth, validateMessageBody, handleValidationErrors, async (req, res) => {
    try {
      const { leadId } = req.params;
      const { body, useVoice } = req.body;
      const userId = getCurrentUserId(req)!;

      // Check plan limits
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const leads = await storage.getLeads({ userId, limit: 10000 });
      const leadLimits: Record<string, number> = {
        'trial': 500,
        'starter': 2500,
        'pro': 7000,
        'enterprise': 20000
      };

      const userLimit = leadLimits[user.plan] || 500;
      if (leads.length >= userLimit) {
        return res.status(402).json({
          error: "Lead limit reached",
          message: `You've reached your plan's limit of ${userLimit} leads. Please upgrade to continue.`,
          redirectTo: "/dashboard/pricing"
        });
      }

      // Moderate outbound content before sending
      const moderationResult = await contentModerationService.moderateWithAI(body);

      if (moderationResult.shouldBlock) {
        await contentModerationService.logModerationEvent(userId, leadId, body, moderationResult);
        return res.status(400).json({
          error: "Message blocked by content filter",
          flags: moderationResult.flags,
          category: moderationResult.category
        });
      }

      // Create message
      const message = await storage.createMessage({
        leadId,
        userId,
        provider: "instagram",
        direction: "outbound",
        body,
        metadata: {
          moderationScore: moderationResult.confidence,
          moderationFlags: moderationResult.flags
        }
      });

      // Message tracking handled by lead learning system automatically
      // await trackMessage(message);

      // Learn from this interaction in real-time
      await leadLearningSystem.analyzeAndLearn(message.leadId, message);

      res.json({ message });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ==================== Integrations API ====================

  app.get("/api/integrations", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const integrations = await storage.getIntegrations(userId);

      res.json({ integrations });
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations/:provider/connect", requireAuth, validateProvider, handleValidationErrors, async (req, res) => {
    try {
      const { provider } = req.params;
      const { tokens, metadata } = req.body;
      const userId = getCurrentUserId(req)!;

      // Encrypt and store integration
      const integration = await storage.createIntegration({
        userId,
        provider: provider as "instagram" | "whatsapp" | "gmail" | "manychat",
        encryptedMeta: JSON.stringify({ tokens, metadata }),
        connected: true,
      });

      res.json({ integration });
    } catch (error) {
      console.error("Error connecting integration:", error);
      res.status(500).json({ error: "Failed to connect integration" });
    }
  });

  app.post("/api/integrations/:provider/disconnect", requireAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const userId = getCurrentUserId(req)!;

      await storage.disconnectIntegration(userId, provider);

      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  });

  // ==================== Insights API ====================

  app.get("/api/insights", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;


  /**
   * Import leads from CSV file
   * POST /api/leads/import-csv
   */
  app.post("/api/leads/import-csv", requireAuth, upload.single('csv'), async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;

      if (!req.file) {
        return res.status(400).json({ error: "No CSV file uploaded" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.plan === 'trial') {
        return res.status(403).json({
          error: "Premium feature",
          message: "Lead import is available on paid plans. Upgrade to import more leads via CSV, Excel, or PDF.",
          redirectTo: "/dashboard/pricing"
        });
      }

      const integrations = await storage.getIntegrations(userId);
      const hasEmail = integrations.some(i => (i.provider === 'gmail' || i.provider === 'outlook') && i.connected);
      const hasWhatsApp = integrations.some(i => i.provider === 'whatsapp' && i.connected);

      const results: any[] = [];
      const errors: string[] = [];
      let imported = 0;
      let skipped = 0;
      let emailsSent = 0;
      let whatsappSent = 0;

      const { Readable } = require('stream');
      const stream = Readable.from(req.file.buffer.toString('utf-8'));

      stream
        .pipe(csv())
        .on('data', (row: any) => {
          const name = row.Name || row.name || row.FullName || row['Full Name'] || '';
          const email = row.Email || row.email || row.EmailAddress || row['Email Address'] || '';
          const phone = row.Phone || row.phone || row.PhoneNumber || row['Phone Number'] || row.WhatsApp || row.whatsapp || '';
          const company = row.Company || row.company || row.Organization || '';
          const tags = row.Tags || row.tags || '';

          results.push({ name, email, phone, company, tags });
        })
        .on('end', async () => {
          for (const lead of results) {
            try {
              if (!lead.name || lead.name.length < 2) {
                errors.push(`Skipped: Invalid name "${lead.name}"`);
                skipped++;
                continue;
              }

              const existingLeads = await storage.getLeads({ userId, limit: 10000 });
              const existingByEmail = lead.email ?
                existingLeads.find(l => l.email?.toLowerCase() === lead.email.toLowerCase()) : null;
              const existingByPhone = lead.phone ?
                existingLeads.find(l => l.phone === lead.phone) : null;

              if (existingByEmail || existingByPhone) {
                skipped++;
                continue;
              }

              const leadChannel = (lead.email ? 'email' : lead.phone ? 'whatsapp' : 'instagram') as 'email' | 'instagram' | 'whatsapp';
              const leadData = await storage.createLead({
                userId,
                name: lead.name,
                email: lead.email || null,
                phone: lead.phone || null,
                channel: leadChannel,
                status: 'new',
                tags: lead.tags ? lead.tags.split(',').map((t: string) => t.trim()) : ['csv-import'],
                metadata: {
                  company: lead.metadata?.company,
                  source: 'csv_import',
                  imported_at: new Date().toISOString()
                }
              });

              imported++;

              // Auto-schedule initial follow-up for imported leads
              try {
                await scheduleInitialFollowUp(userId, leadData.id, leadChannel);
              } catch (followUpError) {
                console.warn(`Failed to schedule follow-up for ${lead.name}:`, followUpError);
              }

              if (lead.phone && hasWhatsApp) {
                try {
                  await storage.createMessage({
                    leadId: leadData.id,
                    userId,
                    provider: 'whatsapp',
                    direction: 'outbound',
                    body: `Hi ${lead.name}! We're reaching out regarding your recent inquiry. How can we help you today?`,
                    metadata: { auto_sent: true, source: 'csv_import' }
                  });
                  whatsappSent++;
                } catch (whatsappError) {
                  console.error(`Failed to send WhatsApp to ${lead.name}:`, whatsappError);
                }
              }
            } catch (error: any) {
              errors.push(`Error importing ${lead.name}: ${error.message}`);
              skipped++;
            }
          }

          res.json({
            success: true,
            imported,
            skipped,
            emailsSent,
            whatsappSent,
            hasEmailConnected: hasEmail,
            hasWhatsAppConnected: hasWhatsApp,
            errors: errors.slice(0, 10)
          });
        })
        .on('error', (error: any) => {
          console.error('CSV parse error:', error);
          res.status(500).json({ error: "Failed to parse CSV file" });
        });

    } catch (error: any) {
      console.error("CSV import error:", error);
      res.status(500).json({ error: error.message || "Import failed" });
    }
  });

  /**
   * Import leads from PDF file with AI extraction
   * POST /api/leads/import-pdf
   */
  app.post("/api/leads/import-pdf", requireAuth, uploadPDF.single('pdf'), async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;

      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      // CHECK: Rate limiting
      const { UploadRateLimiter } = await import('./lib/upload-rate-limiter.js');
      const rateLimitCheck = await UploadRateLimiter.canUpload(userId);
      if (!rateLimitCheck.allowed) {
        const { AuditTrailService } = await import('./lib/audit-trail-service.js');
        await AuditTrailService.logRateLimitHit(userId, `PDF upload rate limited - ${rateLimitCheck.message}`);
        
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: rateLimitCheck.message,
          resetTime: rateLimitCheck.resetTime
        });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.plan === 'trial') {
        return res.status(403).json({
          error: "Premium feature",
          message: "PDF lead extraction with AI is available on paid plans. Upgrade to extract leads, brand colors, and product info from PDFs.",
          redirectTo: "/dashboard/pricing"
        });
      }

      const integrations = await storage.getIntegrations(userId);
      const hasEmail = integrations.some(i => (i.provider === 'gmail' || i.provider === 'outlook') && i.connected);
      const hasWhatsApp = integrations.some(i => i.provider === 'whatsapp' && i.connected);

      const fileBuffer = req.file.buffer;

      const { processPDF } = await import('./lib/pdf-processor.js');
      const result = await processPDF(fileBuffer, userId, {
        autoReachOut: hasEmail || hasWhatsApp,
        extractOffer: true
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.error || "Failed to extract leads from PDF"
        });
      }

      // LOG: PDF confidence to analytics
      try {
        const { AuditTrailService } = await import('./lib/audit-trail-service.js');
        const confidence = result.confidence || 0.75; // Default to 75% if not provided
        const missingFields = result.missingFields || [];
        await AuditTrailService.logPdfProcessed(
          userId,
          req.file.originalname || 'unknown.pdf',
          req.file.size || 0,
          confidence,
          missingFields,
          result.leadsCreated || 0
        );

        // Alert if low confidence
        const qualityCheck = await AuditTrailService.checkPdfQualityThreshold(userId);
        if (qualityCheck.shouldAlert) {
          console.warn(`🚨 PDF Quality Alert for user ${userId}`);
        }
      } catch (analyticsError) {
        console.error('Failed to log PDF analytics:', analyticsError);
      }

      res.json({
        success: true,
        leadsImported: result.leadsCreated || 0,
        duplicates: 0,
        offerExtracted: result.offerExtracted || null,
        brandExtracted: result.brandExtracted || null,
        leads: result.leads || [],
        hasEmailConnected: hasEmail,
        hasWhatsAppConnected: hasWhatsApp,
        uploadStatus: rateLimitCheck.message,
        remainingUploads: rateLimitCheck.remainingUploads
      });

    } catch (error: any) {
      console.error("PDF import error:", error);
      res.status(500).json({ error: error.message || "PDF import failed" });
    }
  });

  /**
   * Toggle AI pause for a lead (opt-out)
   * PATCH /api/leads/:id/ai-pause
   */
  app.patch("/api/leads/:id/ai-pause", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const leadId = req.params.id;
      const { aiPaused } = req.body;

      if (typeof aiPaused !== 'boolean') {
        return res.status(400).json({ error: "aiPaused must be a boolean" });
      }

      // Verify lead belongs to user
      const lead = await storage.getLead(leadId);
      if (!lead || lead.userId !== userId) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Update lead
      await storage.updateLead(leadId, { aiPaused });

      // LOG: Audit trail
      try {
        const { AuditTrailService } = await import('./lib/audit-trail-service.js');
        await AuditTrailService.logOptOutToggle(userId, leadId, aiPaused);
      } catch (auditError) {
        console.error('Failed to log opt-out:', auditError);
      }

      res.json({
        success: true,
        leadId,
        aiPaused,
        message: aiPaused ? `✋ AI paused for ${lead.name}` : `▶️ AI resumed for ${lead.name}`
      });

    } catch (error: any) {
      console.error("Opt-out toggle error:", error);
      res.status(500).json({ error: error.message || "Failed to update lead" });
    }
  });

      const leads = await storage.getLeads({ userId, limit: 1000 });

      if (leads.length === 0) {
        return res.json({
          hasData: false,
          summary: null,
          channels: [],
          funnel: [],
          timeSeries: [],
          metrics: {
            avgResponseTime: "—",
            conversionRate: "0",
            engagementScore: "0",
          },
        });
      }

      // Channel breakdown
      const channelStats = leads.reduce((acc: any, lead: any) => {
        acc[lead.channel] = (acc[lead.channel] || 0) + 1;
        return acc;
      }, {});

      const totalLeads = leads.length;
      const channels = Object.entries(channelStats).map(([channel, count]) => ({
        channel: channel.charAt(0).toUpperCase() + channel.slice(1),
        count,
        percentage: Math.round((count as number / totalLeads) * 100),
      }));

      // Conversion funnel
      const statusStats = leads.reduce((acc: any, lead: any) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      const statusOrder = ['new', 'open', 'replied', 'converted', 'not_interested', 'cold'];
      const funnel = statusOrder
        .filter(status => statusStats[status])
        .map(status => ({
          stage: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          count: statusStats[status],
          percentage: Math.round((statusStats[status] / totalLeads) * 100),
        }));

      // Time series (last 7 days)
      const now = new Date();
      const timeSeries = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const leadsCount = leads.filter(lead => {
          const leadDate = new Date(lead.createdAt);
          return leadDate >= dayStart && leadDate <= dayEnd;
        }).length;

        timeSeries.push({
          date: dateStr,
          leads: leadsCount,
        });
      }

      // Metrics
      const convertedCount = statusStats['converted'] || 0;
      const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "0";

      const metrics = {
        avgResponseTime: "2.3h",
        conversionRate,
        engagementScore: Math.min(100, Math.round((leads.filter(l => l.status === 'replied' || l.status === 'converted').length / totalLeads) * 100)).toString(),
      };

      // Generate AI insights (with fallback if OpenAI not configured)
      const analyticsData = {
        total_leads: totalLeads,
        by_channel: channelStats,
        by_status: statusStats,
        conversion_rate: conversionRate,
      };

      let summary = null;
      try {
        summary = await generateInsights(
          analyticsData,
          "Generate a concise 2-sentence summary of lead performance and the most important insight:"
        );
      } catch (error) {
        // Fallback summary if OpenAI is not configured
        const topChannel = Object.entries(channelStats).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
        summary = `You have ${totalLeads} total leads with a ${conversionRate}% conversion rate. ${topChannel ? `${topChannel[0]} is your top channel with ${topChannel[1]} leads.` : 'Start connecting channels to see more insights.'}`;
        console.warn("OpenAI not configured, using fallback insights");
      }

      res.json({
        hasData: true,
        summary,
        channels,
        funnel,
        timeSeries,
        metrics,
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  app.get("/api/insights/summary", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;

      // Get data for insights
      const leads = await storage.getLeads({ userId, limit: 1000 });

      const analyticsData = {
        total_leads: leads.length,
        by_channel: leads.reduce((acc: any, lead: any) => {
          acc[lead.channel] = (acc[lead.channel] || 0) + 1;
          return acc;
        }, {}),
        by_status: leads.reduce((acc: any, lead: any) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {}),
      };

      // Generate AI insights
      const summary = await generateInsights(
        analyticsData,
        "Generate a concise summary of lead performance and key insights:"
      );

      res.json({ summary, data: analyticsData });
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  app.get("/api/insights/metrics", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;

      // Fetch real metrics from database
      const leads = await storage.getLeads({ userId, limit: 1000 });
      const conversions = leads.filter(l => l.status === 'converted').length;
      const conversionRate = leads.length > 0 ? (conversions / leads.length) * 100 : 0;

      // Get actual message counts
      const allMessages = await Promise.all(
        leads.map(lead => storage.getMessagesByLeadId(lead.id))
      );
      const messageCount = allMessages.flat().length;
      const aiReplyCount = allMessages.flat().filter(m =>
        m.direction === 'outbound' && m.metadata?.isAiGenerated
      ).length;

      const metrics = {
        leads: leads.length,
        messages: messageCount,
        aiReplies: aiReplyCount,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
      };

      res.json({ metrics });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // ==================== Billing API ====================

  app.get("/api/billing/plans", async (req, res) => {
    res.json({ plans: PLANS });
  });

  app.post("/api/billing/subscribe", requireAuth, validatePlanKey, handleValidationErrors, async (req, res) => {
    try {
      const { planKey } = req.body;
      const userId = getCurrentUserId(req)!;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create Stripe customer if doesn't exist
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        stripeCustomerId = await createStripeCustomer(user.email, user.name || undefined, user.id);
        await storage.updateUser(user.id, { stripeCustomerId });
      }

      // Create subscription
      const { subscriptionId, clientSecret } = await createSubscription(stripeCustomerId, planKey);

      // Update user
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscriptionId,
        plan: planKey,
      });

      res.json({ clientSecret, subscriptionId });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  app.post("/api/billing/payment-link", requireAuth, async (req, res) => {
    try {
      const { planKey } = req.body;
      const userId = getCurrentUserId(req)!;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get payment link directly from Stripe
      const url = await getSubscriptionPaymentLink(planKey, userId);

      if (!url) {
        return res.status(400).json({ error: "No payment link configured for this plan" });
      }

      res.json({ url });
    } catch (error: any) {
      console.error("Error getting payment link:", error);
      res.status(500).json({ error: error.message || "Failed to get payment link" });
    }
  });

  app.post("/api/billing/checkout", requireAuth, async (req, res) => {
    try {
      const { planKey } = req.body;
      const userId = getCurrentUserId(req)!;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create Stripe customer if doesn't exist
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        stripeCustomerId = await createStripeCustomer(user.email, user.name || undefined, user.id);
        await storage.updateUser(user.id, { stripeCustomerId });
      }

      // Create checkout session
      const { sessionId, url } = await createSubscriptionCheckout(
        stripeCustomerId,
        planKey,
        user.id
      );

      res.json({ sessionId, url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Get voice minutes balance
  app.get("/api/voice/balance", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const planMinutes: Record<string, number> = {
        'starter': parseInt(process.env.VOICE_MINUTES_PLAN_49 || '300'),
        'pro': parseInt(process.env.VOICE_MINUTES_PLAN_99 || '800'),
        'enterprise': parseInt(process.env.VOICE_MINUTES_PLAN_199 || '1000'),
        'trial': 0
      };

      // Calculate total available: plan + topups
      const planAllowance = planMinutes[user.plan] || 0;
      const topupMinutes = user.voiceMinutesTopup || 0;
      const totalMinutes = planAllowance + topupMinutes;

      // Get actual usage from database
      const usedMinutes = user.voiceMinutesUsed || 0;
      const balance = Math.max(0, totalMinutes - usedMinutes);

      res.json({
        total: totalMinutes,
        used: usedMinutes,
        balance,
        percentage: totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0,
        locked: balance <= 0
      });
    } catch (error) {
      console.error("Error fetching voice balance:", error);
      res.status(500).json({ error: "Failed to fetch voice balance" });
    }
  });

  // Voice top-up checkout
  app.post("/api/billing/topup", requireAuth, async (req, res) => {
    try {
      const { topupKey } = req.body;
      const userId = getCurrentUserId(req)!;
      const user = await storage.getUserById(userId);

      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "User not configured for billing" });
      }

      const { sessionId, url } = await createTopupCheckout(
        user.stripeCustomerId,
        topupKey,
        user.id
      );

      res.json({ sessionId, url });
    } catch (error) {
      console.error("Error creating topup checkout:", error);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });

  // ==================== Stripe Webhook (Disabled Until Revenue Starts) ====================
  // Webhook endpoint is implemented in server/routes/webhook.ts
  // Uncomment when ready to handle subscription renewals, cancellations, and refunds
  // See README.md section "Stripe Webhooks Setup" for instructions

  // ==================== Settings API ====================

  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ settings: user });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const userId = getCurrentUserId(req)!;

      const user = await storage.updateUser(userId, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ settings: user });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ==================== REMOVED: Unprotected dashboard & notification routes ====================
  // All dashboard routes now require authentication - see routes/dashboard-routes.ts
  // Frontend must redirect unauthenticated users to login

  // Get user notifications
  app.get("/api/user/notifications", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const notifications = await storage.getNotifications(userId);
      res.json({ notifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/user/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const notificationId = req.params.id;
      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/user/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });
  
  // Update user profile (protected)
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;

      const { name, username, company, timezone } = req.body;

      const user = await storage.updateUser(userId, {
        name,
        username,
        company,
        timezone,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        company: user.company,
        timezone: user.timezone,
        plan: user.plan,
        role: user.role,
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Upload user avatar
  app.post("/api/user/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = getCurrentUserId(req)!;
      
      // Use initials-based avatar URL instead of base64 to prevent timeout
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate avatar from user initials
      const initials = (user.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase();
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
      const colorIndex = userId.charCodeAt(0) % colors.length;
      const avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=${colors[colorIndex].substring(1)}&color=fff`;

      // Update user avatar in database
      await storage.updateUser(userId, {
        avatar: avatarUrl,
      });

      res.json({
        success: true,
        avatar: avatarUrl,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: avatarUrl,
        },
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ error: error.message || "Failed to upload avatar" });
    }
  });

  // Get deals for the user with revenue calculation
  app.get("/api/deals", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;

      const { total, thisMonth, deals } = await storage.calculateRevenue(userId);

      res.json({
        deals,
        revenue: {
          total,
          thisMonth,
          currency: 'USD'
        }
      });
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // Get deals analytics with revenue trends and projections
  app.get("/api/deals/analytics", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get all deals for this user
      const { deals } = await storage.calculateRevenue(userId);
      const convertedDeals = deals.filter((d: any) => d.status === 'converted');

      // Calculate time-based metrics
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfMonth = new Date(now);
      startOfMonth.setDate(startOfMonth.getDate() - 30);

      // Previous periods for comparison
      const startOfPrevWeek = new Date(now);
      startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 14);
      const endOfPrevWeek = new Date(now);
      endOfPrevWeek.setDate(endOfPrevWeek.getDate() - 7);

      const startOfPrevMonth = new Date(now);
      startOfPrevMonth.setDate(startOfPrevMonth.getDate() - 60);
      const endOfPrevMonth = new Date(now);
      endOfPrevMonth.setDate(endOfPrevMonth.getDate() - 30);

      // Current period revenue
      const weekDeals = convertedDeals.filter((d: any) => new Date(d.convertedAt) >= startOfWeek);
      const monthDeals = convertedDeals.filter((d: any) => new Date(d.convertedAt) >= startOfMonth);

      const weekRevenue = weekDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const monthRevenue = monthDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      // Previous period revenue
      const prevWeekDeals = convertedDeals.filter((d: any) => {
        const date = new Date(d.convertedAt);
        return date >= startOfPrevWeek && date < endOfPrevWeek;
      });
      const prevMonthDeals = convertedDeals.filter((d: any) => {
        const date = new Date(d.convertedAt);
        return date >= startOfPrevMonth && date < endOfPrevMonth;
      });

      const previousWeekRevenue = prevWeekDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const previousMonthRevenue = prevMonthDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      // Timeline data for graphs (last 30 days)
      const timelineData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayDeals = convertedDeals.filter((d: any) => {
          const dealDate = new Date(d.convertedAt);
          return dealDate >= date && dealDate < nextDate;
        });

        const dayRevenue = dayDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

        timelineData.push({
          date: date.toISOString().split('T')[0],
          revenue: dayRevenue,
          deals: dayDeals.length
        });
      }

      res.json({
        previousWeekRevenue,
        previousMonthRevenue,
        timelineData,
        weekRevenue,
        monthRevenue,
        weekDeals: weekDeals.length,
        monthDeals: monthDeals.length
      });
    } catch (error) {
      console.error("Error fetching deals analytics:", error);
      res.status(500).json({ error: "Failed to fetch deals analytics" });
    }
  });

  // Create deal from converted lead
  app.post("/api/deals", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req)!;
      const { leadId, amount, name, source } = req.body;

      const deal = await storage.createDeal({
        userId,
        leadId,
        name,
        amount,
        source,
        status: 'closed_won',
        closedAt: new Date()
      });

      res.json({ deal });
    } catch (error: any) {
      console.error("Error creating deal:", error);
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  // Get calendar events
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || req.headers['x-user-id'];

      if (!userId) {
        return res.json({ events: [] });
      }

      // TODO: Integrate with calendar APIs
      res.json({ events: [] });
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // ==================== Admin API ====================

  app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
    try {

      const totalUsers = await storage.getUserCount();
      const totalLeads = await storage.getTotalLeadsCount();
      const allUsers = await storage.getAllUsers();

      const activeUsers = allUsers.filter(u => {
        const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
        const daysSinceLogin = lastLogin ? (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24) : 999;
        return daysSinceLogin < 30;
      }).length;

      const trialUsers = allUsers.filter(u => u.plan === 'trial').length;
      const paidUsers = allUsers.filter(u => u.plan !== 'trial').length;

      // Calculate MRR based on plans
      const mrr = allUsers.reduce((sum, u) => {
        if (u.plan === 'starter') return sum + 49;
        if (u.plan === 'pro') return sum + 149;
        if (u.plan === 'enterprise') return sum + 499;
        return sum;
      }, 0);

      // Calculate API costs from usage
      const allUsageHistory = await Promise.all(
        allUsers.map(u => storage.getUsageHistory(u.id, 'voice'))
      );
      const totalVoiceMinutes = allUsageHistory.flat()
        .filter(h => h.amount < 0) // Negative = usage
        .reduce((sum, h) => sum + Math.abs(h.amount), 0);
      const apiBurn = totalVoiceMinutes * 0.01; // $0.01 per minute ElevenLabs cost

      // Calculate storage used
      const allLeadsCount = await Promise.all(
        allUsers.map(u => storage.getLeads({ userId: u.id, limit: 10000 }))
      );
      const storageUsed = allLeadsCount.flat().length * 0.001; // Rough estimate in GB

      res.json({
        metrics: {
          totalUsers,
          activeUsers,
          trialUsers,
          paidUsers,
          totalLeads,
          mrr,
          apiBurn: parseFloat(apiBurn.toFixed(2)),
          failedJobs: 0, // Will track with worker health monitoring
          storageUsed: parseFloat(storageUsed.toFixed(2)),
        },
        recentUsers: allUsers.slice(-3).reverse().map(u => ({
          email: u.email,
          plan: u.plan,
          signedUp: u.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // ==================== File Upload API ====================

  // Upload voice sample for ElevenLabs voice cloning
  app.post("/api/uploads/voice", requireAuth, uploadVoice.single("voice"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = getCurrentUserId(req)!;

      // Upload to Supabase Storage
      const fileUrl = await uploadToSupabase(
        "voice-samples",
        `${userId}/${Date.now()}-${req.file.originalname}`,
        req.file.buffer
      );

      // Store voice sample record
      await storeVoiceSample(userId, fileUrl, req.file.originalname);

      res.json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
      });
    } catch (error: any) {
      console.error("Error uploading voice:", error);
      res.status(500).json({ error: error.message || "Failed to upload voice sample" });
    }
  });

  // Upload PDF for brand knowledge embeddings
  app.post("/api/uploads/pdf", requireAuth, uploadPDF.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = getCurrentUserId(req)!;

      // Upload to Supabase Storage
      const fileUrl = await uploadToSupabase(
        "documents",
        `${userId}/${Date.now()}-${req.file.originalname}`,
        req.file.buffer
      );

      // Queue PDF processing for embeddings with buffer for text extraction
      await processPDFEmbeddings(userId, fileUrl, req.file.originalname, undefined, req.file.buffer);

      res.json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
        status: "processing",
      });
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ error: error.message || "Failed to upload PDF" });
    }
  });

  // PDF upload and processing with auto-outreach
  app.post("/api/leads/upload-pdf", requireAuth, upload.single('pdf'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const autoReachOut = req.body.autoReachOut === 'true';
      const extractOffer = req.body.extractOffer === 'true';

      const { processPDF } = await import('./lib/pdf-processor.js');
      const result = await processPDF(req.file.buffer, req.user!.id, {
        autoReachOut,
        extractOffer
      });
      res.json(result);
    } catch (error: any) {
      console.error("PDF processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Export leads to CSV
  app.get("/api/leads/export-csv", requireAuth, async (req, res) => {
    try {
      const { exportLeadsToCSV } = await import("./lib/pdf-processor.js");
      const csv = await exportLeadsToCSV(req.user!.id);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
      res.send(csv);
    } catch (error: any) {
      console.error("CSV export error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Export leads to Excel/Spreadsheet
  app.get("/api/leads/export-excel", requireAuth, async (req, res) => {
    try {
      const leads = await storage.getLeads({ userId: req.user!.id, limit: 10000 });

      // Convert to spreadsheet-compatible JSON
      const spreadsheetData = leads.map(lead => ({
        Name: lead.name,
        Email: lead.email || '',
        Phone: lead.phone || '',
        Company: lead.metadata?.company || '',
        Channel: lead.channel,
        Status: lead.status,
        Score: lead.score || 0,
        'Created At': new Date(lead.createdAt).toLocaleDateString(),
        'Last Message': lead.lastMessageAt ? new Date(lead.lastMessageAt).toLocaleDateString() : 'Never'
      }));

      res.json({ leads: spreadsheetData });
    } catch (error: any) {
      console.error("Excel export error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // CSV export route
  app.get('/api/leads/export', requireAuth, async (req, res) => {
    try {
      const { exportLeadsToCSV } = await import('./lib/pdf-processor.js');
      const csv = await exportLeadsToCSV(req.session.userId!);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to export leads' });
    }
  });

  // PDF upload route
  app.post('/api/pdf/upload', requireAuth, async (req, res) => {
    try {
      const multer = require('multer');
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 } // 10MB
      });

      upload.single('pdf')(req, res, async (err: unknown) => {
        if (err) {
          return res.status(400).json({ error: 'File upload failed' });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { processPDF } = await import('./lib/pdf-processor.js');
        const result = await processPDF(
          req.file.buffer,
          req.session.userId!,
          { extractOffer: true }
        );

        res.json(result);
      });
    } catch (error) {
      console.error('PDF upload error:', error);
      res.status(500).json({ error: 'Failed to process PDF' });
    }
  });


  // ==================== Provider OAuth API ====================

  // Instagram OAuth initiation
  app.post("/api/integrations/instagram/connect", requireAuth, async (req, res) => {
    try {
      const { accessToken, pageId, pageName } = req.body;

      if (!accessToken || !pageId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const userId = getCurrentUserId(req)!;

      // Encrypt and store credentials
      const encryptedMeta = encrypt(JSON.stringify({
        accessToken,
        pageId,
        pageName,
      }));

      const integration = await storage.createIntegration({
        userId,
        provider: "instagram",
        encryptedMeta,
        connected: true,
        accountType: pageName || "Instagram Business",
      });

      res.json({
        success: true,
        integration: {
          id: integration.id,
          provider: integration.provider,
          connected: integration.connected,
          accountType: integration.accountType,
        },
      });
    } catch (error: any) {
      console.error("Error connecting Instagram:", error);
      res.status(500).json({ error: "Failed to connect Instagram" });
    }
  });

  // WhatsApp removed - not needed for MVP
  // app.post("/api/integrations/whatsapp/connect", requireAuth, async (req, res) => { ... });

  // Gmail OAuth initiation
  app.post("/api/integrations/gmail/connect", requireAuth, async (req, res) => {
    try {
      const { accessToken, refreshToken, email } = req.body;

      if (!accessToken || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const userId = getCurrentUserId(req)!;

      // Encrypt and store credentials
      const encryptedMeta = encrypt(JSON.stringify({
        accessToken,
        refreshToken,
        email,
      }));

      const integration = await storage.createIntegration({
        userId,
        provider: "gmail",
        encryptedMeta,
        connected: true,
        accountType: email,
      });

      res.json({
        success: true,
        integration: {
          id: integration.id,
          provider: integration.provider,
          connected: integration.connected,
          accountType: integration.accountType,
        },
      });
    } catch (error: any) {
      console.error("Error connecting Gmail:", error);
      res.status(500).json({ error: "Failed to connect Gmail" });
    }
  });

  // Register OAuth routes
  app.use("/api", oauthRoutes);
  app.use("/api/payment-approval", paymentApprovalRouter);
  app.use("/api/payment", paymentCheckoutRouter);

  // Register webhook routes
  app.use("/api", workerRouter);
  app.use("/api/automation", commentAutomationRouter);
  app.use("/api/video-automation", videoAutomationRoutes);

  // WhatsApp removed - not needed for MVP
  // app.use('/api/whatsapp', whatsappRoutes);
  // app.use('/api/whatsapp-otp', whatsappOTPRoutes);
  app.use('/api/auth', emailOTPRoutes);
  app.use('/api/custom-email', customEmailRoutes);
  app.use('/api/email', emailStatsRoutes);
  app.use('/api/otp', otpRoutes);
  app.use('/api/calendar', calendarRoutes);

  // Webhook routes
  app.use("/api/webhook", webhookRouter);
  // Also mount webhooks at /api/webhooks for compatibility with documented URLs
  app.use("/api/webhooks", webhookRouter);
  // Mount Instagram callback at /api/instagram for Meta webhook compatibility
  app.use("/api/instagram", webhookRouter);

  // Register bulk actions routes
  app.use("/api/bulk", bulkActionsRoutes);

  // Register lead intelligence routes (TIER 1 + TIER 4)
  app.use("/api/lead-intelligence", leadIntelligenceRouter);

  // Register AI sales suggestion routes
  app.use("/api/ai", aiSalesSuggestionRouter);

  // Register sales objections engine (autonomous handler)
  app.use("/api/sales-engine", salesEngineRouter);

  // Register Stripe payment confirmation routes (works anywhere: Vercel, local, etc)
  app.use("/api/stripe", stripePaymentConfirmation);
  // Note: Using new payment-approval system (database-driven, no API keys needed)

  // Register auth username + onboarding routes
  app.use("/api/auth", authUsernameOnboarding);

  // Register auth routes
  app.use("/api/auth", authClean); // Legacy routes
  app.use("/api/user/auth", userAuth); // User signup/login (anyone)
  app.use("/api/admin", adminAuth); // Admin login (whitelisted only)

  // WhatsApp removed - not needed for MVP
  // app.use("/api/whatsapp-connect", whatsappConnect);

  // Register dashboard routes
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api", dashboardRoutes); // Also available at /api/user/profile

  // Register admin routes
  const adminRoutes = await import("./routes/admin-routes.js");
  app.use("/api/admin", adminRoutes.default);
  app.use("/api/admin", adminPdfRoutesV2);
  app.use("/api/brand-pdf", adminPdfRoutes);

  // Register email tracking routes (open/click tracking pixels)
  // Note: Using /api/email-tracking to avoid conflict with /api/email (email stats)
  app.use("/api/email-tracking", emailTrackingRoutes);
  
  // Register DNS verification routes (SPF/DKIM/DMARC)
  app.use("/api/dns", dnsVerificationRoutes);
  
  // Register Instagram status routes (webhook status, logs)
  app.use("/api/instagram", instagramStatusRoutes);

  const httpServer = createServer(app);

  // Initialize follow-up worker on server start
  console.log("Initializing follow-up worker...");
  followUpWorker.start();

  // Initialize weekly insights worker
  console.log("Initializing weekly insights worker...");
  weeklyInsightsWorker.start();

  // Initialize video comment monitoring
  const { startVideoCommentMonitoring } = await import("./lib/ai/video-comment-monitor.js");
  console.log("Initializing video comment monitoring...");
  startVideoCommentMonitoring();

  return httpServer;
}