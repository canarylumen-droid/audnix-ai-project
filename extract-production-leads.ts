import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// MANUAL ENV LOADING FOR RESILIENCE
try {
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf8');
        env.split(/\r?\n/).forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value.length > 0) {
                process.env[key.trim()] = value.join('=').trim();
            }
        });
    }
} catch (e) {
    console.error("[Env] Initial load failure:", e);
}

async function extractLeads() {
    console.log("[Debug] DATABASE_URL present:", process.env.DATABASE_URL ? "YES" : "NO");

    // Dynamic imports to ensure env is loaded first
    const { AudnixIngestor } = await import('./server/lib/scraping/audnix-ingestor.js');
    const { getDatabase } = await import('./server/db.js');
    const { prospects } = await import('./shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const db = getDatabase();

    console.log("🚀 Starting Production Lead Extraction...");
    console.log("🎯 Target: AI Automation Agencies & Creators (USA)");

    const userId = "00000000-0000-0000-0000-000000000000";
    const ingestor = new AudnixIngestor(userId);

    (ingestor as any).log = async (text: string, type: string) => {
        const symbol = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : (type === 'error' ? '❌' : 'ℹ️'));
        console.log(`${symbol} ${text}`);
    };

    try {
        await ingestor.startNeuralScan("AI Automation Agency Owners and Creators in USA");

        console.log("\n📊 Summarizing results...");

        if (!db) {
            console.error("❌ Database not connected. Check DATABASE_URL in .env");
            return;
        }

        const leads = await db.select()
            .from(prospects)
            .where(eq(prospects.userId, userId))
            .limit(200);

        if (leads.length === 0) {
            console.log("❌ No leads found matching criteria.");
            return;
        }

        console.log(`✅ Extracted ${leads.length} high-quality leads.`);

        const headers = ['Entity', 'Email', 'Phone', 'Location', 'Website', 'Intensity', 'Score'];
        const rows = leads.map(l => [
            l.entity,
            l.email,
            l.phone || '',
            l.location || '',
            l.website,
            l.metadata?.temperature || 'WARM',
            l.leadScore
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        fs.writeFileSync('extracted_leads.csv', csvContent);

        console.log("\n📁 Results saved to 'extracted_leads.csv'");

    } catch (error) {
        console.error("❌ Extraction failed:", error);
    }
}

extractLeads().then(() => {
    process.exit(0);
});
