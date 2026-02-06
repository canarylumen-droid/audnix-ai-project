// server/index.ts snippet for context
import "dotenv/config";
import "./lib/pdf-polyfills.js";
try {
  // Ensure @napi-rs/canvas is loadable if needed by dependencies
  import("@napi-rs/canvas");
} catch (e) {
  console.warn("⚠️ @napi-rs/canvas load warning:", e.message);
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
import { autonomousOutreachWorker } from "./lib/workers/outreach-worker.js";
import { apiLimiter, authLimiter } from "./middleware/rate-limit.js";
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
app.use(hpp());

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
  console.warn("⚠️ SESSION_SECRET not set - generating temporary secret (NOT SAFE FOR PRODUCTION)");
  process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
}

if (!process.env.ENCRYPTION_KEY) {
  console.warn("⚠️ ENCRYPTION_KEY not set - generating temporary key (NOT SAFE FOR PRODUCTION)");
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
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

const sessionSecret =
  process.env.SESSION_SECRET || "temporary-dev-secret-change-in-production";
const PgSession = connectPgSimple(session);
let sessionStore: session.Store | undefined;

if (process.env.DATABASE_URL) {
  // Normalize connection string for SSL compatibility (Neon requirement)
  const dbUrl = new URL(process.env.DATABASE_URL);
  if (process.env.DATABASE_URL.includes('neon.tech')) {
    dbUrl.searchParams.set("uselibpqcompat", "true");
    if (!dbUrl.searchParams.has("sslmode")) {
      dbUrl.searchParams.set("sslmode", "require");
    }
  }
  const connectionString = dbUrl.toString();

  const pool = new pg.Pool({
    connectionString,
    ssl:
      process.env.DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  sessionStore = new PgSession({
    pool: pool,
    tableName: "user_sessions",
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15,
    schemaName: "public",
  });
  console.log("✅ Using PostgreSQL session store with SSL (persistent)");
}

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
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
  rolling: true,
  proxy: true,
};

app.use(session(sessionConfig));

const ALLOWED_ORIGINS = [
  "https://www.audnixai.com",
  "https://audnixai.com",
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
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
  ];

  const requestPath = req.path;
  // Skip security checks for:
  // 1. API webhooks/auth endpoints
  // 2. Local development
  // 3. Static assets (images, icons, etc.) to prevent 403s on favicons
  const isStaticAsset =
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|otf|map|json|webp)$/i.test(
      requestPath,
    ) || requestPath.includes("/assets/");
  const isSkippableRoute = skipPaths.some(
    (p) => requestPath === p || requestPath.startsWith(p + "/"),
  );

  if (
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
        originUrl.hostname.endsWith(".vercel.app") ||
        originUrl.hostname.endsWith(".replit.app") ||
        originUrl.hostname.endsWith(".replit.dev") ||
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
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".replit.dev") ||
    origin.endsWith(".repl.co") ||
    origin.endsWith(".railway.app") ||
    origin.endsWith(".replit.app");

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
  console.log("🚀 Starting database migrations...");
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    const { stdout, stderr } = await execAsync("node scripts/migrate-manual.js");
    console.log("📦 Migration output:", stdout);
    if (stderr) console.error("⚠️ Migration stderr:", stderr);
    console.log("✨ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed at startup:", error);
  }
}

(async () => {
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  const server = await registerRoutes(app);
  if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./vite.js");
    serveStatic(app);
  }
  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  });

  if (process.env.NODE_ENV !== "production" && (server as any)._vite) {
    // If we have access to vite instance via server, we can try to change its HMR port
    // but typically it's better to just set VITE_HMR_PORT env var
  }

  if (process.env.DATABASE_URL) {
    await runMigrations();

    // Worker error wrapper for graceful degradation
    const startWorker = (name: string, startFn: () => void) => {
      try {
        startFn();
        console.log(`✅ ${name} worker started`);
      } catch (error) {
        console.error(`❌ ${name} worker failed to start:`, error);
      }
    };

    startWorker("Follow-up", () => followUpWorker.start());
    startWorker("Video comment", () => startVideoCommentMonitoring());
    startWorker("Email sync", () => emailSyncWorker.start());
    startWorker("Payment approval", () => paymentAutoApprovalWorker.start());
    startWorker("Email warmup", () => emailWarmupWorker.start());
    startWorker("Outreach", () => autonomousOutreachWorker.start());
  }
})();

export default app;
