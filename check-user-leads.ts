import 'dotenv/config';
import { db } from './server/db.js';
import { leads } from './shared/schema.js';
import { eq, sql } from 'drizzle-orm';

async function checkUserLeads() {
    const userId = 'eaca30fe-3231-48f5-89f8-fc947315bf7a';
    const totalCount = await db.select({ count: sql`count(*)` })
        .from(leads)
        .where(eq(leads.userId, userId));
    
    console.log(`User ${userId} has ${totalCount[0].count} leads.`);
    
    const statusCounts = await db.select({
        status: leads.status,
        count: sql`count(*)`
    })
    .from(leads)
    .where(eq(leads.userId, userId))
    .groupBy(leads.status);
    
    console.log('\nLeads by Status:');
    statusCounts.forEach(sc => {
        console.log(`${sc.status}: ${sc.count}`);
    });
}

checkUserLeads().catch(console.error);
