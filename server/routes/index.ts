import { Express, Response } from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { wsSync } from "../lib/websocket-sync.js";
import { apiLimiter } from "../middleware/rate-limit.js";
import userAuthRouter from "./user-auth.js";
import adminAuthRouter from "./admin-auth.js";
import adminPdfRoutes from "./admin-pdf-routes.js";
import adminPdfRoutesV2 from "./admin-pdf-routes-v2.js";
import adminRoutes from "./admin-routes.js";
import aiRoutes from "./ai-routes.js";
import aiSalesSuggestion from "./ai-sales-suggestion.js";
import authClean from "./auth-clean.js";
import authUsernameOnboarding from "./auth-username-onboarding.js";
import billingRoutes from "./billing-routes.js";
import bulkActionsRoutes from "./bulk-actions-routes.js";
import calendarRoutes from "./calendar-routes.js";
import commentAutomationRoutes from "./comment-automation-routes.js";
import customEmailRoutes from "./custom-email-routes.js";
import dashboardRoutes from "./dashboard-routes.js";
import emailOtpRoutes from "./email-otp-routes.js";
import emailStatsRoutes from "./email-stats-routes.js";
import leadIntelligence from "./lead-intelligence.js";
import oauthRoutes from "./oauth.js";
import otpRoutes from "./otp-routes.js";
import outreach from "./outreach.js";
import { paymentApprovalRouter as paymentApproval } from "./payment-approval.js";
import { paymentCheckoutRouter as paymentCheckout } from "./payment-checkout.js";
import salesEngine from "./sales-engine.js";
import stripePaymentConfirmation from "./stripe-payment-confirmation.js";
import videoAutomationRoutes from "./video-automation-routes.js";
import voiceRoutes from "./voice-routes.js";
import webhookRouter from "./webhook.js";
import workerRoutes from "./worker.js";
import messagesRoutes from "./messages-routes.js";

import webhookMetaRoutes from "./webhook-meta.js";
import automationRulesRoutes from "./automation-rules-routes.js";
import channelStatusRoutes from "./channel-status-routes.js";
import dealsRoutes from "./deals-routes.js";
import integrationsRoutes from "./integrations-routes.js";
import objectionsRoutes from "./objections-routes.js";
import expertChatRoutes from "./expert-chat.js";
import userSettingsRoutes from "./user-settings-routes.js";
import prospectingRoutes from "./prospecting.js";
import { organizationRouter } from "./organization-routes.js";
import adminMigrationsRouter from "./admin-migrations.js";
import notificationRoutes from "./notification-routes.js";

export async function registerRoutes(app: Express): Promise<http.Server> {
  // 1. Static Assets & Public Manifests (Served before auth/rate limiting for common assets)
  const sendPublicFile = (fileName: string, res: Response) => {
    const filePath = path.join(process.cwd(), "client/public", fileName);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      // Fallback for development/standalone mode
      const buildPath = path.join(process.cwd(), "client/dist", fileName);
      if (fs.existsSync(buildPath)) {
        res.sendFile(buildPath);
      } else {
        res.status(404).end();
      }
    }
  };

  app.get("/favicon.ico", (req, res) => sendPublicFile("favicon.ico", res));
  app.get("/favicon.svg", (req, res) => sendPublicFile("favicon.svg", res));
  app.get("/manifest.json", (req, res) => sendPublicFile("manifest.json", res));
  app.get("/logo.svg", (req, res) => sendPublicFile("logo.svg", res));

  app.all("/api/instagram/callback", apiLimiter, (req, res) => {
    console.log(`[Root Callback] ${req.method} /api/instagram/callback`);
    // Handle both POST (from Meta) and GET (OAuth redirect)
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    res.redirect(307, `/api/oauth/instagram/callback${query}`);
  });

  app.get("/", apiLimiter, (_req, res) => {
    // Serve index.html for all non-api routes to support SPA
    res.sendFile(path.join(process.cwd(), "client/dist/index.html"), (err) => {
      if (err) {
        // Fallback for development
        res.status(200).send("Landing Page (AudnixAI)");
      }
    });
  });

  // Mount all other routes
  app.use("/api/organizations", organizationRouter);
  app.use("/api/user/auth", userAuthRouter);
  app.use("/api/user", userAuthRouter); // Alias for /api/user/avatar calls
  app.use("/api/admin/auth", adminAuthRouter);

  app.use("/api/admin/pdf", adminPdfRoutes);
  app.use("/api/admin/pdf-v2", adminPdfRoutesV2);
  app.use("/api/admin", adminRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/ai/sales-suggestion", aiSalesSuggestion);
  app.use("/api/auth", authClean);
  app.use("/api/auth/clean", authClean);
  app.use("/api/auth/username", authUsernameOnboarding);
  app.use("/api/auth", authUsernameOnboarding); // Also mount at /api/auth for /set-username endpoint
  app.use("/api/billing", billingRoutes);
  app.use("/api/bulk", bulkActionsRoutes);
  app.use("/api/calendar", calendarRoutes);
  app.use("/api/comments", commentAutomationRoutes);
  app.use("/api/custom-email", customEmailRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api/email/otp", emailOtpRoutes);
  app.use("/api/email/stats", emailStatsRoutes);
  app.use("/api/smtp", customEmailRoutes); // Mount at /api/smtp to handle /api/smtp/settings
  app.use("/api/leads/intelligence", leadIntelligence);
  app.use("/api/leads", aiRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/brand-pdf", adminPdfRoutes);
  app.use("/api/admin", adminPdfRoutes);
  app.use("/api/admin", adminPdfRoutesV2); // Added to support /api/admin/analyze-pdf-v2
  app.use("/api/pdf", adminPdfRoutes); // Alias for /api/pdf/upload calls
  app.use("/api/oauth", oauthRoutes);
  app.use("/api/otp", otpRoutes);
  app.use("/api/outreach", outreach);
  app.use("/api/payment/approval", paymentApproval);
  app.use("/api/payment/checkout", paymentCheckout);
  app.use("/api/sales", salesEngine);
  app.use("/api/stripe/confirmation", stripePaymentConfirmation);
  app.use("/api/video", videoAutomationRoutes);
  app.use("/api/video-automation", videoAutomationRoutes);
  app.use("/api/voice", voiceRoutes);
  app.use("/api/webhook", webhookRouter);
  app.use("/webhook", webhookMetaRoutes); // Root-level Meta webhook

  app.use("/api/worker", workerRoutes);
  app.use("/api/automation", automationRulesRoutes);
  app.use("/api/channels", channelStatusRoutes);
  app.use("/api/deals", dealsRoutes);
  app.use("/api/integrations", integrationsRoutes);
  app.use("/api/objections", objectionsRoutes);
  app.use("/api/settings", userSettingsRoutes);
  app.use("/api/sales-engine", salesEngine);
  app.use("/api/expert-chat", expertChatRoutes);
  app.use("/api/expert-chat-v2", expertChatRoutes);
  app.use("/api/prospecting", prospectingRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminMigrationsRouter); // Admin-only migration controls

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize WebSocket server for real-time sync
  wsSync.initialize(server);

  // Initialize Campaign Worker
  import('../lib/outreach/campaign-worker.js').then(({ campaignWorker }) => {
    campaignWorker.start();
  });

  return server;
}
