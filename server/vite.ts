import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config.js";
import { nanoid } from "nanoid";
import { viteLimiter } from './middleware/rate-limit.js';

const viteLogger = createLogger();

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
      hmr: true,
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
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Only serve static files (JS, CSS, images, etc), NOT index.html for everything
  app.use(express.static(distPath, { 
    extensions: ['js', 'css', 'png', 'jpg', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'eot'],
    index: false // Disable automatic index.html serving
  }));

  // EXPLICIT route handlers - API/webhook routes are NOT caught here
  // Only serve index.html for actual page requests (not API calls)
  app.get('/', (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // Catch-all for React Router - serves index.html for all other non-API routes
  app.get('*', (req, res) => {
    // CRITICAL: Never serve index.html for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/')) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
