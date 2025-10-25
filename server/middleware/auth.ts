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
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
  }

  // Verify user exists in database
  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(401).json({ 
      error: "Invalid session",
      message: "User not found"
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
