// ─── GLOBAL DNS FIX (ABSOLUTE FIRST LINE) ────────────────────────────────────
import dns from "dns";
// Force all lookups to prefer IPv4
dns.setDefaultResultOrder("ipv4first");

// Monkey-patch dns.lookup to strictly filter for IPv4
const originalLookup = dns.lookup;
const patchedLookup = ((hostname: string, options: any, callback: any) => {
  const opt = typeof options === 'function' ? { family: 4 } : { ...options, family: 4 };
  const cb = typeof options === 'function' ? options : callback;
  return originalLookup(hostname, opt, cb);
}) as any;
dns.lookup = patchedLookup;

// Also override promises.lookup
if (dns.promises && dns.promises.lookup) {
    const originalPromisesLookup = dns.promises.lookup;
    dns.promises.lookup = ((hostname: string, options: any) => {
        const opt = typeof options === 'object' ? { ...options, family: 4 } : { family: 4 };
        return originalPromisesLookup(hostname, opt);
    }) as any;
}

// Also override resolve4/resolve6 to prevent bypass
const nativeResolve4 = dns.resolve4;
(dns as any).resolve = nativeResolve4;
(dns as any).resolve6 = (hostname: string, options: any, callback: any) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(new Error('IPv6 is disabled for production stability'), []);
    return Promise.reject(new Error('IPv6 is disabled'));
};
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import * as Sentry from "@sentry/node";

// Initialize Sentry before any other imports if possible
if (process.env.OBSERVABILITY_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.OBSERVABILITY_SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });
  console.log("✅ Sentry initialized on server");
}
import "./lib/pdf-polyfills.js";
try {
  // Ensure @napi-rs/canvas is loadable if needed by dependencies
  import("@napi-rs/canvas");
} catch (e) {
  console.warn("⚠️ @napi-rs/canvas load warning:", (e as any).message);
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// Global Exception Handlers for Production Stability
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] 🛑 Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.OBSERVABILITY_SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] 🛑 Uncaught Exception:', err);
  if (process.env.OBSERVABILITY_SENTRY_DSN) {
    Sentry.captureException(err);
  }
  // In production, we let the process exit for uncaught exceptions 
  // so the orchestrator (Railway/K8s) can restart it cleanly.
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 1000);
  }
});

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes/index.js";
import { leadEnrichmentWorker } from "./lib/workers/lead-enrichment-worker.js";
import { closingWorker } from "./lib/workers/closing-worker.js";
import { postMortemWorker } from "./lib/workers/post-mortem-worker.js";
import { objectionService } from "./lib/ai/objection-service.js";
import { reEngagementWorker } from "./lib/workers/re-engagement-worker.js";
import { workerHealthMonitor } from "./lib/monitoring/worker-health.js";
import { quotaService } from "./lib/monitoring/quota-service.js";
import { apiLimiter, authLimiter } from "./middleware/rate-limit.js";
import { sentinel } from "./middleware/sentinel.js";
import { advancedStorage } from "./lib/storage/advanced-storage.js";
import { pubsubService } from "./lib/realtime/pubsub-service.js";
import { fileURLToPath } from "url";
import fs from "fs";
import * as path from "path";
import crypto from "crypto";
import hpp from "hpp";
import csrf from "csurf";
import { sql } from "drizzle-orm";
import { users } from "../shared/schema.js";
import { db, pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Created uploads directory");
  } catch (err) {
    console.warn(
      "⚠️ Could not create uploads directory, using memory storage fallback",
    );
  }
}

if (!process.env.VERCEL) {
  const uploadDirs = [
    "public/uploads",
    "public/uploads/voice",
    "public/uploads/pdf",
    "public/uploads/avatars",
  ];
  uploadDirs.forEach((dir) => {
    try {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    } catch (err) {
      console.warn(`Could not create directory ${dir}:`, err);
    }
  });
}

const app = express();

// 1. [EMERGENCY] Move Quota Sentinel to the absolute top to protect all requests (including session store)
app.use(quotaService.getSentinelMiddleware());

app.use(hpp());

// Unified CORS middleware for Railway deployment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://audnixai.com',
    'https://www.audnixai.com',
    'http://localhost:5000',
    'http://localhost:5173'
  ];
  
  const isAllowedOrigin = origin && (
    origin.endsWith('.up.railway.app') || 
    allowedOrigins.includes(origin)
  );

  if (origin && isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const nodeEnv = process.env.NODE_ENV || "development";
app.set("env", nodeEnv);
// Trust one hop of proxy (Railway/Load Balancers)
app.set("trust proxy", 1);

if (process.env.NODE_ENV === "production") {
  if (!process.env.SESSION_SECRET || !process.env.ENCRYPTION_KEY) {
    console.error("❌ CRITICAL ERROR: SESSION_SECRET or ENCRYPTION_KEY missing in production.");
    console.error("The application cannot start without these security tokens.");
    process.exit(1);
  }
}

if (!process.env.SESSION_SECRET) {
  // Stabilize secret fallback for Vercel cold starts using a derived value if possible
  // In production, we really want a real secret, but this prevents random rotation every minute
  const stableSecret = process.env.DATABASE_URL
    ? crypto.createHash('sha256').update(process.env.DATABASE_URL).digest('hex')
    : "audnix-stable-dev-fallback-secret-123";
  console.warn("⚠️ SESSION_SECRET not set - using stable derived fallback");
  process.env.SESSION_SECRET = stableSecret;
}

if (!process.env.ENCRYPTION_KEY) {
  const stableKey = process.env.DATABASE_URL
    ? crypto.createHash('sha256').update(process.env.DATABASE_URL + "enc").digest('hex').slice(0, 32)
    : "audnix-stable-dev-fallback-key-123";
  console.warn("⚠️ ENCRYPTION_KEY not set - using stable derived fallback");
  process.env.ENCRYPTION_KEY = stableKey;
}

const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasSupabaseKey = Boolean(process.env.SUPABASE_ANON_KEY);

if (hasSupabaseUrl && hasSupabaseKey) {
  console.log("✅ Supabase Auth configured");
}

const hasEmailKey = Boolean(process.env.TWILIO_SENDGRID_API_KEY);
const senderEmail = process.env.TWILIO_EMAIL_FROM;
console.log(`📧 Email Configuration Check:
  - API Key Present: ${hasEmailKey ? "YES ✅" : "NO ❌"}
  - Sender Email: ${senderEmail || "Default (auth@audnixai.com)"}
`);

if (!hasEmailKey) {
  console.error(
    "❌ CRITICAL: TWILIO_SENDGRID_API_KEY is missing! Emails will fail.",
  );
}

app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);
app.use("/*/webhook/*", express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.use("/webhook/stripe", express.raw({ type: "application/json" }));

app.use(
  "/api/instagram/callback",
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Trust proxy already set globally above
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const currentPath = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (
      res.statusCode >= 400 ||
      duration > 1000 ||
      currentPath.startsWith("/api")
    ) {
      log(`${req.method} ${currentPath} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Phase 9: Global Request Timeout Middleware (15s)
// Prevents slow DB queries or hanging AI streams from exhausting active sockets
app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    if (!res.headersSent) {
      console.warn(`[TIMEOUT] ${req.method} ${req.path} timed out after 15s`);
      res.status(503).json({
        error: "Service Temporarily Unavailable",
        message: "The request took too long to complete. This may be due to high database load.",
        code: "GATEWAY_TIMEOUT"
      });
    }
  });
  next();
});

const sessionSecret = process.env.SESSION_SECRET || "audnix-stable-dev-fallback-secret-123";
const PgSession = connectPgSimple(session);
let sessionStore: session.Store | undefined;

if (process.env.DATABASE_URL && pool) {
  sessionStore = new PgSession({
    pool: pool,
    tableName: "user_sessions",
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 30, // Less frequent pruning
    schemaName: "public",
  });

  // Handle session store errors to prevent server-wide 500s
  (sessionStore as any).on('error', (err: any) => {
    console.error("🚨 [SESSION STORE ERROR]", err);
    quotaService.reportDbError(err);
  });

  // [NEW] Startup connectivity check
  pool.query('SELECT 1').then(() => {
    log("✅ PostgreSQL session store connectivity verified", "session");
  }).catch((err: any) => {
    console.error("🚨 [SESSION] Failed initial connectivity check:", err);
  });

  console.log("✅ Using PostgreSQL session store (Shared Pool)");
}

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret,
  resave: false, // HARDENED: Only save session if modified to reduce DB pressure
  saveUninitialized: false,
  name: "audnix.sid",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
    path: "/",
  },
  store: sessionStore,
  rolling: true, // HARDENED: Reset maxAge on every response to keep session alive during active use
  proxy: true,
};

app.use(session(sessionConfig));

const ALLOWED_ORIGINS = [
  "https://www.audnixai.com",
  "https://audnixai.com",
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.RAILWAY_STATIC_URL
    ? `https://${process.env.RAILWAY_STATIC_URL}`
    : null,
]
  .flat()
  .filter(Boolean) as string[];

const csrfProtection = csrf({ cookie: false });

app.use((req, res, next) => {
  const skipPaths = [
    "/",
    "/index.html",
    "/assets",
    "/api/webhooks",
    "/api/webhook",
    "/api/instagram/callback",
    "/api/instagram/webhook",
    "/api/outreach",
    "/api/facebook/webhook",
    "/api/user/auth",
    "/api/auth",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/register",
    "/api/auth/check",
    "/api/auth/me",
    "/api/auth/logout",
    "/api/user/auth/login",
    "/api/user/auth/signup",
    "/api/user/auth/register",
    "/api/user/auth/check",
    "/api/custom-email",
    "/api/brand-pdf",
    "/api/pdf/upload",
    "/api/prospecting",
    "/api/user/avatar",
    "/api/user/profile",
    "/api/video",
    "/api/expert-chat",
    "/auth/instagram",
    "/api/health",
    "/api/automation/content",
    "/api/video-automation",
    "/api/prospecting/v2",
    "/api/oauth/instagram/callback",
    "/api/oauth/instagram/webhook",
    "/api/oauth/facebook/webhook",
    "/api/oauth/gmail/callback",
    "/api/oauth/google-redirect/gmail/callback",
    "/api/oauth/google-calendar/callback",
    "/api/oauth/google/callback",
    "/api/oauth/calendly/callback",
    "/api/oauth/outlook/callback",
    "/api/messages",
    "/api/notifications",
    "/api/dns/verify",
    "/api/leads",
    "/api/bulk",
  ];

  const requestPath = req.path;
  // Skip security checks for:
  // 1. Non-API routes (React frontend routing handles its own logic)
  // 2. Local development
  // 3. Static assets
  const isApiRoute = requestPath.startsWith("/api/");
  const isStaticAsset =
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|otf|map|json|webp|webmanifest|txt|xml)$/i.test(
      requestPath,
    ) || requestPath.includes("/assets/");
  const isSkippableRoute = skipPaths.some(
    (p) => requestPath === p || requestPath.startsWith(p + "/"),
  );

  if (
    !isApiRoute ||
    isSkippableRoute ||
    process.env.NODE_ENV === "development" ||
    isStaticAsset
  ) {
    return next();
  }

  const origin = req.get("origin") || req.get("referer");
  const host = req.get("host");

  if (origin && process.env.NODE_ENV === "production") {
    try {
      const originUrl = new URL(origin);
      const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.host === allowedUrl.host;
        } catch {
          return originUrl.host === allowed;
        }
      });

      // Allow standard subdomains and common deployment platforms
      const isAllowedSuffix =
        originUrl.hostname.endsWith(".railway.app") ||
        originUrl.hostname === "audnixai.com" ||
        originUrl.hostname.endsWith(".audnixai.com") ||
        originUrl.hostname === (host?.split(":")[0] || "");

      if (!isAllowed && !isAllowedSuffix) {
        console.warn(`⚠️ Origin validation failed for: ${origin} on path: ${req.path}`);
        console.warn(`  Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
        console.warn(`  Host: ${host}`);
        return res
          .status(403)
          .json({ error: "Forbidden", message: "Invalid request origin" });
      }
    } catch (e) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Invalid origin header" });
    }
  }

  csrfProtection(req as any, res as any, (err: any) => {
    if (err) {
      return res
        .status(403)
        .json({
          error: "Forbidden",
          message: "Invalid CSRF token",
          code: "EBADCSRFTOKEN",
        });
    }
    next();
  });
});

app.get("/api/csrf-token", (req, res) => {
  const token = (req as any).csrfToken();
  res.cookie("XSRF-TOKEN", token, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  res.json({ csrfToken: token });
});

app.use((req, res, next) => {
  const origin = req.get("origin");
  const isAllowedDomain =
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".railway.app") ||
    origin.endsWith(".up.railway.app") ||
    origin.endsWith(".audnixai.com");

  if (isAllowedDomain && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    // SECURITY: Use a specific origin instead of mirroring or a wildcard in production
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-CSRF-Token, X-Requested-With",
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

async function runMigrations() {
  try {
    const { runDatabaseMigrations } = await import("./lib/db/migrator.js");
    await runDatabaseMigrations();
  } catch (e: any) {
    const errorMessage = e?.message || String(e);
    if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('maintenance')) {
      console.error("⚠️ [Boot] Database quota exceeded - skipping migration for now. Server will start in READ-ONLY mode if possible.");
      quotaService.reportDbError(e);
    } else {
       throw e; // Rethrow actual structural errors
    }
  }
}

(async () => {
  // Step 0: Validate Critical Environment Variables for Production Readiness
  const criticalEnv = ['DATABASE_URL', 'REDIS_URL', 'GEMINI_API_KEY', 'ENCRYPTION_KEY'];
  const missing = criticalEnv.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ [Advanced Infra] CRITICAL FAILURE: Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 System cannot start in production without these keys. Exiting.');
      process.exit(1);
    }
  }

  if (!process.env.GOOGLE_PUB_SUB_TOPIC) {
    console.warn("⚠️ [Advanced Infra] GOOGLE_PUB_SUB_TOPIC not set. Real-time push notifications will be disabled.");
  }
  
  // Initialize services
  const _storage = advancedStorage;
  const _pubsub = pubsubService;

  app.get("/health", async (_req, res) => {
    try {
      if (process.env.DATABASE_URL) {
        // Perform a lightweight database ping
        // Perform a lightweight database ping with a strict timeout
        await Promise.race([
          db.execute(sql`SELECT 1`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 5000))
        ]);
      }
      
      const workerStatus = workerHealthMonitor.getDetailedStatus();
      if (!workerStatus.healthy) {
        return res.status(503).json({
          status: "error",
          message: "Critical workers failing",
          workers: workerStatus
        });
      }

      res.status(200).json({ 
        status: "ok", 
        database: "connected",
        workers: workerStatus
      });
    } catch (error) {
      console.error("🚨 Health Check Failed:", error);
      res.status(503).json({ status: "error", message: "Database unreachable" });
    }
  });
  const server = await registerRoutes(app);

  // Phase 8: Initialize real-time event broadcaster
  try {
    const { socketService } = await import('./lib/realtime/socket-service.js');
    socketService.init(server);
  } catch (e) {
    log(`[System] Socket.io broadcaster could not be started: ${(e as any)?.message}`, 'error');
  }
  
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PROJECT_ID;
  
  if (!isProduction) {
    // SECURITY/RAILWAY WORKAROUND: Hide the actual string import to prevent 
    // @vercel/nft from statically analyzing and bundling vite + rollout native dependencies
    // into the production container which crashes on startup.
    const vitePath = './vit' + 'e.js'; 
    try {
      const { setupVite } = await import(/* @vite-ignore */ vitePath);
      await setupVite(app, server);
    } catch (e) {
      if (!process.env.VERCEL) {
        log(`[System] Vite dev server not loaded: ${(e as any)?.message}`);
      }
    }
  } else {
    const { serveStatic } = await import("./static.js");
    serveStatic(app);
  }
  
  if (!process.env.VERCEL) {
    const appRole = process.env.APP_ROLE || 'api';
    const PORT = parseInt(process.env.PORT || "5000", 10);
    
    if (appRole !== 'worker') {
      server.listen(PORT, "0.0.0.0", () => {
        log(`🚀 [${appRole.toUpperCase()}] API Server running at http://0.0.0.0:${PORT}`);
      });
    } else {
      log(`⚙️ [WORKER] Starting background synchronization node...`);
    }

    // Post-startup initialization (Non-blocking)
    (async () => {
        if (process.env.DATABASE_URL) {
          try {
            log("📦 Initializing database & migrations...");
            
            // Phase 55: Distributed Migration Lock
            // Only one node in the entire cluster should attempt migrations
            const { acquireDistributedLock } = await import('./lib/redis.js');
            const migrationLock = await acquireDistributedLock('db:migrations', 300); // 5 minute lock
            
            if (migrationLock) {
              log("🛡️ [Migration] Lock acquired. Running migrations...");
              await runMigrations();
              log("✅ [Migration] Database ready");
            } else {
              log("⏳ [Migration] Another node is handling migrations. Skipping.");
            }
          } catch (e) {
            log(`❌ Migration failed: ${e instanceof Error ? e.message : String(e)}`, "error");
            quotaService.reportDbError(e);
          }

          // Delay worker startup slightly to ensure web server is fully responsive
          const WORKER_STARTUP_DELAY = 10000; // Increased to 10s for stability
          const startBackgroundProcesses = async () => {
            if (quotaService.isRestricted()) {
              log("⚠️ [Boot] Quota restriction active - Postponing background worker startup for 15m...");
              setTimeout(startBackgroundProcesses, 15 * 60 * 1000);
              return;
            }

            const appRole = process.env.APP_ROLE || 'api';
            const shouldRunWorkers = appRole === 'worker' || !process.env.APP_ROLE;

            if (!shouldRunWorkers) {
              log(`ℹ️ [${appRole.toUpperCase()}] Skipping background workers suite.`);
              return;
            }

            log(`⚙️ [${appRole.toUpperCase()}] Starting background workers (Lazy Loaded)...`);
            
            // Worker error wrapper for graceful degradation
            const startWorker = async (name: string, startFn: () => any) => {
              try {
                workerHealthMonitor.registerWorker(name);
                const result = startFn();
                if (result instanceof Promise) {
                  result.catch((error) => {
                    console.error(`   - ${name} worker (async error): ❌ Failed:`, error);
                    quotaService.reportDbError(error);
                  });
                }
                console.log(`   - ${name} worker: ✅ Online`);
              } catch (error) {
                console.error(`   - ${name} worker (sync error): ❌ Failed:`, error);
                quotaService.reportDbError(error);
              }
            };

            try {
              // Lazy load workers to speed up initial server boot and binding
              const [
                { followUpWorker },
                { startVideoCommentMonitoring },
                { outreachEngine },
                { emailSyncWorker },
                { paymentAutoApprovalWorker },
                { emailWarmupWorker },
                { reputationWorker },
                { meetingReminderWorker },
                { mailboxHealthService },
                { redistributionWorker },
                { leadGovernanceWorker },
                { emojiFollowupWorker },
                { instagramSyncWorker },
                { aiBudgetWorker }
              ] = await Promise.all([
                import("./lib/ai/follow-up-worker.js"),
                import("./lib/ai/video-comment-monitor.js"),
                import("./lib/workers/outreach-engine.js"),
                import("./lib/email/email-sync-worker.js"),
                import("./lib/billing/payment-auto-approval-worker.js"),
                import("./lib/email/email-warmup-worker.js"),
                import("./lib/workers/reputation-worker.js"),
                import("./lib/workers/meeting-reminder-worker.js"),
                import("./lib/email/mailbox-health-service.js"),
                import("./lib/email/redistribution-worker.js"),
                import("./lib/workers/lead-governance-worker.js"),
                import("./lib/workers/emoji-followup-worker.js"),
                import("./lib/workers/instagram-sync-worker.js"),
                import("./lib/workers/ai-budget-worker.js")
              ]);

              // Background workers for side-effect initializations (BullMQ, etc.)
              await Promise.all([
                import("./lib/queues/outreach-queue.js").catch(() => {}),
                import("./lib/queues/campaign-queue.js").catch(() => {}),
                import("./lib/queues/email-sync-queue.js").catch(() => {})
              ]);

              console.log("🚀 Starting background workers suite...");

              // [WATCHDOG] Initialize global watchdog to monitor for silent stalls
              const spawnWatchdog = async () => {
                setInterval(async () => {
                  try {
                    const { imapIdleManager } = await import("./lib/email/imap-idle-manager.js");
                    if (imapIdleManager.getRunningStatus() === false) {
                       console.warn("🛡️ [WATCHDOG] IMAP Idle Manager stopped. Restarting...");
                       imapIdleManager.start();
                    }
                  } catch (e) {}
                }, 5 * 60_000); // Check every 5m
              };
              spawnWatchdog();

              // START ALL WORKERS
              startWorker("Follow-up", () => followUpWorker.start());
              startWorker("Outreach Engine", () => outreachEngine.start());
              startWorker("Video Comment", () => startVideoCommentMonitoring());
              startWorker("EmailSync", () => emailSyncWorker.start());
              startWorker("Payment Auto-Approval", () => paymentAutoApprovalWorker.start());
              startWorker("Email Warmup", () => emailWarmupWorker.start());
              startWorker("Reputation", () => reputationWorker.start());
              startWorker("Meeting Reminders", () => meetingReminderWorker.start());
              startWorker("Mailbox Health", () => mailboxHealthService.start());
              startWorker("Lead Redistribution", () => redistributionWorker.start());
              startWorker("Lead Governance", () => leadGovernanceWorker.start());
              startWorker("Emoji Follow-up", () => emojiFollowupWorker.start());
              startWorker("Instagram DM Sync", () => instagramSyncWorker.start());
              startWorker("AI Budget Monitor", () => aiBudgetWorker.start());
              
              postMortemWorker.tick(); // Run initially
              setInterval(() => postMortemWorker.tick(), 60 * 60 * 1000); // Hourly
              
              // Objection intelligence - run every 4 hours
              setInterval(() => {
                // Collect for all active users
                db.select({ id: users.id }).from(users).then((allUsers: any[]) => {
                  for (const u of allUsers) objectionService.extractWinningHandles(u.id);
                });
              }, 4 * 60 * 60 * 1000);

              startWorker("Lead Enrichment", () => leadEnrichmentWorker.start());
              startWorker("Autonomous Closing", () => closingWorker.start());
              startWorker("Cold Re-engagement", () => reEngagementWorker.start());

              // Real-time Push & IMAP IDLE Managers
              try {
                const { imapIdleManager } = await import("./lib/email/imap-idle-manager.js");
                const { PushNotificationService } = await import("./lib/email/push-notification-service.js");
                
                startWorker("IMAP IDLE", () => imapIdleManager.start());
                startWorker("Native Push", () => PushNotificationService.initializeAll());
              } catch (e) {
                log("⚠️ Real-time managers could not be started", "error");
              }

              // [PHASE 2 HARDENING] Global Outreach Queue Worker
              const { hasRedis } = await import("./lib/queues/redis-config.js");
              if (hasRedis) {
                try {
                  const { startOutreachWorker } = await import("./lib/queues/outreach-queue.js");
                  startWorker("Outreach Queue", () => startOutreachWorker());
                } catch (e) {
                  log("⚠️ Outreach Worker could not be started", "error");
                }
              }

              // AI Provider Smoke Test
              try {
                const { getAIStatus } = await import("./lib/ai/ai-service.js");
                const aiStatus = getAIStatus();
                console.log(`🤖 AI Engine initialized. Active Provider: ${aiStatus.activeProvider}`);
              } catch (e) {
                log("⚠️ AI Service could not be initialized", "error");
              }
            } catch (err) {
              console.error("❌ Critical error during background worker initialization:", err);
              quotaService.reportDbError(err);
            }
          };

          setTimeout(startBackgroundProcesses, WORKER_STARTUP_DELAY);
        }
      })();

    // Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      log(`🛑 Received ${signal}. Shutting down gracefully...`);

      // 1. Stop accepting new requests immediately
      server.close(() => {
        log("👋 HTTP server closed. Process exiting.");
        process.exit(0);
      });

      // 2. Stop background services to release sockets and DB connections
      try {
        const { imapIdleManager } = await import("./lib/email/imap-idle-manager.js");
        imapIdleManager.stop();
      } catch (e) { /* service may not have started */ }

      try {
        const { mailboxHealthService } = await import("./lib/email/mailbox-health-service.js");
        mailboxHealthService.stop();
      } catch (e) { /* service may not have started */ }

      try {
        const { instagramSyncWorker } = await import("./lib/workers/instagram-sync-worker.js");
        instagramSyncWorker.stop();
      } catch (e) { /* service may not have started */ }

      // 3. Force exit after 10s if graceful shutdown fails
      setTimeout(() => {
        log("⚠️ Forceful shutdown triggered");
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  }
})();

// GLOBAL ERROR HANDLER - Catch anything that bubbled up and log it
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  log(`🚨 [FATAL ERROR] ${req.method} ${req.path}: ${err.message || err}`, "error");
  
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Sentry report if configured
  if (process.env.OBSERVABILITY_SENTRY_DSN) {
    Sentry.captureException(err);
  }

  if (res.headersSent) {
    return next(err);
  }

  // Specialized response for database quota issues
  const isQuotaError = 
    String(err.code) === 'XX000' || 
    (err.message && (
      err.message.toLowerCase().includes('quota') || 
      err.message.includes('XX000') ||
      err.message.toLowerCase().includes('capacity limit')
    ));
  if (isQuotaError) {
    quotaService.reportDbError(err); // Ensure service tracks it
    return res.status(503).json({
      error: "Service Temporarily Unavailable",
      message: "Database capacity limit reached. We are automatically throttling requests to restore service. Please try again in 15 minutes.",
      code: "XX000"
    });
  }

  res.status(status).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'production' 
      ? "An unexpected error occurred. Please try again later."
      : err.message,
    code: err.code || "INTERNAL_ERROR"
  });
});

export default app;
