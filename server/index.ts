import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { supabaseAdmin } from "./lib/supabase-admin";
import { followUpWorker } from "./lib/ai/follow-up-worker";
import { startVideoCommentMonitoring } from "./lib/ai/video-comment-monitor";
import fs from "fs";
import path from "path";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration with Redis store for production
const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-please-change-in-production';

let sessionConfig: session.SessionOptions = {
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

// Use Redis in production if configured
if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  try {
    const RedisStore = require('connect-redis').default;
    const { createClient } = require('redis');
    
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 500)
      }
    });
    
    redisClient.connect().catch(console.error);
    
    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected for session storage');
    });
    
    sessionConfig.store = new RedisStore({ client: redisClient });
    console.log('🔒 Using Redis session store');
  } catch (error) {
    console.warn('⚠️  Redis not available, using memory store');
  }
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

  // Register API routes
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start background workers
  if (supabaseAdmin) {
    console.log('🤖 Starting AI workers...');
    followUpWorker.start();
    startVideoCommentMonitoring();
    
    // Start OAuth token refresh worker (every 30 minutes)
    const { GmailOAuth } = await import('./lib/oauth/gmail');
    setInterval(() => {
      GmailOAuth.refreshExpiredTokens().catch(console.error);
    }, 30 * 60 * 1000);
    
    console.log('✅ AI workers running');
    console.log('✅ OAuth token refresh worker started');
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running at http://0.0.0.0:${PORT}`);
  });
})();