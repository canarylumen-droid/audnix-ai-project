import googleIt from 'google-it';
import { AdvancedCrawler } from './server/lib/scraping/crawler-service.js';

async function testWithGoogleIt() {
    console.log("🚀 ATTEMPTING DIRECT GOOGLE EXTRACTION (Via google-it library)...");

    try {
        const results = await googleIt({
            query: 'site:instagram.com "AI Automation Agency" "@gmail.com"',
            limit: 50,
            'no-display': true
        });

        console.log(`\n✅ Google-it returned ${results.length} results.`);

        const crawler = new AdvancedCrawler(() => { });
        const leads = results.map(r => {
            const emailMatch = (r.snippet + r.title).match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}/gi);
            return {
                entity: r.title.split('-')[0].trim(),
                website: r.link,
                email: emailMatch ? emailMatch[0] : 'N/A',
                snippet: r.snippet
            };
        }).filter(l => l.email !== 'N/A');

        console.log("\n--- REAL-TIME SCRAPED LEADS ---");
        leads.forEach((l, i) => {
            console.log(`${i + 1}. NAME: ${l.entity} | EMAIL: ${l.email} | LINK: ${l.website}`);
        });

        if (leads.length === 0) {
            console.log("⚠️ Still no direct emails found in snippets. Google is strictly filtering PII in snippets.");
        }
        console.log("--- END DATA ---");

    } catch (error) {
        console.error("Scraping failed:", error);
    }
}

testWithGoogleIt();
