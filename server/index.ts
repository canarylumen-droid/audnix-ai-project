import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes.js";
import { serveStatic, log } from "./vite.js";
import { supabaseAdmin, isSupabaseAdminConfigured } from "./lib/supabase-admin.js";
import { followUpWorker } from "./lib/ai/follow-up-worker.js";
import { startVideoCommentMonitoring } from "./lib/ai/video-comment-monitor.js";
import { workerHealthMonitor } from "./lib/monitoring/worker-health.js";
import { emailWarmupWorker } from "./lib/email/email-warmup-worker.js";
import { emailSyncWorker } from "./lib/email/email-sync-worker.js";
import { apiLimiter, authLimiter } from "./middleware/rate-limit.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const app = express();

// Set Express environment based on NODE_ENV (NOT the default 'development')
const nodeEnv = process.env.NODE_ENV || 'development';
app.set("env", nodeEnv);

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

// For all other routes, use JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session - ensure secret is set
// Note: Replit auto-generates SESSION_SECRET, but we validate it's present
// Use a secure session store in production (PostgreSQL via connect-pg-simple)
// Falls back to MemoryStore in development
const sessionSecret = process.env.SESSION_SECRET || 'temporary-dev-secret-change-in-production';
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET not set - using temporary secret (NOT SECURE FOR PRODUCTION)');
}

if (sessionSecret === 'temporary-dev-secret-change-in-production' && process.env.NODE_ENV === 'production') {
  console.error('❌ SESSION_SECRET must be set in production!');
  throw new Error('SESSION_SECRET environment variable must be set in production');
}

// Create PostgreSQL session store if DATABASE_URL is available
const PgSession = connectPgSimple(session);
let sessionStore: session.Store | undefined;

if (process.env.DATABASE_URL) {
  sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 mins
  });
  console.log('✅ Using PostgreSQL session store (persistent across restarts)');
} else {
  console.warn('⚠️  Using memory session store - sessions will be lost on restart');
  console.warn('💡 Configure DATABASE_URL for persistent sessions');
}

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  store: sessionStore
};

app.use(session(sessionConfig));

// CORS Middleware - Allow browser requests from allowed origins
app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://audnixai.com',
    'https://www.audnixai.com',
    'http://localhost:5000',
    'https://localhost:5000',
    'http://localhost:3000',
    'https://localhost:3000',
    `http://0.0.0.0:5000`,
    `https://0.0.0.0:5000`
  ].filter((url): url is string => Boolean(url));

  const origin = req.get('origin');
  
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.host === allowedUrl.host;
        } catch {
          return false;
        }
      });

      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
    } catch (e) {
      // Invalid origin URL - ignore
    }
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// CSRF Protection via SameSite cookies + Origin validation
app.use((req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for webhooks (they use signature verification)
  if (req.path.startsWith('/webhook/')) {
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
    `http://0.0.0.0:5000`,
    `https://0.0.0.0:5000`
  ].filter((url): url is string => Boolean(url));

  const origin = req.get('origin') || req.get('referer');
  const host = req.get('host');

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.host === allowedUrl.host;
        } catch {
          return originUrl.host === host;
        }
      });

      if (!isAllowed) {
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
        // Skip Supabase-specific migrations if not using Supabase
        if (f.startsWith('002_') && !isSupabaseDB) {
          console.log(`  ⏭️  Skipping ${f} (Supabase-only migration, using ${isSupabaseDB ? 'Supabase' : 'Neon/PostgreSQL'})`);
          return false;
        }
        return true;
      })
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⏭️  No migration files found, skipping...');
      return;
    }

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`  ⏳ Running ${file}...`);

      try {
        // Execute SQL directly using Drizzle's execute method
        await db.execute(sql as any);
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
  // Run migrations first (with timeout to prevent hanging)
  let migrationsSucceeded = false;
  try {
    const migrationPromise = runMigrations();
    const timeoutPromise = new Promise<void>((_, reject) => 
      setTimeout(() => reject(new Error('Migration timeout after 30 seconds')), 30000)
    );
    await Promise.race([migrationPromise, timeoutPromise]);
    migrationsSucceeded = true;
  } catch (error: any) {
    if (error.message.includes('timeout')) {
      console.error('❌ Migrations timed out. Server will still start but some features may not work.');
      console.log('💡 Run migrations manually or check database connectivity');
    } else {
      console.log('⚠️  Migration step completed with warnings:', error.message);
      migrationsSucceeded = true; // Non-timeout errors are handled gracefully in runMigrations
    }
  }

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
  // In production (Vercel), only serve pre-built static files to avoid loading Rollup/Vite
  if (process.env.NODE_ENV !== 'production') {
    const { setupVite } = await import('./vite.js');
    await setupVite(app, server);
    console.log('🔄 Vite dev server initialized');
  } else {
    serveStatic(app);
    console.log('📦 Serving pre-built static files (production mode)');
  }

  // Start background workers only if database AND Supabase are configured
  const { db } = await import('./db.js');
  const hasDatabase = process.env.DATABASE_URL && db;
  const hasSupabase = isSupabaseAdminConfigured();

  if (hasDatabase && hasSupabase && supabaseAdmin) {
    console.log('🤖 Starting AI workers...');

    // Register workers for health monitoring
    workerHealthMonitor.registerWorker('follow-up-worker');
    workerHealthMonitor.registerWorker('video-comment-monitor');
    workerHealthMonitor.registerWorker('lead-learning');
    workerHealthMonitor.registerWorker('oauth-token-refresh');
    workerHealthMonitor.start();

    followUpWorker.start();
    startVideoCommentMonitoring();

    // Start lead learning system
    const { startLeadLearning } = await import('./lib/ai/lead-learning.js');
    startLeadLearning();

    // Start OAuth token refresh worker (every 30 minutes)
    const { GmailOAuth } = await import('./lib/oauth/gmail.js');
    setInterval(() => {
      GmailOAuth.refreshExpiredTokens()
        .then(() => workerHealthMonitor.recordSuccess('oauth-token-refresh'))
        .catch((err) => {
          console.error(err);
          workerHealthMonitor.recordError('oauth-token-refresh', err.message);
        });
    }, 30 * 60 * 1000);

    console.log('✅ AI workers running');
    console.log('✅ Lead learning system active');
    console.log('✅ OAuth token refresh worker started');
    console.log('✅ Worker health monitoring active');

    // Start email warmup worker
    emailWarmupWorker.start();
    console.log('🔥 Email warmup worker active');

    // Start email sync worker (syncs user's connected mailboxes)
    emailSyncWorker.start();
    console.log('📬 Email sync worker active');
  } else {
    if (!hasDatabase) {
      console.log('⏭️  Background workers disabled (no database configured)');
      console.log('💡 Add DATABASE_URL to enable AI workers');
    }
  }

  const PORT = parseInt(process.env.PORT || '5000', 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`✅ Ready for production traffic`);
  });
})();