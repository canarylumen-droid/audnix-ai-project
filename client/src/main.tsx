import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, 
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

// Handle Vite chunk load errors gracefully
window.addEventListener('error', (e) => {
    if (e.message.includes('Failed to fetch dynamically imported module') ||
        e.message.includes('Importing a module script failed')) {
        console.warn('Chunk load failed, reloading...', e);
        window.location.reload();
    }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
