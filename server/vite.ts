import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { viteLimiter } from './middleware/rate-limit.js';

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // ONLY import Vite in development mode - this prevents Rollup from loading in production
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteConfig = (await import("../vite.config.js")).default;
  const viteLogger = createLogger();

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: {
        port: parseInt(process.env.VITE_HMR_PORT || "24679"),
      },
    },
    appType: "custom",
  });

  // Apply rate limiting to vite routes
  app.use(viteLimiter);
  app.use(vite.middlewares);
  // Skip Vite for API routes - let Express handlers take over
  app.use("*", async (req, res, next) => {
    // Skip Vite for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/')) {
      return next();
    }

    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Optimized static serving for production
  app.use(express.static(distPath, {
    dotfiles: 'allow',
    index: false,
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // Explicit Content-Type for critical assets
      if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
      if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
      if (filePath.endsWith('.json') || filePath.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/json');
      // Set permissive cache for assets but no-cache for index/sw
      if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Explicit route handlers for PWA/Manifest files with strict path validation
  app.get(['/sw.js', '/manifest.json', '/favicon.ico', '/robots.txt'], viteLimiter, (req, res) => {
    const safeFiles = ['sw.js', 'manifest.json', 'favicon.ico', 'robots.txt'];
    const fileName = req.path.substring(1);

    if (!safeFiles.includes(fileName)) {
      return res.status(404).end();
    }

    const filePath = path.resolve(distPath, fileName);
    if (fs.existsSync(filePath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(filePath);
    } else {
      res.status(404).end();
    }
  });

  // Handle all other routes by serving index.html (SPA)
  app.get('*', viteLimiter, (req, res) => {
    // CRITICAL: Never serve index.html for API or Webhook routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/') || req.path === '/health') {
      if (req.path === '/health') {
        return res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
      }
      return res.status(404).json({ error: "Not found" });
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
