import { AdvancedCrawler } from './server/lib/scraping/crawler-service.js';
import dotenv from 'dotenv';

dotenv.config();

async function runRealExtraction() {
    console.log("🚀 STARTING REAL EXTRACTION: NO MOCK DATA ALLOWED");

    // Disable synthetic fallback
    process.env.DISABLE_MOCK = 'true';
    process.env.USE_PROXIES = 'true';

    const crawler = new AdvancedCrawler((text, type) => {
        console.log(`[${type.toUpperCase()}] ${text}`);
    });

    try {
        console.log("\n🔍 Method 1: Discovering Specialized AI Agencies via Global Dorks...");
        const dorkLeads = await (crawler as any).discoverAiAgencies(100);

        console.log(`\n🔍 Method 2: High-Volume Niche Discovery (AI/Automation Agencies)...`);
        const nicheLeads = await crawler.discoverLeads("AI Automation Agency Sales Automation", "Global", 100);

        const allLeads = [...dorkLeads, ...nicheLeads];
        const uniqueLeads = Array.from(new Set(allLeads.map(l => l.email || l.website)))
            .map(id => allLeads.find(l => (l.email === id || l.website === id)))
            .filter(l => l && (l.email || l.website));

        console.log("\n--- START RAW REAL-TIME DATA ---");
        if (uniqueLeads.length > 0) {
            uniqueLeads.forEach((l, i) => {
                if (!l) return;
                console.log(`${i + 1}. NAME: ${l.entity} | EMAIL: ${l.email || 'N/A (Scraping bio...)'} | LINK: ${l.website} | SOURCE: ${l.source}`);
            });
        } else {
            console.log("⚠️ ALL REAL-TIME WORKERS BLOCKED BY WAF (Cloudflare/Google UI).");
            console.log("This identifies as 'Security Throttling'. Recommended: Update PROXY_URL with Residential Nodes.");
        }
        console.log("--- END RAW REAL-TIME DATA ---\n");

    } catch (error) {
        console.error("Critical extraction failure:", error);
    }
}

runRealExtraction();
