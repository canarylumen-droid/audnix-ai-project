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

  // Supabase OAuth callback handler
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

      // Sync user to our database
      const userData = await syncUserFromSupabase(user.id);
      
      // Check if user exists
      let dbUser = await storage.getUserBySupabaseId(user.id);
      
      if (!dbUser) {
        // Create new user
        dbUser = await storage.createUser({
          ...userData,
          plan: "trial",
        });
      } else {
        // Update last login
        dbUser = await storage.updateUser(dbUser.id, {
          lastLogin: new Date(),
        });
      }

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

  app.get("/api/leads", async (req, res) => {
    try {
      const { status, channel, search, limit = 50 } = req.query;
      
      // TODO: Get userId from session/auth
      const mockUserId = "mock_user_1";
      
      const leads = await storage.getLeads({
        userId: mockUserId,
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

  app.post("/api/leads/:leadId/messages", async (req, res) => {
    try {
      const { leadId } = req.params;
      const { body, useVoice } = req.body;
      
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Create message
      const message = await storage.createMessage({
        leadId,
        userId: mockUserId,
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

  app.get("/api/integrations", async (req, res) => {
    try {
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";
      
      const integrations = await storage.getIntegrations(mockUserId);

      res.json({ integrations });
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations/:provider/connect", async (req, res) => {
    try {
      const { provider } = req.params;
      const { tokens, metadata } = req.body;
      
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Encrypt and store integration
      const integration = await storage.createIntegration({
        userId: mockUserId,
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

  app.post("/api/integrations/:provider/disconnect", async (req, res) => {
    try {
      const { provider } = req.params;
      
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      await storage.disconnectIntegration(mockUserId, provider);

      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  });

  // ==================== Insights API ====================

  app.get("/api/insights/summary", async (req, res) => {
    try {
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      // Get data for insights
      const leads = await storage.getLeads({ userId: mockUserId, limit: 1000 });
      
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

  app.post("/api/billing/subscribe", async (req, res) => {
    try {
      const { planKey } = req.body;
      
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";
      const user = await storage.getUserById(mockUserId);

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

  app.post("/api/billing/topup", async (req, res) => {
    try {
      const { topupKey } = req.body;
      
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";
      const user = await storage.getUserById(mockUserId);

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

  app.get("/api/settings", async (req, res) => {
    try {
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";
      const user = await storage.getUserById(mockUserId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ settings: user });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const updates = req.body;
      
      // TODO: Get userId from session
      const mockUserId = "mock_user_1";

      const user = await storage.updateUser(mockUserId, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ settings: user });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ==================== Admin API ====================

  app.get("/api/admin/metrics", async (req, res) => {
    try {
      // TODO: Check if user is admin
      
      const totalUsers = await storage.getUserCount();
      const totalLeads = await storage.getTotalLeadsCount();

      res.json({
        metrics: {
          totalUsers,
          totalLeads,
          activeSubscriptions: 0,
          mrr: 0,
        }
      });
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
