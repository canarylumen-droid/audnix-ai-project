import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAdmin, isSupabaseAdminConfigured, syncUserFromSupabase } from "./lib/supabase-admin";

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

  const httpServer = createServer(app);

  return httpServer;
}
