import 'dotenv/config';
import { getDatabase } from './server/db.js';
import { prospects, users } from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function check() {
    const db = getDatabase();
    if (!db) {
        console.error("No DB connection");
        return;
    }
    const pc = await db.select({ count: sql`count(*)` }).from(prospects);
    const uc = await db.select({ id: users.id, username: users.username }).from(users).limit(5);
    console.log("PROSPECTS_COUNT:", pc[0].count);
    console.log("USERS:", JSON.stringify(uc));
}

check().catch(console.error);
