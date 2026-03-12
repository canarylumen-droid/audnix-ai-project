import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";


export default defineConfig({
  plugins: [
    react(),
    // Disable plugins on Vercel to avoid interference with API responses
    ...(process.env.VERCEL === undefined && process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
        await import("@replit/vite-plugin-dev-banner").then((m) =>
          m.devBanner(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "/",
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  css: {
    devSourcemap: false,
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    copyPublicDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui/react-select')) return 'v-ui-select';
            if (id.includes('@radix-ui/react-dialog')) return 'v-ui-dialog';
            if (id.includes('@radix-ui/react-dropdown-menu')) return 'v-ui-dropdown';
            if (id.includes('@radix-ui')) return 'v-ui-core';
            if (id.includes('lucide-react')) return 'v-icons';
            if (id.includes('three') || id.includes('@react-three')) return 'v-3d';
            if (id.includes('recharts')) return 'v-charts';
            if (id.includes('framer-motion')) return 'v-motion';
            if (id.includes('@zxcvbn-ts/language-common')) return 'v-zxc-common';
            if (id.includes('@zxcvbn-ts/language-en')) {
              if (id.includes('lastnames')) return 'v-zxc-en-last';
              if (id.includes('commonWords')) return 'v-zxc-en-common';
              if (id.includes('wikipedia')) return 'v-zxc-en-wiki';
              return 'v-zxc-en-core';
            }
            if (id.includes('@zxcvbn-ts/core')) return 'v-zxc-core';
            if (id.includes('axios') || id.includes('date-fns') || id.includes('wouter')) return 'v-utils';
            if (id.includes('socket.io-client')) return 'v-socket';
            if (id.includes('@tanstack/react-query')) return 'v-query';
            if (id.includes('react-dom')) return 'v-react-dom';
            if (id.includes('react')) return 'v-react-core';
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    hmr: {
      port: 24679,
      overlay: false
    },
    fs: {
      strict: false,
    },
    allowedHosts: [
      "audnixai.com",
      ".railway.app"
    ],
    middlewareMode: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
  },
});
