import { Router, Request, Response } from "express";
import { InstagramOAuth } from "../lib/oauth/instagram.js";
import { storage } from "../storage.js";
import { encrypt } from "../lib/crypto/encryption.js";
import { authLimiter } from "../middleware/rate-limit.js";

interface AuthenticatedRequest extends Request {
  session: Request["session"] & {
    userId?: string;
  };
}

const router = Router();
const instagramOAuth = new InstagramOAuth();

/**
 * GET /auth/instagram
 * Redirect to Instagram OAuth authorization page
 * Logs the OAuth redirect URL for debugging
 */
router.get("/", authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).session?.userId;
    const callbackUrl = process.env.META_CALLBACK_URL || "";

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[Instagram OAuth] /auth/instagram called");
    console.log("[Instagram OAuth] META_CALLBACK_URL: %s", callbackUrl || "NOT SET");
    console.log("[Instagram OAuth] META_APP_ID: %s", process.env.META_APP_ID ? "SET" : "NOT SET");
    console.log("[Instagram OAuth] User ID from session: %s", userId || "NOT AUTHENTICATED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!userId) {
      console.log("[Instagram OAuth] Redirecting to /auth - user not authenticated");
      res.redirect("/auth?error=not_authenticated&redirect=/auth/instagram");
      return;
    }

    const authUrl = instagramOAuth.getAuthorizationUrl(userId);
    console.log("[Instagram OAuth] Generated Auth URL: %s", authUrl);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    res.redirect(authUrl);
  } catch (error) {
    console.error("[Instagram OAuth] Error initiating OAuth:", error);
    res.redirect("/dashboard/integrations?error=oauth_init_failed");
  }
});

/**
 * GET /auth/instagram/callback
 * Handle Instagram OAuth callback
 * Logs the code parameter received from Meta
 */
router.get("/callback", authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error, error_reason, error_description } = req.query;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[Instagram OAuth] /auth/instagram/callback called");
    console.log("[Instagram OAuth] Code received: %s", code ? "YES" : "NONE");
    console.log("[Instagram OAuth] State received: %s", state ? "YES" : "NONE");
    console.log("[Instagram OAuth] Error: %s", error || "NONE");
    console.log("[Instagram OAuth] Error reason: %s", error_reason || "NONE");
    console.log("[Instagram OAuth] Error description: %s", error_description || "NONE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (error_reason === "user_denied" || error === "access_denied") {
      console.log("[Instagram OAuth] User denied access");
      res.redirect("/dashboard/integrations?error=denied");
      return;
    }

    if (error) {
      console.error("[Instagram OAuth] Error from Meta:", { error, error_description });
      res.redirect(`/dashboard/integrations?error=${encodeURIComponent(String(error))}`);
      return;
    }

    if (!code || !state) {
      console.error("[Instagram OAuth] Missing code or state");
      res.redirect("/dashboard/integrations?error=invalid_request");
      return;
    }

    const stateData = instagramOAuth.verifyState(state as string);
    if (!stateData || !stateData.userId) {
      console.error("[Instagram OAuth] Invalid state:", { state, stateData });
      res.redirect("/dashboard/integrations?error=invalid_state");
      return;
    }

    console.log("[Instagram OAuth] Exchanging code for token...");
    const tokenData = await instagramOAuth.exchangeCodeForToken(code as string);
    if (!tokenData || !tokenData.access_token) {
      console.error("[Instagram OAuth] Token exchange failed:", tokenData);
      res.redirect("/dashboard/integrations?error=token_exchange_failed");
      return;
    }

    console.log("[Instagram OAuth] Getting long-lived token...");
    const longLivedToken = await instagramOAuth.exchangeForLongLivedToken(tokenData.access_token);
    if (!longLivedToken || !longLivedToken.access_token) {
      console.error("[Instagram OAuth] Long-lived token failed");
      res.redirect("/dashboard/integrations?error=token_exchange_failed");
      return;
    }

    console.log("[Instagram OAuth] Fetching user profile...");
    const profile = await instagramOAuth.getUserProfile(longLivedToken.access_token);
    if (!profile || !profile.id) {
      console.error("[Instagram OAuth] Profile fetch failed");
      res.redirect("/dashboard/integrations?error=profile_fetch_failed");
      return;
    }

    console.log("[Instagram OAuth] Saving integration for user:", stateData.userId);
    console.log("[Instagram OAuth] Instagram username:", profile.username);

    const encryptedMeta = encrypt(
      JSON.stringify({
        accessToken: longLivedToken.access_token,
        userId: profile.id,
        username: profile.username,
        expiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000).toISOString(),
      })
    );

    const integration = await storage.createIntegration({
      userId: stateData.userId,
      provider: "instagram",
      encryptedMeta,
      connected: true,
      accountType: "business",
      lastSync: new Date(),
    });

    console.log("[Instagram OAuth] Integration created successfully:", integration.id);
    console.log("[Instagram OAuth] Success! Redirecting to integrations page");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    res.redirect("/dashboard/integrations?success=instagram_connected");
  } catch (error: unknown) {
    const err = error as Error & { code?: string; statusCode?: number };
    console.error("[Instagram OAuth] Callback error:", {
      message: err?.message,
      stack: err?.stack,
      code: err?.code,
    });
    res.redirect("/dashboard/integrations?error=oauth_failed");
  }
});

export default router;
