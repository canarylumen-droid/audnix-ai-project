import { Express } from "express";
import http from "http";
import { wsSync } from "../lib/websocket-sync.js";
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
import authInstagramRoutes from "./auth-instagram.js";
import webhookMetaRoutes from "./webhook-meta.js";
import automationRulesRoutes from "./automation-rules-routes.js";
import channelStatusRoutes from "./channel-status-routes.js";
import dealsRoutes from "./deals-routes.js";
import integrationsRoutes from "./integrations-routes.js";
import objectionsRoutes from "./objections-routes.js";
import expertChatRoutes from "./expert-chat.js";
import userSettingsRoutes from "./user-settings-routes.js";
import prospectingRoutes from "./prospecting.js";

export async function registerRoutes(app: Express): Promise<http.Server> {
  // Mount all routes
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
  app.use("/api/billing", billingRoutes);
  app.use("/api/bulk", bulkActionsRoutes);
  app.use("/api/calendar", calendarRoutes);
  app.use("/api/comments", commentAutomationRoutes);
  app.use("/api/email/custom", customEmailRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api/email/otp", emailOtpRoutes);
  app.use("/api/email/stats", emailStatsRoutes);
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
  app.use("/api/voice", voiceRoutes);
  app.use("/api/webhook", webhookRouter);
  app.use("/webhook", webhookMetaRoutes); // Root-level Meta webhook
  app.use("/auth/instagram", authInstagramRoutes); // Root-level Instagram OAuth
  app.use("/api/worker", workerRoutes);
  app.use("/api/automation", automationRulesRoutes);
  app.use("/api/channels", channelStatusRoutes);
  app.use("/api/deals", dealsRoutes);
  app.use("/api/integrations", integrationsRoutes);
  app.use("/api/objections", objectionsRoutes);
  app.use("/api/settings", userSettingsRoutes);
  app.use("/api/sales-engine", salesEngine);
  app.use("/api/expert-chat", expertChatRoutes);
  app.use("/api/prospecting", prospectingRoutes);

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize WebSocket server for real-time sync
  wsSync.initialize(server);

  return server;
}
