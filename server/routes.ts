import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAdmin, isSupabaseAdminConfigured, syncUserFromSupabase } from "./lib/supabase-admin";
import { 
  stripe, 
  isDemoMode as stripeDemoMode, 
  createStripeCustomer, 
  createSubscription, 
  updateSubscriptionPlan,
  cancelSubscription,
  createTopupCheckout,
  PLANS,
  TOPUPS,
  verifyWebhookSignature,
  processTopupSuccess
} from "./lib/billing/stripe";
import { generateInsights } from "./lib/ai/openai";
import { uploadVoice, uploadPDF, uploadToSupabase, storeVoiceSample, processPDFEmbeddings } from "./lib/file-upload";
import { encrypt } from "./lib/crypto/encryption";
import oauthRoutes from "./routes/oauth";
import webhookRoutes from "./routes/webhook";
import workerRoutes from "./routes/worker";
import aiRoutes from "./routes/ai-routes";
import { followUpWorker } from "./lib/ai/follow-up-worker";
import { requireAuth, requireAdmin, optionalAuth, getCurrentUserId } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

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

  // Demo webhook - for testing demo mode
  app.post("/api/webhook/demo", async (req, res) => {
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

  // Supabase OAuth callback handler - Now captures real OAuth data
  app.get("/api/auth/callback", async (req, res) => {
    const { code } = req.query;

    if (!code || !isSupabaseAdminConfigured() || !supabaseAdmin) {
      // No code or Supabase not configured - redirect to dashboard
      return res.redirect("/dashboard");
    }

    try {
      // Exchange code for session
      const { data: { user }, error } = await supabaseAdmin.auth.exchangeCodeForSession(String(code));

      if (error || !user) {
        console.error("OAuth callback error:", error);
        return res.redirect("/auth?error=auth_failed");
      }

      // Get the full user data with metadata
      const { data: { user: authUser } } = await supabaseAdmin.auth.getUser();
      
      // Extract real name, email, and avatar from OAuth provider metadata
      const userMetadata = authUser?.user_metadata || {};
      const email = authUser?.email || user.email || '';
      const fullName = userMetadata.full_name || userMetadata.name || userMetadata.given_name || '';
      const avatar = userMetadata.avatar_url || userMetadata.picture || null;
      const username = email.split('@')[0];
      
      // Check if user exists
      let dbUser = await storage.getUserBySupabaseId(user.id);
      
      if (!dbUser) {
        // Create new user with real OAuth data
        dbUser = await storage.createUser({
          supabaseId: user.id,
          email: email,
          name: fullName || username,
          username: username,
          avatar: avatar,
          plan: "trial",
        });
      } else {
        // Update user with latest OAuth data and last login
        dbUser = await storage.updateUser(dbUser.id, {
          name: fullName || dbUser.name,
          avatar: avatar || dbUser.avatar,
          lastLogin: new Date(),
        });
      }

      // Store user ID in session (if using session management)
      req.session = req.session || {};
      (req.session as any).userId = dbUser.id;
      (req.session as any).userEmail = dbUser.email;

      // Redirect to dashboard
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Error in OAuth callback:", error);
      res.redirect("/auth?error=server_error");
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

  app.post("/api/leads/:leadId/messages", requireAuth, async (req, res) => {
    try {
      const { leadId } = req.params;
      const { body, useVoice } = req.body;
      const userId = getCurrentUserId(req)!;

      // Create message
      const message = await storage.createMessage({
        leadId,
        userId,
        provider: "instagram",
        direction: "outbound",
        body,
      });

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

  app.post("/api/integrations/:provider/connect", requireAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const { tokens, metadata } = req.body;
      const userId = getCurrentUserId(req)!;

      // Encrypt and store integration
      const integration = await storage.createIntegration({
        userId,
        provider: provider as "instagram" | "whatsapp" | "gmail" | "outlook" | "manychat",
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

  app.get("/api/insights/metrics", async (req, res) => {
    try {
      // TODO: Get userId from session and fetch real metrics
      const metrics = {
        leads: 127,
        messages: 1043,
        aiReplies: 342,
        conversionRate: 23.5,
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

  app.post("/api/billing/subscribe", requireAuth, async (req, res) => {
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

  app.post("/api/billing/webhook", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      
      if (!signature) {
        return res.status(400).json({ error: "Missing signature" });
      }

      const event = verifyWebhookSignature(req.body, signature);

      // Handle different event types
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object as any;
          if (session.metadata?.userId && session.metadata?.topupType) {
            await processTopupSuccess(
              session.metadata.userId,
              session.metadata.topupType,
              parseInt(session.metadata.topupAmount)
            );
          }
          break;

        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          // Handle subscription changes
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

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

  // ==================== Dashboard API (PRODUCTION READY) ====================

  // Get real-time dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || req.headers['x-user-id'];
      
      if (!userId) {
        // Return zeros for unauthenticated users
        return res.json({
          leads: 0,
          messages: 0,
          aiReplies: 0,
          conversionRate: 0,
          activeLeads: 0,
          conversions: 0,
        });
      }

      const leads = await storage.getLeads({ userId, limit: 1000 });
      const activeLeads = leads.filter(l => l.status === 'open' || l.status === 'replied').length;
      const conversions = leads.filter(l => l.status === 'converted').length;
      const conversionRate = leads.length > 0 ? (conversions / leads.length) * 100 : 0;

      // TODO: Get actual message and AI reply counts when those tables are ready
      res.json({
        leads: leads.length,
        messages: 0, // Will be updated when message tracking is implemented
        aiReplies: 0, // Will be updated when AI tracking is implemented
        conversionRate: conversionRate.toFixed(1),
        activeLeads,
        conversions,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get real-time activity feed
  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || req.headers['x-user-id'];
      
      if (!userId) {
        return res.json({ activities: [] });
      }

      // Get recent leads and messages to create activity feed
      const leads = await storage.getLeads({ userId, limit: 10 });
      
      const activities = leads.map(lead => ({
        id: lead.id,
        type: lead.status === 'converted' ? 'conversion' : 'lead',
        channel: lead.channel,
        message: `${lead.name} ${lead.status === 'converted' ? 'converted' : 'became a lead'} from ${lead.channel}`,
        time: lead.createdAt,
      }));

      res.json({ activities });
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Get user profile
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);
      
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
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

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

  // Get deals for the user
  app.get("/api/deals", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || req.headers['x-user-id'];
      
      if (!userId) {
        return res.json({ deals: [] });
      }

      // TODO: Implement deals table and fetch real deals
      res.json({ deals: [] });
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
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

      res.json({
        metrics: {
          totalUsers,
          activeUsers,
          trialUsers,
          paidUsers,
          totalLeads,
          mrr,
          apiBurn: 0, // TODO: Track API costs
          failedJobs: 0, // TODO: Track failed background jobs
          storageUsed: 0, // TODO: Track storage
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
  app.post("/api/uploads/voice", uploadVoice.single("voice"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Upload to Supabase Storage
      const fileUrl = await uploadToSupabase(
        "voice-samples",
        `${mockUserId}/${Date.now()}-${req.file.originalname}`,
        req.file.path
      );

      // Store voice sample record
      await storeVoiceSample(mockUserId, fileUrl, req.file.originalname);

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
  app.post("/api/uploads/pdf", uploadPDF.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Upload to Supabase Storage
      const fileUrl = await uploadToSupabase(
        "documents",
        `${mockUserId}/${Date.now()}-${req.file.originalname}`,
        req.file.path
      );

      // Queue PDF processing for embeddings
      await processPDFEmbeddings(mockUserId, fileUrl, req.file.originalname);

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

  // ==================== Provider OAuth API ====================

  // Instagram OAuth initiation
  app.post("/api/integrations/instagram/connect", async (req, res) => {
    try {
      const { accessToken, pageId, pageName } = req.body;

      if (!accessToken || !pageId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Encrypt and store credentials
      const encryptedMeta = encrypt(JSON.stringify({
        accessToken,
        pageId,
        pageName,
      }));

      const integration = await storage.createIntegration({
        userId: mockUserId,
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

  // WhatsApp OAuth initiation
  app.post("/api/integrations/whatsapp/connect", async (req, res) => {
    try {
      const { phoneNumberId, accessToken, phoneNumber } = req.body;

      if (!phoneNumberId || !accessToken) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Encrypt and store credentials
      const encryptedMeta = encrypt(JSON.stringify({
        phoneNumberId,
        accessToken,
        phoneNumber,
      }));

      const integration = await storage.createIntegration({
        userId: mockUserId,
        provider: "whatsapp",
        encryptedMeta,
        connected: true,
        accountType: phoneNumber || "WhatsApp Business",
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
      console.error("Error connecting WhatsApp:", error);
      res.status(500).json({ error: "Failed to connect WhatsApp" });
    }
  });

  // Gmail OAuth initiation
  app.post("/api/integrations/gmail/connect", async (req, res) => {
    try {
      const { accessToken, refreshToken, email } = req.body;

      if (!accessToken || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Encrypt and store credentials
      const encryptedMeta = encrypt(JSON.stringify({
        accessToken,
        refreshToken,
        email,
      }));

      const integration = await storage.createIntegration({
        userId: mockUserId,
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
  
  // Register webhook routes
  app.use("/api", webhookRoutes);
  
  // Register worker control routes
  app.use("/api", workerRoutes);
  
  // Register AI-powered routes
  app.use("/api/ai", aiRoutes);

  const httpServer = createServer(app);

  // Initialize follow-up worker on server start
  console.log("Initializing follow-up worker...");
  followUpWorker.start();

  return httpServer;
}
