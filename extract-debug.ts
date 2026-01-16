import 'dotenv/config';
import fs from 'fs';
import path from 'path';

console.log("[Debug] CWD:", process.cwd());
const envPath = path.resolve('.env');
console.log("[Debug] Env Path:", envPath);

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log("[Debug] Env Content Length:", content.length);
    console.log("[Debug] Env Content First 20 chars:", content.substring(0, 20).replace(/\n/g, '\\n'));
    content.split(/\r?\n/).forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
            const k = key.trim();
            const v = value.join('=').trim();
            process.env[k] = v;
            console.log(`[Debug] Manual set: ${k}`);
        }
    });
} else {
    console.log("[Debug] .env NOT FOUND at", envPath);
}

async function extractLeads() {
    console.log("[Debug] DATABASE_URL present after manual load:", process.env.DATABASE_URL ? "YES" : "NO");

    try {
        const { AudnixIngestor } = await import('./server/lib/scraping/audnix-ingestor.js');
        const { getDatabase } = await import('./server/db.js');
        const { prospects } = await import('./shared/schema.js');
        const { eq } = await import('drizzle-orm');

        const db = getDatabase();
        console.log("[Debug] DB connected:", !!db);

        console.log("🚀 Starting Production Lead Extraction...");
    } catch (e) {
        console.error("[Debug] Import error:", e);
    }
}

extractLeads().then(() => {
    process.exit(0);
});
