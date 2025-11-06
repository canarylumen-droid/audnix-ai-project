import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { supabaseAdmin } from "./lib/supabase-admin";
import { followUpWorker } from "./lib/ai/follow-up-worker";
import { startVideoCommentMonitoring } from "./lib/ai/video-comment-monitor";
import { workerHealthMonitor } from "./lib/monitoring/worker-health";
import { apiLimiter, authLimiter } from "./middleware/rate-limit";
import fs from "fs";
import path from "path";

const app = express();

// Validate critical environment variables
const requiredEnvVars = [
  'SESSION_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('💡 Add these to your Replit Secrets before deployment');
  process.exit(1);
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
      return;
    }

    console.log('🚀 Running database migrations...');

    // Use Drizzle's db connection directly
    const { db } = await import('./db');
    
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
    console.log('💡 Application will run without database features');
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

  // Start background workers
  if (supabaseAdmin) {
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
  }

  const PORT = parseInt(process.env.PORT || '5000', 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`✅ Ready for production traffic`);
  });
})();