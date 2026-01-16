import { AdvancedCrawler } from './server/lib/scraping/crawler-service.js';
import dotenv from 'dotenv';

dotenv.config();

async function runProductionTest() {
    console.log("🚀 INITIALIZING NEURAL EXTRACTION: 100 AI/Automation Agency Owners...");

    // Force proxy mesh usage
    process.env.USE_PROXIES = 'true';

    const crawler = new AdvancedCrawler((text, type) => {
        // Only log critical status to keep output clean for the user
        if (type === 'success' || type === 'error' || type === 'info') {
            console.log(`[${type.toUpperCase()}] ${text}`);
        }
    });

    try {
        const niche = "AI Automation Agency Owner 'sales dm' 'ai agents'";
        const location = "Global";
        const limit = 150; // Fetch slightly more to account for filtering

        const leads = await crawler.discoverLeads(niche, location, limit);

        // Filter for leads that actually have an extracted email
        const verifiedLeads = leads
            .filter(l => l.email && (l.email.includes('@')))
            .slice(0, 100);

        console.log("\n--- START RAW EXTRACTION DATA ---");
        if (verifiedLeads.length > 0) {
            verifiedLeads.forEach((l, i) => {
                console.log(`${i + 1}. NAME: ${l.entity} | EMAIL: ${l.email} | SOURCE: ${l.source}`);
            });
        } else {
            console.log("⚠️ No immediate matches found in primary index. Sources are heavily throttled or niche is ultra-specific.");
            console.log("Check PROXY_URL or connectivity.");
        }
        console.log("--- END RAW EXTRACTION DATA ---\n");

    } catch (error) {
        console.error("Critical extraction failure:", error);
    }
}

runProductionTest();
