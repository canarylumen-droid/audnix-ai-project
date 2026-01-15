// CRITICAL: Ensure NODE_ENV is set BEFORE any other code runs
// This prevents Vite/Rollup from being loaded in production
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes/index.js";
import { supabaseAdmin, isSupabaseAdminConfigured } from "./lib/supabase-admin.js";
import { followUpWorker } from "./lib/ai/follow-up-worker.js";
import { startVideoCommentMonitoring } from "./lib/ai/video-comment-monitor.js";
import { workerHealthMonitor } from "./lib/monitoring/worker-health.js";
import { emailWarmupWorker } from "./lib/email/email-warmup-worker.js";
import { emailSyncWorker } from "./lib/email/email-sync-worker.js";
import { paymentAutoApprovalWorker } from "./lib/billing/payment-auto-approval-worker.js";
import { apiLimiter, authLimiter } from "./middleware/rate-limit.js";
import crypto from "crypto";
import hpp from 'hpp';
import csrf from 'csurf';
import fs from 'fs';
import path from 'path';
import { sql } from "drizzle-orm";
import { users } from "../shared/schema.js";

const app = express();

// Security: Use HPP to prevent HTTP Parameter Pollution
app.use(hpp());

// Simple logging utility (avoid circular imports)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Set Express environment based on NODE_ENV (NOT the default 'development')
const nodeEnv = process.env.NODE_ENV || 'development';
app.set("env", nodeEnv);

// CRITICAL: Trust proxy for Vercel/production environments
// This fixes X-Forwarded-For header validation for rate limiting
app.set('trust proxy', 1);

// Generate required secrets for development if not provided
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SESSION_SECRET must be set in production!');
    process.exit(1);
  }
  process.env.SESSION_SECRET = 'dev-secret-' + crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  Using generated SESSION_SECRET for development. Set a secure one for production!');
}

if (!process.env.ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ENCRYPTION_KEY must be set in production!');
    process.exit(1);
  }
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  Using generated ENCRYPTION_KEY for development. Set a secure one for production!');
}

// Supabase is optional (used only for auth if configured)
const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasSupabaseKey = Boolean(process.env.SUPABASE_ANON_KEY);

if (hasSupabaseUrl && hasSupabaseKey) {
  console.log('✅ Supabase Auth configured');
}

// Warn about optional variables but don't exit
const optionalEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY'];

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Stripe webhook needs raw body for signature verification
// This MUST come before express.json() to preserve the raw buffer
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

// Instagram webhooks need raw body for Meta signature verification
// We use json() with verify callback to preserve raw body
app.use('/api/webhook/instagram', express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use('/api/instagram/callback', express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Trust proxy for Railway/Vercel/Cloudflare
app.set("trust proxy", 1);

// CRITICAL: Global JSON body parser for ALL other routes
// This MUST come AFTER the raw body handlers above (webhooks) but BEFORE all API routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Optimized Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const currentPath = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400 || duration > 1000 || currentPath.startsWith("/api")) {
      log(`${req.method} ${currentPath} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Configure session - ensure secret is set
// Note: Replit auto-generates SESSION_SECRET, but we validate it's present
// Use a secure session store in production (PostgreSQL via connect-pg-simple)
// Falls back to MemoryStore in development
const sessionSecret = process.env.SESSION_SECRET || 'temporary-dev-secret-change-in-production';
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET not set - using temporary secret (NOT SECURE FOR PRODUCTION)');
}

// Create PostgreSQL session store if DATABASE_URL is available
const PgSession = connectPgSimple(session);
let sessionStore: session.Store | undefined;

// Use connection pooling for session store if possible
if (process.env.DATABASE_URL) {
  sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15,
    // Add connection pooling options if supported by the library
    schemaName: 'public',
  });
  console.log('✅ Using PostgreSQL session store (persistent across restarts)');
}

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'audnix.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    path: '/',
  },
  store: sessionStore,
  rolling: true,
  proxy: true,
};

app.use(session(sessionConfig));

// CSRF Protection
const csrfProtection = csrf({ cookie: false }); // Using session-based CSRF
app.use((req, res, next) => {
  // Skip CSRF for webhooks or specific APIs if needed
  if (req.path.startsWith('/api/webhooks')) {
    return next();
  }
  csrfProtection(req, res, next);
});

// Provide CSRF token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// CORS Middleware - Restricted to allowlist for credential safety
const ALLOWED_ORIGINS = [
  'https://www.audnixai.com',
  'https://audnixai.com',
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
  process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d.trim()}`) : [],
  process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null,
].flat().filter(Boolean) as string[];

app.use((req, res, next) => {
  const origin = req.get('origin');

  // Allow Replit, Vercel, and Railway domains
  const isAllowedDomain = !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.replit.dev') ||
    origin.endsWith('.repl.co') ||
    origin.endsWith('.railway.app') ||
    origin.endsWith('.replit.app');

  if (isAllowedDomain && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // For non-browser requests or same-origin requests without Origin header
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// CSRF Protection via SameSite cookies + Origin validation
app.use((req, res, next) => {
  // Skip CSRF check in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for webhooks (they use signature verification)
  if (req.path.startsWith('/webhook/') || req.path.startsWith('/api/webhook/')) {
    return next();
  }

  // Skip CSRF check for auth endpoints (they use rate limiting + OTP verification)
  if (req.path.startsWith('/api/user/auth/') || req.path.startsWith('/api/auth/')) {
    return next();
  }

  // Verify origin header matches allowed domains
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://audnixai.com',
    'https://www.audnixai.com',
    'http://localhost:5000',
    'https://localhost:5000',
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d.trim()}`) : [],
    process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null
  ].flat().filter((url): url is string => Boolean(url));

  const origin = req.get('origin') || req.get('referer');
  const host = req.get('host');

  if (origin && host && process.env.NODE_ENV === 'production') {
    try {
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.host === allowedUrl.host;
        } catch {
          // If allowed entry isn't a full URL, compare hosts directly
          return originUrl.host === allowed || originUrl.host === host;
        }
      });

      const isAllowedSuffix = originUrl.host.endsWith('.replit.dev') ||
        originUrl.host.endsWith('.replit.app') ||
        originUrl.host.endsWith('.vercel.app') ||
        originUrl.host.endsWith('.railway.app');

      if (!isAllowed && !isAllowedSuffix) {
        console.warn(`CSRF attempt detected: origin ${originUrl.host} not in allowed list`);
        return res.status(403).json({ error: 'Invalid request origin' });
      }
    } catch (e) {
      // Invalid origin URL - reject for security
      return res.status(403).json({ error: 'Invalid origin' });
    }
  }

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Auto-run database migrations on startup using Drizzle
 */
async function runMigrations() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.log('⏭️  Skipping database migrations (DATABASE_URL not set)');
      console.log('💡 App will run in demo mode without database features');
      return;
    }

    const dbHost = new URL(process.env.DATABASE_URL).hostname;
    console.log(`🔌 Connecting to database at: ${dbHost}`);
    console.log('🚀 Running database migrations...');

    // Use Drizzle's db connection directly
    const { db } = await import('./db.js');

    // Check if db is actually initialized
    if (!db) {
      console.log('⏭️  Database not initialized - skipping migrations');
      return;
    }

    // Read all migration files in order
    const migrationsDir = path.join(process.cwd(), 'migrations');

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('⏭️  No migrations directory found, skipping...');
      return;
    }

    // Filter migrations based on database type
    // Skip Supabase-specific migrations (002_*) when using Neon or other non-Supabase databases
    const isSupabaseDB = process.env.SUPABASE_DB === 'true' || process.env.DATABASE_URL?.includes('supabase');

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .filter(f => {
        // Core schema is in 000 or 002. Ensure it runs on non-Supabase too if needed.
        // Actually, 000_SETUP_SUPABASE suggests it's standard Postgres.
        // Let's just run everything that isn't explicitly 002 if not on Supabase,
        // OR better yet, let's just run all migrations and let 'CREATE TABLE IF NOT EXISTS' handle it.
        if (f.startsWith('002_') && !isSupabaseDB) {
          console.log(`  ⏭️  Skipping ${f} (Supabase-only migration, using Neon/PostgreSQL)`);
          return false;
        }
        return true;
      })
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⏭️  No migration files found, skipping...');
      return;
    }

    console.log(`📦 Found ${migrationFiles.length} migration(s) to process`);

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`  ⏳ Running ${file}...`);

      try {
        // Use raw pool query if available for multi-statement execution
        const { pool } = await import('./db.js');
        if (pool) {
          await pool.query(sql);
        } else {
          // Fallback to Drizzle execute for single statements or if pool missing
          await db.execute(sql as any);
        }
        console.log(`  ✅ ${file} complete`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || error.code === '42P07') {
          console.log(`  ⏭️  ${file} (already exists)`);
        } else {
          console.log(`  ⚠️  ${file} skipped: ${error.message}`);
        }
      }
    }

    console.log('✅ All migrations complete!');
    console.log('📊 Your database is ready to use');
  } catch (error: any) {
    console.log('⚠️  Migrations skipped:', error.message);
    console.log('💡 Application will run in demo mode without database features');
  }
}

(async () => {
  // IMMEDIATE Healthcheck responder to satisfy Railway/Vercel probes
  // Register BEFORE Vite middleware to ensure they're always accessible
  app.get('/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Register API routes first (creates the HTTP server)
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite (dev only) or static serving (production only)
  if (process.env.NODE_ENV !== 'production') {
    const { setupVite } = await import('./vite.js');
    await setupVite(app, server);
    console.log('🔄 Vite dev server initialized');
  } else {
    const { serveStatic } = await import('./vite.js');
    serveStatic(app);
    console.log('📦 Serving pre-built static files (production mode)');
  }

  const PORT = parseInt(process.env.PORT || '5000', 10);

  const serverInstance = server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    log(`✅ Healthcheck endpoint active at /health`);
  });

  // Keep-alive configuration for long-running connections
  serverInstance.keepAliveTimeout = 65000;
  serverInstance.headersTimeout = 66000;

  // Graceful shutdown handler
  const shutdown = (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`, "system");
    serverInstance.close(() => {
      log("HTTP server closed.", "system");
      process.exit(0);
    });

    // Force close if it takes too long
    setTimeout(() => {
      log("Could not close connections in time, forcefully shutting down", "system");
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Run migrations and start workers in background AFTER server starts
  (async () => {
    try {
      const isVercel = false; // Forced to false to enable full backend logic on all platforms

      // 1. Run migrations
      if (!isVercel) {
        try {
          await runMigrations();

          // Seed initial data if database is empty (disabled for production)
          const { db } = await import('./db.js');
          const userCount = await db.select({ count: sql`count(*)` }).from(users);
          if (Number(userCount[0].count) === 0) {
            console.log('🌱 Database empty, but demo seeding is disabled to ensure clean production start.');
          }
        } catch (err) {
          console.error('❌ Migration or seeding failed, continuing...', err);
        }
      }

      // Always start workers on persistent environments (Replit, Railway, etc.)
      if (!isVercel) {
        // 2. Start workers
        const { db } = await import('./db.js');
        const hasDatabase = process.env.DATABASE_URL && db;

        if (hasDatabase) {
          console.log('🤖 Initializing AI services...');
          workerHealthMonitor.registerWorker('follow-up-worker');
          workerHealthMonitor.registerWorker('video-comment-monitor');
          workerHealthMonitor.registerWorker('lead-learning');
          workerHealthMonitor.registerWorker('oauth-token-refresh');
          workerHealthMonitor.start();

          followUpWorker.start();
          startVideoCommentMonitoring();

          try {
            const { startLeadLearning } = await import('./lib/ai/lead-learning.js');
            startLeadLearning();
          } catch (err) {
            console.warn('⚠️  Could not start lead learning worker:', err);
          }

          const { GmailOAuth } = await import('./lib/oauth/gmail.js');
          setInterval(() => {
            GmailOAuth.refreshExpiredTokens()
              .then(() => workerHealthMonitor.recordSuccess('oauth-token-refresh'))
              .catch((err) => {
                console.error(err);
                workerHealthMonitor.recordError('oauth-token-refresh', err.message);
              });
          }, 30 * 60 * 1000);

          console.log('📬 Starting core system workers...');
          emailSyncWorker.start();

          // Start real-time IMAP IDLE if available
          try {
            const { imapIdleManager } = await import('./lib/email/imap-idle-manager.js');
            imapIdleManager.start();
          } catch (err) {
            console.warn('⚠️ Could not start IMAP IDLE manager:', err);
          }

          paymentAutoApprovalWorker.start();
          emailWarmupWorker.start();
        }
      }
    } catch (err) {
      console.error('❌ Failed to initialize background workers:', err);
    }
  })();
})();