import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extend Express session to include our custom fields
declare module "express-session" {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    supabaseId?: string;
  }
}

/**
 * Authentication middleware - requires user to be logged in
 * Only accepts authenticated sessions - no header bypass
 * Prevents timing attacks and session fixation
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  
  if (!userId) {
    // Security: Add small delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 100));
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
  }

  // Verify user exists in database
  const user = await storage.getUserById(userId);
  if (!user) {
    // Security: Add small delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Security: Destroy invalid session to prevent fixation attacks
    req.session.destroy(() => {});
    
    return res.status(401).json({ 
      error: "Invalid session",
      message: "User not found"
    });
  }

  // Security: Regenerate session ID periodically to prevent session fixation
  const lastRegeneration = (req.session as any).lastRegeneration || 0;
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  if (now - lastRegeneration > ONE_HOUR) {
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
      } else {
        (req.session as any).userId = userId;
        (req.session as any).lastRegeneration = now;
      }
    });
  }

  // Attach user to request for downstream handlers
  (req as any).user = user;
  next();
}

/**
 * Optional authentication middleware - attaches user if logged in
 * Does not require authentication, but provides user context if available
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  
  if (userId) {
    const user = await storage.getUserById(userId);
    if (user) {
      (req as any).user = user;
    }
  }
  
  next();
}

/**
 * Admin-only middleware - requires user to be an admin
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
  }

  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(401).json({ 
      error: "Invalid session",
      message: "User not found"
    });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ 
      error: "Forbidden",
      message: "Admin access required"
    });
  }

  (req as any).user = user;
  next();
}

/**
 * Middleware to check if user has an active subscription or valid trial
 * Blocks access to premium features if trial expired and no paid plan
 */
export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
  }

  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(401).json({ 
      error: "Invalid session",
      message: "User not found"
    });
  }

  // Check if user has a paid plan
  if (user.plan && user.plan !== 'trial') {
    (req as any).user = user;
    return next();
  }

  // If on trial, check if it's expired
  if (user.plan === 'trial' && user.trialExpiresAt) {
    const now = new Date();
    if (now < user.trialExpiresAt) {
      // Trial is still valid
      (req as any).user = user;
      return next();
    }
  }

  // Trial expired or no active subscription
  return res.status(402).json({
    error: "Subscription required",
    message: "Your free trial has ended. Please upgrade to continue using premium features.",
    redirectTo: "/dashboard/pricing"
  });
}

/**
 * Helper function to get current user from request
 */
export function getCurrentUser(req: Request) {
  return (req as any).user;
}

/**
 * Helper function to get current user ID from request
 */
export function getCurrentUserId(req: Request): string | undefined {
  return req.session?.userId;
}
