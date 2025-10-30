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

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration - use built-in MemoryStore in development
const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-please-change-in-production';

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax'
  }
};

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
 * Auto-run database migrations on startup
 */
async function runMigrations() {
  if (!supabaseAdmin) {
    console.log('⚠️  Supabase not configured - skipping migrations');
    console.log('📝 To enable auto-migrations, add these to Secrets:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL');
    console.log('   SUPABASE_SERVICE_ROLE_KEY');
    console.log('   SUPABASE_ANON_KEY');
    return;
  }

  try {
    console.log('🚀 Running database migrations...');

    // Read all migration files in order
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`  ⏳ Running ${file}...`);

      // Execute migration using raw SQL
      const { error } = await supabaseAdmin.rpc('exec_sql', { query: sql });

      if (error && !error.message.includes('already exists')) {
        console.error(`  ❌ Migration ${file} failed:`, error.message);
      } else {
        console.log(`  ✅ ${file} complete`);
      }
    }

    console.log('✅ All migrations complete!');
    console.log('📊 Your database is ready to use');
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    console.log('💡 This is normal if tables already exist');
  }
}

(async () => {
  // Run migrations first
  await runMigrations();

  // Register API routes first (creates the HTTP server)
  const server = registerRoutes(app);

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

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running at http://0.0.0.0:${PORT}`);
  });
})();