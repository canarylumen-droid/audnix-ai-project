// server/index.ts snippet for context
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

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes/index.js";
import { followUpWorker } from "./lib/ai/follow-up-worker.js";
import { startVideoCommentMonitoring } from "./lib/ai/video-comment-monitor.js";
import { workerHealthMonitor } from "./lib/monitoring/worker-health.js";
import { emailWarmupWorker } from "./lib/email/email-warmup-worker.js";
import { emailSyncWorker } from "./lib/email/email-sync-worker.js";
import { paymentAutoApprovalWorker } from "./lib/billing/payment-auto-approval-worker.js";
import { outreachEngine } from "./lib/workers/outreach-engine.js";
import { outreachWorker } from "./lib/queues/outreach-queue.js";
import { campaignWorker } from "./lib/queues/campaign-queue.js";
import { emailSyncWorkerModule } from "./lib/queues/email-sync-queue.js";
import { mailboxHealthService } from "./lib/email/mailbox-health-service.js";
import { redistributionWorker } from "./lib/email/redistribution-worker.js";
import { quotaService } from "./lib/monitoring/quota-service.js";
import { leadExpiryWorker } from "./lib/workers/lead-expiry-worker.js";
import { reputationWorker } from "./lib/workers/reputation-worker.js";
import { meetingReminderWorker } from "./lib/workers/meeting-reminder-worker.js";
import { apiLimiter, authLimiter } from "./middleware/rate-limit.js";
import { sentinel } from "./middleware/sentinel.js";
import { fileURLToPath } from "url";
import fs from "fs";
import * as path from "path";
import crypto from "crypto";
import hpp from "hpp";
import csrf from "csurf";
import { sql } from "drizzle-orm";
import { users } from "../shared/schema.js";

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
app.use(sentinel);
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
app.set("trust proxy", 1);

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
app.use("/webhook/stripe", express.raw({ type: "application/json" }));
app.use(
  "/api/webhook/instagram",
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(
  "/api/instagram/callback",
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.set("trust proxy", 1);
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

// Proactive Quota Check Middleware (MANDATORY TOP-LEVEL)
// This must run BEFORE session store or ANY database queries.
app.use((req, res, next) => {
  if (quotaService.isRestricted()) {
    return res.status(503).json({
      error: "Service Temporarily Unavailable",
      message: "The database is currently undergoing maintenance or has reached its temporary capacity limits. Please try again in a few minutes.",
      code: "QUOTA_EXCEEDED",
      retryAfter: 900 // 15 minutes
    });
  }
  next();
});

const sessionSecret = process.env.SESSION_SECRET || "audnix-stable-dev-fallback-secret-123";
const PgSession = connectPgSimple(session);
let sessionStore: session.Store | undefined;

if (process.env.DATABASE_URL) {
  // Normalize connection string for SSL compatibility (Neon requirement)
  let connectionString: string;
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    if (process.env.DATABASE_URL.includes('neon.tech')) {
      dbUrl.searchParams.set("uselibpqcompat", "true");
      if (!dbUrl.searchParams.has("sslmode")) {
        dbUrl.searchParams.set("sslmode", "require");
      }
    }
    connectionString = dbUrl.toString();
  } catch (urlError) {
    console.error("❌ Invalid DATABASE_URL format:", process.env.DATABASE_URL);
    connectionString = process.env.DATABASE_URL; // Fallback to raw string if URL parsing fails
  }

  const pool = new pg.Pool({
    connectionString,
    ssl:
      process.env.DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 20, // Increased for performance
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('🚨 [SESSION POOL ERROR]:', err);
    quotaService.reportDbError(err);
  });

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
  
  console.log("✅ Using PostgreSQL session store with SSL (optimized)");
}

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret,
  resave: false, // Changed to false for better performance if store supports touch
  saveUninitialized: false,
  name: "audnix.sid",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    sameSite: "lax",
    path: "/",
  },
  store: sessionStore,
  rolling: false, // Changed to false to avoid updating cookie/store on every request unless needed
  proxy: true,
};

app.use(session(sessionConfig));

const ALLOWED_ORIGINS = [
  "https://www.audnixai.com",
  "https://audnixai.com",
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : null,
  process.env.REPLIT_DOMAINS
    ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`)
    : [],
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
    "/api/leads",
    "/api/bulk", // Added to allow bulk actions
    "/api/expert-chat",
    "/auth/instagram",
    "/api/health",
    "/api/automation/content",
    "/api/video-automation",
    "/api/prospecting/v2",
    "/api/oauth/instagram/callback",
    "/api/oauth/instagram/webhook",
    "/api/oauth/facebook/webhook",
    "/api/messages",
    "/api/notifications",
    "/api/dns/verify",
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
  const { runDatabaseMigrations } = await import("./lib/db/migrator.js");
  await runDatabaseMigrations();
}

(async () => {
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  const server = await registerRoutes(app);
  
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
    const PORT = parseInt(process.env.PORT || "5000", 10);
    server.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  }
  if (process.env.DATABASE_URL) {
    await runMigrations();

    if (!process.env.VERCEL) {
      // Worker error wrapper for graceful degradation
      const startWorker = (name: string, startFn: () => void) => {
        try {
          startFn();
          console.log(`✅ ${name} worker started`);
        } catch (error) {
          console.error(`❌ ${name} worker failed to start:`, error);
        }
      };

      // START WORKERS: Follow-up and Outreach engines
      startWorker("Follow-up", () => followUpWorker.start());
      startWorker("Outreach", () => outreachEngine.start());

      startWorker("Video comment", () => startVideoCommentMonitoring());
      startWorker("Email sync", () => emailSyncWorker.start());
      startWorker("Payment approval", () => paymentAutoApprovalWorker.start());
      startWorker("Email warmup", () => emailWarmupWorker.start());
      startWorker("Reputation", () => reputationWorker.start());
      startWorker("Meeting Reminders", () => meetingReminderWorker.start());
      // startWorker("Lead Expiry", () => leadExpiryWorker.start());

      // Real-time IMAP IDLE Manager
      const { imapIdleManager } = await import("./lib/email/imap-idle-manager.js");
      startWorker("IMAP IDLE", () => imapIdleManager.start());
      startWorker("Email sync queue", () => {
        // Just need to ensure it's imported to register the worker
        console.log("Registered email sync queue worker");
      });

      // Mailbox Health Monitoring & Lead Redistribution
      startWorker("Mailbox Health", () => mailboxHealthService.start());
      startWorker("Lead Redistribution", () => redistributionWorker.start());

      // AI Provider Smoke Test
      const { getAIStatus } = await import("./lib/ai/ai-service.js");
      const aiStatus = getAIStatus();
      console.log(`🤖 AI Engine initialized. Active Provider: ${aiStatus.activeProvider}`);
      Object.entries(aiStatus.providers).forEach(([p, s]: [string, any]) => {
          if (s.configured) {
              console.log(`   - ${p}: ${s.available ? '✅ Online' : '⚠️ Offline/Cooldown'}`);
          }
      });
    }
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
