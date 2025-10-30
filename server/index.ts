import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const { Pool } = pg;

const app = express();

// Security: Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite HMR in dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.elevenlabs.io", "wss:", "ws:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow external resources
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Security: Rate limiting to prevent brute force and DOS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Allow more for legitimate webhook traffic
  message: "Webhook rate limit exceeded.",
});

// Apply rate limiting to API routes
app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/webhook/", webhookLimiter);

// Security: Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Security: Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// Validate required environment variables for production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is required in production');
  console.error('Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// Trust proxy for deployments behind reverse proxies (Vercel, Netlify, etc.)
// This is required for secure cookies to work correctly in production
app.set('trust proxy', 1);

// Configure session storage with PostgreSQL
const PgSession = connectPgSimple(session);

// Create database pool with error handling
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Add error handler to prevent crashes
sessionPool.on('error', (err) => {
  console.error('Unexpected error on session database client:', err);
  console.error('Session storage may be unavailable. Check DATABASE_URL configuration.');
});

const sessionStore = new PgSession({
  pool: sessionPool,
  createTableIfMissing: true,
  tableName: 'user_sessions',
});

console.log('✓ Using PostgreSQL for session storage (persistent across restarts)');

// Session middleware with secure HTTP-only cookies
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-secret-DO-NOT-USE-IN-PRODUCTION',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure in production (HTTPS only)
    httpOnly: true, // HTTP-only cookies prevent XSS attacks
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict' // Strict SameSite for maximum security (authentication is server-side only)
  },
  name: 'audnix.sid', // Custom session name
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Security: Limit request body size to prevent DOS attacks
app.use(express.json({
  limit: '10mb', // Limit JSON payload size
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: false,
  limit: '10mb', // Limit URL-encoded payload size
}));

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Security: Don't leak sensitive error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? (status === 500 ? "Internal Server Error" : err.message || "An error occurred")
      : err.message || "Internal Server Error";

    // Log full error server-side for debugging
    console.error('Error:', {
      status,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Send sanitized error to client
    res.status(status).json({ 
      error: message,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
