import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { viteLimiter } from './middleware/rate-limit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.join(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    log(`⚠️ Build directory not found at ${distPath}. Build the client first.`, "static");
    return; // Don't throw, just log and continue to allow API to work
  }

  log(`📂 Serving static files from: ${distPath}`, "static");

  // Optimized static serving for production
  app.use(express.static(distPath, {
    dotfiles: 'allow',
    index: false,
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // CORS headers for assets (needed for crossorigin script tags)
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Explicit Content-Type for critical assets
      if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
      if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
      if (filePath.endsWith('.json') || filePath.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/json');
      
      // Cache settings
      if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Explicit route handlers for PWA/Manifest files
  app.get(['/sw.js', '/manifest.json', '/favicon.ico', '/robots.txt', '/favicon.svg'], (req, res) => {
    const fileName = req.path.substring(1);
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
    const isAsset = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|otf|map|json|webp)$/i.test(req.path) || req.path.includes("/assets/");
    const isInternalPlatformRoute = 
      req.path.startsWith('/_vercel/') || 
      req.path.startsWith('/_next/') || 
      req.path.startsWith('/.well-known/');

    if (isAsset || req.path.startsWith('/api/') || req.path.startsWith('/webhook/') || req.path === '/health' || isInternalPlatformRoute) {
      if (req.path === '/health') {
        return res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
      }
      return res.status(404).json({ error: "Not found" });
    }

    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application shell not found. Please build the client.");
    }
  });
}
