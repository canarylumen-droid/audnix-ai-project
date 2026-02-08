import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getDatabase } from './server/db.js';
import { leads, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function importLeads() {
    const db = getDatabase();
    if (!db) {
        console.error("❌ No database connection");
        process.exit(1);
    }

    // 1. Get User
    const targetEmail = 'canarylumen1@gmail.com';
    const [user] = await db.select().from(users).where(eq(users.email, targetEmail));
    if (!user) {
        console.error(`❌ User ${targetEmail} not found!`);
        process.exit(1);
    }
    console.log(`✅ Using User ID: ${user.id} `);

    // 2. Read CSV
    const csvPath = 'c:/Users/DELL 3189/Downloads/Lead-finder/leads_with_emails.csv';
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV file not found at ${csvPath} `);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const records = lines.slice(1).map(line => {
        // Simple CSV parser for quoted fields
        const record: any = {};
        let currentField = '';
        let inQuotes = false;
        let fieldIndex = 0;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                record[header[fieldIndex]] = currentField.trim();
                currentField = '';
                fieldIndex++;
            } else {
                currentField += char;
            }
        }
        record[header[fieldIndex]] = currentField.trim();
        return record;
    });

    console.log(`📊 Total records in CSV: ${records.length} `);

    // 3. Filter and Ingest
    let importedCount = 0;
    for (const record of records) {
        const reviews = parseInt(record.reviews) || 0;

        // Filter: reviews <= 120
        if (reviews <= 120) {
            try {
                await db.insert(leads).values({
                    userId: user.id,
                    name: record.name,
                    company: record.name, // Using name as company if not explicitly separate
                    email: record.email || null,
                    phone: record.phone || null,
                    channel: 'email',
                    status: 'new',
                    metadata: {
                        website: record.website,
                        address: record.address,
                        rating: record.rating,
                        reviews: record.reviews,
                        query: record.query,
                        googleMapsUrl: record.url,
                        importedFrom: 'leads_with_emails.csv'
                    }
                });
                importedCount++;
            } catch (err: any) {
                console.error(`❌ Failed to import ${record.name}: `, err.message);
            }
        }
    }

    console.log(`✅ Imported ${importedCount} leads successfully.`);
    process.exit(0);
}

importLeads().catch(err => {
    console.error(err);
    process.exit(1);
});
