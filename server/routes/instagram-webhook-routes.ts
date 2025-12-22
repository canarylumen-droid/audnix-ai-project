/**
 * PHASE 2: INSTAGRAM WEBHOOK VERIFICATION ROUTES
 * 
 * Handles:
 * 1. GET /webhook - Meta webhook verification (hub.challenge)
 * 2. POST /webhook - Incoming Instagram events with HMAC-SHA256 signature verification
 * 3. Validates signature using raw request body + META_APP_SECRET
 * 4. Logs all events for debugging
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";

const WEBHOOK_LOG_PREFIX = "🪝 [WEBHOOK]";

interface RawRequest extends Request {
  rawBody?: Buffer;
}

function webhookLog(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${timestamp} ${WEBHOOK_LOG_PREFIX} ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

/**
 * Verify Instagram webhook signature
 * Uses HMAC-SHA256 with META_APP_SECRET
 * Signature format: sha256=hex
 */
function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  appSecret: string
): { valid: boolean; computed: string } {
  const computed = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const expected = `sha256=${computed}`;
  const valid = signature === expected;

  return { valid, computed };
}

export default function registerInstagramWebhookRoutes(app: Express) {
  webhookLog("🔗 Registering Instagram webhook routes...");

  const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "audnix-verify-token";
  const META_APP_SECRET = process.env.META_APP_SECRET;

  if (!META_APP_SECRET) {
    webhookLog("⚠️  META_APP_SECRET not set - signature verification will fail");
  }

  /**
   * GET /api/webhook/instagram
   * Meta sends this during webhook setup to verify URL ownership
   * Parameters: hub.mode, hub.challenge, hub.verify_token
   */
  app.get("/api/webhook/instagram", (req: Request, res: Response) => {
    webhookLog("=== INSTAGRAM WEBHOOK VERIFICATION ===");

    const hubMode = req.query["hub.mode"] as string;
    const hubChallenge = req.query["hub.challenge"] as string;
    const hubVerifyToken = req.query["hub.verify_token"] as string;

    webhookLog(`Mode: ${hubMode || "NOT RECEIVED"}`);
    webhookLog(`Challenge: ${hubChallenge ? "✅ RECEIVED" : "❌ NOT RECEIVED"}`);
    webhookLog(`Verify Token: ${hubVerifyToken || "❌ NOT RECEIVED"}`);
    webhookLog(`Expected Token: ${META_VERIFY_TOKEN}`);

    // Verify the token
    if (hubVerifyToken !== META_VERIFY_TOKEN) {
      webhookLog("❌ Verify token mismatch!");
      webhookLog(`Expected: ${META_VERIFY_TOKEN}`);
      webhookLog(`Received: ${hubVerifyToken}`);
      return res.status(403).json({ error: "Invalid verify token" });
    }

    webhookLog("✅ Verify token matches");

    // Verify mode
    if (hubMode !== "subscribe") {
      webhookLog(`❌ Invalid hub.mode: ${hubMode} (expected 'subscribe')`);
      return res.status(400).json({ error: "Invalid hub.mode" });
    }

    webhookLog("✅ Mode verified");

    // Return the challenge
    if (!hubChallenge) {
      webhookLog("❌ No hub.challenge parameter");
      return res.status(400).json({ error: "Missing hub.challenge" });
    }

    webhookLog(`✅ Returning challenge: ${hubChallenge}`);
    webhookLog("✅ Webhook verification successful!");

    // Return the challenge as plain text
    res.status(200).send(hubChallenge);
  });

  /**
   * POST /api/webhook/instagram
   * Receives Instagram events (DMs, comments, etc.)
   * CRITICAL: Uses raw request body for signature verification
   * Must check BEFORE body parsing modifies the request
   */
  app.post("/api/webhook/instagram", (req: RawRequest, res: Response) => {
    webhookLog("=== INSTAGRAM WEBHOOK EVENT ===");

    const signature = req.get("x-hub-signature-256") || "";
    const rawBody = req.rawBody;
    const body = req.body;

    webhookLog(`Signature header received: ${signature ? "✅ YES" : "❌ NO"}`);
    webhookLog(`Raw body size: ${rawBody?.length || 0} bytes`);
    webhookLog(`Body type: ${typeof body}`);

    // Verify signature if app secret is configured
    if (META_APP_SECRET && rawBody) {
      webhookLog("Verifying HMAC-SHA256 signature...");

      const verification = verifyWebhookSignature(rawBody, signature, META_APP_SECRET);

      webhookLog(`Received signature: ${signature.substring(0, 20)}...`);
      webhookLog(`Computed signature: sha256=${verification.computed.substring(0, 20)}...`);
      webhookLog(`Signature valid: ${verification.valid ? "✅ YES" : "❌ NO"}`);

      if (!verification.valid) {
        webhookLog("❌ Signature verification failed!");
        webhookLog("Possible causes:");
        webhookLog("  - Wrong META_APP_SECRET");
        webhookLog("  - Raw body was modified before verification");
        webhookLog("  - Request was tampered with");
        return res.status(403).json({ error: "Invalid signature" });
      }

      webhookLog("✅ Signature verified successfully");
    } else if (META_APP_SECRET) {
      webhookLog("⚠️  No raw body available for signature verification");
      webhookLog("Ensure webhook uses raw body before JSON parsing");
    } else {
      webhookLog("⚠️  META_APP_SECRET not configured - skipping signature verification");
    }

    // Log incoming event
    if (body && typeof body === "object") {
      webhookLog(`Entry count: ${body.entry?.length || 0}`);

      // Log each entry
      if (Array.isArray(body.entry)) {
        body.entry.forEach((entry: any, idx: number) => {
          webhookLog(`Entry ${idx}:`);
          webhookLog(`  ID: ${entry.id}`);
          webhookLog(`  Time: ${entry.time}`);
          webhookLog(`  Changes: ${entry.changes?.length || 0}`);

          if (Array.isArray(entry.changes)) {
            entry.changes.forEach((change: any, changeIdx: number) => {
              webhookLog(`  Change ${changeIdx}: ${change.field}`);
              if (change.value) {
                webhookLog(`    Value keys: ${Object.keys(change.value).join(", ")}`);
              }
            });
          }
        });
      }
    }

    // Acknowledge receipt
    webhookLog("✅ Event logged successfully");
    res.status(200).json({ received: true });
  });

  /**
   * GET /api/webhook/instagram/status
   * Shows webhook configuration status
   */
  app.get("/api/webhook/instagram/status", (req: Request, res: Response) => {
    webhookLog("=== WEBHOOK STATUS CHECK ===");

    const status = {
      webhook_url: `${req.protocol}://${req.hostname}/api/webhook/instagram`,
      verify_token_set: Boolean(META_VERIFY_TOKEN),
      app_secret_set: Boolean(META_APP_SECRET),
      signature_verification_enabled: Boolean(META_APP_SECRET),
      configuration: {
        verify_token: META_VERIFY_TOKEN ? "✅ SET" : "❌ MISSING",
        app_secret: META_APP_SECRET ? "✅ SET" : "❌ MISSING",
      },
      endpoints: {
        verify: "GET /api/webhook/instagram?hub.mode=subscribe&hub.challenge=XXX&hub.verify_token=XXX",
        receive: "POST /api/webhook/instagram",
        status: "GET /api/webhook/instagram/status",
      },
    };

    webhookLog(`Webhook URL: ${status.webhook_url}`);
    webhookLog(`Verify token: ${status.configuration.verify_token}`);
    webhookLog(`App secret: ${status.configuration.app_secret}`);
    webhookLog(`Signature verification: ${status.signature_verification_enabled ? "✅ ENABLED" : "❌ DISABLED"}`);

    res.json(status);
  });

  webhookLog("✅ Instagram webhook routes registered:");
  webhookLog("   - GET /api/webhook/instagram - Verify webhook");
  webhookLog("   - POST /api/webhook/instagram - Receive events");
  webhookLog("   - GET /api/webhook/instagram/status - Check config");
  webhookLog(`   - Verify token configured: ${META_VERIFY_TOKEN ? "YES" : "NO"}`);
  webhookLog(`   - App secret configured: ${META_APP_SECRET ? "YES" : "NO"}`);
}
