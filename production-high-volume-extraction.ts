import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { AudnixIngestor } from './server/lib/scraping/audnix-ingestor.js';
import { getDatabase } from './server/db.js';
import { users, prospects } from './shared/schema.js';
import { sql, eq } from 'drizzle-orm';

async function main() {
    console.log("🚀 INITIALIZING HIGH-VOLUME LEAD EXTRACTION (1,000+ TARGET)...");

    // Ensure .env is explicitly loaded if not already
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
    } catch (e) { }

    const db = getDatabase();
    if (!db) {
        console.error("❌ Database connection failed. Check DATABASE_URL.");
        process.exit(1);
    }

    // 1. Ensure we have a user to attach leads to
    let user = (await db.select().from(users).limit(1))[0];
    if (!user) {
        console.log("🌱 Creating initial admin user for lead attachment...");
        const [newUser] = await db.insert(users).values({
            email: 'admin@audnixai.com',
            username: 'admin',
            name: 'Admin',
            plan: 'pro',
            timezone: 'America/New_York'
        }).returning();
        user = newUser;
    }
    console.log(`👤 Using User: ${user.username} (${user.id})`);

    const ingestor = new AudnixIngestor(user.id);

    // Override log for clean console output
    (ingestor as any).log = async (text: string, type: string) => {
        const symbol = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : (type === 'error' ? '❌' : 'ℹ️'));
        console.log(`${symbol} [${type.toUpperCase()}] ${text}`);
    };

    // Nicar-precise target groups requested by user
    const nicheRequests = [
        "Creators in Sales and AI Automation Global",
        "DM Automations Experts and Agencies",
        "Lead Generation Service Providers",
        "AI Outreach and Sales Systems Creators"
    ];

    console.log(`🎯 TARGETING: ${nicheRequests.join(", ")}`);
    console.log(`📊 EXPECTED VOLUME: 250+ per category`);

    for (const niche of nicheRequests) {
        console.log(`\n🌀 ACTIVATING NEURAL SCAN: ${niche}...`);
        try {
            // We hint the volume in the query to trigger high-volume mode in Gemni/Parser
            await ingestor.startNeuralScan(`${niche} - get 500 leads`);
        } catch (err) {
            console.error(`❌ Error scanning niche [${niche}]:`, err);
        }
    }

    // Final Statistics
    const pc = await db.select({ count: sql`count(*)` }).from(prospects).where(eq(prospects.userId, user.id));
    console.log(`\n==================================================`);
    console.log(`🎉 HIGH-VOLUME EXTRACTION COMPLETE!`);
    console.log(`📊 TOTAL LEADS REGISTERED: ${pc[0].count}`);
    console.log(`📈 NICHES COVERED: Sales Automation, DM Automation, AI Creators, Lead Gen`);
    console.log(`==================================================\n`);

    // Export to CSV for user convenience
    try {
        const allLeads = await db.select().from(prospects).where(eq(prospects.userId, user.id));
        if (allLeads.length > 0) {
            const headers = ['Entity', 'Email', 'Source', 'Website', 'Industry', 'Lead Score'];
            const rows = allLeads.map(l => [
                l.entity.replace(/,/g, ' '),
                l.email,
                l.source || 'unknown',
                l.website || '',
                l.industry || '',
                l.leadScore
            ]);
            const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
            fs.writeFileSync('production_leads_1000.csv', csv);
            console.log(`📁 Exported all leads to 'production_leads_1000.csv'`);
        }
    } catch (err) {
        console.error("❌ CSV Export failed:", err);
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
