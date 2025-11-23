/* @ts-nocheck */
import { Request, Response, NextFunction } from 'express';

/**
 * Optional: IP whitelist for admin routes (Vercel environment)
 * Add to VERCEL_ENV_VARS:
 * ADMIN_IPS=192.168.1.1,203.0.113.45
 */
export function adminIPWhitelist(req: Request, res: Response, next: NextFunction) {
  const adminIPs = process.env.ADMIN_IPS?.split(',').map(ip => ip.trim()) || [];

  // If no IPs configured, skip check (all IPs allowed)
  if (adminIPs.length === 0) {
    console.log('⚠️  No ADMIN_IPS configured - all IPs have admin access');
    return next();
  }

  const clientIP = req.ip || req.connection.remoteAddress || '';
  const isAllowed = adminIPs.includes(clientIP);

  if (!isAllowed) {
    console.warn(`[SECURITY] Admin access attempted from unauthorized IP: ${clientIP}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access not allowed from this IP',
    });
  }

  next();
}

/**
 * Secret URL check (optional)
 * Use environment variable: ADMIN_SECRET_PATH=/dashboard-secret-admin-xyz
 */
export function getAdminPath(): string {
  return process.env.ADMIN_SECRET_PATH || '/admin';
}
