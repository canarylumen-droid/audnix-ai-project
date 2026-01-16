import 'dotenv/config';
import { getDatabase } from './server/db.js';
import { prospects } from './shared/schema.js';
import { sql, desc } from 'drizzle-orm';

async function verify() {
    const db = getDatabase();
    if (!db) {
        console.error("No DB connection");
        return;
    }

    const countResult = await db.select({ count: sql`count(*)` }).from(prospects);
    console.log(`\n📊 FINAL VERIFICATION`);
    console.log(`Total Leads in Database: ${countResult[0].count}`);

    console.log(`\n📋 SAMPLE LEADS (LAST 5):`);
    const sampleLeads = await db.select().from(prospects).orderBy(desc(prospects.createdAt)).limit(5);

    sampleLeads.forEach(l => {
        console.log(`- ${l.entity} | ${l.email} | ${l.industry} | Score: ${l.leadScore}`);
    });

    const nicheCounts = await db.select({
        industry: prospects.industry,
        count: sql`count(*)`
    }).from(prospects).groupBy(prospects.industry);

    console.log(`\n📈 DISTRIBUTION BY NICHE:`);
    nicheCounts.forEach(nc => {
        console.log(`${nc.industry}: ${nc.count}`);
    });
}

verify().catch(console.error);
