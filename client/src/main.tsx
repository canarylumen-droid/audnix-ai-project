import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle Vite chunk load errors gracefully
window.addEventListener('error', (e) => {
    if (e.message.includes('Failed to fetch dynamically imported module') ||
        e.message.includes('Importing a module script failed')) {
        console.warn('Chunk load failed, reloading...', e);
        window.location.reload();
    }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
