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

    console.log("🚀 Starting specialized 'Ghost Business' Extraction...");
    console.log("🎯 Target: Business Owners (USA), No Website, Potential Sales Loss");

    const userId = "00000000-0000-0000-0000-000000000500";
    const ingestor = new AudnixIngestor(userId);

    (ingestor as any).log = async (text: string, type: string) => {
        const symbol = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : (type === 'error' ? '❌' : 'ℹ️'));
        console.log(`${symbol} ${text}`);
    };

    try {
        const query = "500 leads of business owners in USA making 10k a month with good reviews but NO website or losing money in sales and automation";
        await ingestor.startNeuralScan(query);

        console.log("\n📊 Summarizing ghost results...");

        if (!db) {
            console.error("❌ Database not connected. Check DATABASE_URL in .env");
            return;
        }

        const leads = await db.select()
            .from(prospects)
            .where(eq(prospects.userId, userId))
            .limit(500);

        if (leads.length === 0) {
            console.log("⚠️ Scan completed but no ghost leads were captured.");
            return;
        }

        console.log(`✅ Extracted ${leads.length} high-intent ghost leads.`);

        const headers = ['Entity', 'Email', 'Phone', 'Location', 'Website', 'Intensity', 'Source'];
        const rows = leads.map(l => [
            l.entity,
            l.email,
            l.phone || '',
            l.location || '',
            l.website || 'GHOST',
            l.metadata?.temperature || 'HOT',
            l.source
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        fs.writeFileSync('ghost_leads_500.csv', csvContent);

        console.log("\n📁 Results saved to 'ghost_leads_500.csv'");

    } catch (error) {
        console.error("❌ Ghost extraction failed:", error);
    }
}

extractLeads().then(() => {
    process.exit(0);
});
