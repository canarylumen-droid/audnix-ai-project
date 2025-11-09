import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { supabaseAdmin } from "./lib/supabase-admin";
import { followUpWorker } from "./lib/ai/follow-up-worker";
import { startVideoCommentMonitoring } from "./lib/ai/video-comment-monitor";
import { workerHealthMonitor } from "./lib/monitoring/worker-health";
import { apiLimiter, authLimiter } from "./middleware/rate-limit";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const app = express();

// Validate critical environment variables for production
const criticalEnvVars = ['SESSION_SECRET', 'ENCRYPTION_KEY'];
const missingCritical = criticalEnvVars.filter(v => !process.env[v]);

if (missingCritical.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingCritical.join(', '));
  console.error('💡 Add these to your Replit Secrets:');
  console.error('   - SESSION_SECRET: Generate with: openssl rand -hex 32');
  console.error('   - ENCRYPTION_KEY: Generate with: openssl rand -hex 32');
  process.exit(1);
}

// Validate Supabase configuration if keys are partially set
const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (hasSupabaseUrl !== hasSupabaseKey) {
  console.error('❌ Incomplete Supabase configuration');
  console.error('💡 Both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  if (!hasSupabaseUrl) console.error('   Missing: NEXT_PUBLIC_SUPABASE_URL');
  if (!hasSupabaseKey) console.error('   Missing: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Warn about optional variables (Supabase) but don't exit
const optionalEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingOptional = optionalEnvVars.filter(v => !process.env[v]);

if (missingOptional.length > 0) {
  console.warn('⚠️  Optional environment variables not set:', missingOptional.join(', '));
  console.warn('💡 The app will run in demo mode without these. Add them for full functionality.');
}

// Generate a session secret for development if not provided
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'dev-secret-' + crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  Using generated SESSION_SECRET for development. Set a secure one for production!');
}

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration - use built-in MemoryStore in development
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable must be set in production');
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
  // Use database for sessions in production
  store: process.env.DATABASE_URL ? undefined : undefined // PostgreSQL store configured via connect-pg-simple
};

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.warn('⚠️  Using memory session store - sessions will be lost on restart');
  console.warn('💡 Configure DATABASE_URL in Replit Secrets for persistent sessions');
}

app.use(session(sessionConfig));

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
  
  // Verify origin header matches allowed domains
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:5000',
    'https://localhost:5000',
    `http://0.0.0.0:5000`,
    `https://0.0.0.0:5000`
  ].filter(Boolean);

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
      console.log('💡 App will run in demo mode - add DATABASE_URL to enable persistence');
      return;
    }

    console.log('🚀 Running database migrations...');

    // Use Drizzle's db connection directly
    const { db } = await import('./db');
    
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

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
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
  // Run migrations first
  await runMigrations();

  // Register API routes first (creates the HTTP server)
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite or static serving (server must be created first)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start background workers only if database AND Supabase are configured
  const { db } = await import('./db');
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
    const { startLeadLearning } = await import('./lib/ai/lead-learning');
    startLeadLearning();
    
    // Start OAuth token refresh worker (every 30 minutes)
    const { GmailOAuth } = await import('./lib/oauth/gmail');
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
  } else {
    if (!hasDatabase) {
      console.log('⏭️  Background workers disabled (no database configured)');
      console.log('💡 Add DATABASE_URL to enable AI workers');
    }
    if (!hasSupabase) {
      console.log('⏭️  Background workers disabled (Supabase not configured)');
      console.log('💡 Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable workers');
    }
  }

  const PORT = parseInt(process.env.PORT || '5000', 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`✅ Ready for production traffic`);
  });
})();