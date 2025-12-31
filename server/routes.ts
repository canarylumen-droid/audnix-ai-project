/**
 * PHASE 3: INSTAGRAM OAUTH VERIFICATION ROUTES
 * 
 * Handles:
 * 1. GET /auth/instagram - Generates OAuth redirect URL
 * 2. GET /auth/instagram/callback - Receives callback with auth code
 * 3. Logs all OAuth parameters for debugging
 * 4. No token exchange (read-only verification)
 */

import type { Express, Request, Response } from "express";

const OAUTH_LOG_PREFIX = "🔐 [OAUTH]";

function sanitizeForLog(value: unknown): string {
  if (typeof value !== 'string') return '[invalid-type]';
  return value.replace(/%/g, '%%').substring(0, 100);
}

function oauthLog(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const safeMessage = typeof message === 'string' ? message.replace(/%/g, '%%') : '[invalid]';
  console.log(`${timestamp} ${OAUTH_LOG_PREFIX} ${safeMessage}`, data ? JSON.stringify(data, null, 2) : "");
}

function getStringParam(query: any, key: string): string | undefined {
  const value = query[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/**
 * Generate Instagram OAuth URL
 * Uses Meta's OAuth dialog with:
 * - client_id: META_APP_ID
 * - redirect_uri: META_CALLBACK_URL
 * - scope: instagram_basic,instagram_manage_messages
 * - state: Random value for CSRF protection
 */
function generateOAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "instagram_basic,instagram_manage_messages",
    state: state,
    response_type: "code",
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

export function registerInstagramOAuthRoutes(app: Express) {
  oauthLog("🔑 Registering Instagram OAuth routes...");

  const META_APP_ID = process.env.META_APP_ID;
  const META_CALLBACK_URL = process.env.META_CALLBACK_URL;
  const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "audnix-verify-token";

  if (!META_APP_ID) {
    oauthLog("⚠️  META_APP_ID not set - OAuth redirect will fail");
  }
  if (!META_CALLBACK_URL) {
    oauthLog("⚠️  META_CALLBACK_URL not set - OAuth redirect will fail");
  }

  /**
   * GET /auth/instagram
   * Generates and redirects to Instagram OAuth URL
   */
  app.get("/auth/instagram", (req: Request, res: Response) => {
    oauthLog("=== INSTAGRAM OAUTH INITIATION ===");

    if (!META_APP_ID || !META_CALLBACK_URL) {
      oauthLog("❌ Missing META_APP_ID or META_CALLBACK_URL");
      return res.status(500).json({
        error: "OAuth not configured",
        message: "META_APP_ID and META_CALLBACK_URL must be set",
      });
    }

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7);

    oauthLog("OAuth parameters configured");
    oauthLog("Scope: instagram_basic,instagram_manage_messages");

    // Generate OAuth URL
    const oauthUrl = generateOAuthUrl(META_APP_ID, META_CALLBACK_URL, state);
    oauthLog("Generated OAuth URL successfully");

    // Store state in session for verification (optional)
    if ((req as any).session) {
      (req as any).session.oauthState = state;
      oauthLog("✅ State saved to session");
    }

    oauthLog("✅ Redirecting user to Instagram OAuth");
    res.redirect(oauthUrl);
  });

  /**
   * GET /auth/instagram/callback
   * Receives callback from Instagram after user authorizes
   * Logs code, state, and any errors
   */
  app.get("/auth/instagram/callback", (req: Request, res: Response) => {
    oauthLog("=== INSTAGRAM OAUTH CALLBACK ===");

    const code = getStringParam(req.query, 'code');
    const state = getStringParam(req.query, 'state');
    const error = getStringParam(req.query, 'error');
    const errorReason = getStringParam(req.query, 'error_reason');

    oauthLog("Received callback parameters:");
    oauthLog(`  Code: ${code ? "received" : "not received"}`);
    oauthLog(`  State: ${state ? "received" : "not received"}`);
    oauthLog(`  Error: ${error ? sanitizeForLog(error) : "none"}`);

    // Check for errors
    if (error) {
      oauthLog("Instagram returned an error");
      if (errorReason === "user_cancelled_login") {
        oauthLog("User cancelled the login dialog");
      }
      return res.status(400).json({
        error: "oauth_error",
        reason: errorReason === "user_cancelled_login" ? "user_cancelled" : "unknown",
        message: "Instagram OAuth failed",
      });
    }

    // Verify state matches what we sent (CSRF protection)
    const sessionState = (req as any).session?.oauthState;
    if (sessionState && typeof state === 'string' && state !== sessionState) {
      oauthLog("State mismatch - possible CSRF attack");
      return res.status(403).json({ error: "Invalid state parameter" });
    }

    if (!code || typeof code !== 'string') {
      oauthLog("No authorization code received");
      return res.status(400).json({ error: "No authorization code received" });
    }

    oauthLog("Authorization code received successfully");

    // For verification-only, just acknowledge receipt
    res.json({
      success: true,
      message: "Authorization code received",
      codeReceived: true,
      nextSteps: "Exchange code for access token via backend API",
    });
  });

  /**
   * GET /auth/instagram/status
   * Shows current OAuth configuration status
   */
  app.get("/auth/instagram/status", (req: Request, res: Response) => {
    oauthLog("=== OAUTH STATUS CHECK ===");

    const status = {
      configured: Boolean(META_APP_ID && META_CALLBACK_URL),
      meta_app_id: META_APP_ID ? "✅ SET" : "❌ MISSING",
      meta_callback_url: META_CALLBACK_URL ? "✅ SET" : "❌ MISSING",
      meta_verify_token: META_VERIFY_TOKEN ? "✅ SET" : "❌ MISSING",
      oauth_url: META_APP_ID && META_CALLBACK_URL ? generateOAuthUrl(META_APP_ID, META_CALLBACK_URL, "test-state") : "CANNOT_GENERATE",
    };

    oauthLog(`Configuration: ${status.configured ? "READY" : "INCOMPLETE"}`);
    oauthLog(`App ID: ${status.meta_app_id}`);
    oauthLog(`Callback URL: ${status.meta_callback_url}`);
    oauthLog(`Verify Token: ${status.meta_verify_token}`);

    res.json(status);
  });

  oauthLog("✅ Instagram OAuth routes registered:");
  oauthLog("   - GET /auth/instagram - Generate OAuth redirect");
  oauthLog("   - GET /auth/instagram/callback - Receive auth code");
  oauthLog("   - GET /auth/instagram/status - Check OAuth config");
  oauthLog(`   - Client ID configured: ${META_APP_ID ? "YES" : "NO"}`);
  oauthLog(`   - Callback URL: ${META_CALLBACK_URL || "NOT SET"}`);
}
