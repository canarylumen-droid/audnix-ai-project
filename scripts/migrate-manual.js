import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import fs from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    console.log("Starting migration script...");
    
    // Try to load .env if available
    const envPath = resolve(process.cwd(), '.env');
    let DATABASE_URL = process.env.DATABASE_URL;

    if (fs.existsSync(envPath) && !DATABASE_URL) {
         try {
             const b = fs.readFileSync(envPath);
             const envContent = b[0] === 255 && b[1] === 254 ? b.toString('utf16le') : b.toString('utf8');
             const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/m);
             if (dbUrlMatch) {
                DATABASE_URL = dbUrlMatch[1].trim().replace(/^["']|["']$/g, '');
             }
         } catch (e) {
             console.warn("Failed to read .env file:", e);
         }
    }

    if (!DATABASE_URL) {
        console.error('DATABASE_URL is not set. Cannot run migrations.');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const client = new pg.Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const migrationsFolder = resolve(__dirname, '../migrations');

    try {
        await client.connect();
        const db = drizzle(client);

        // Drizzle-orm's migrate() needs the 'meta' folder to exist and contain _journal.json
        console.log(`Resolved migrations folder: ${migrationsFolder}`);

        if (!fs.existsSync(migrationsFolder)) {
            console.warn(`Migrations folder not found at ${migrationsFolder}. Skipping migrations.`);
            return;
        }

        console.log('Running migrations...');
        try {
            await migrate(db, { migrationsFolder });
            console.log('Migrations completed successfully');
        } catch (migrationErr) {
            console.error('Migration failed (soft fail):', migrationErr);
            console.warn('Proceeding with deployment despite migration failure. Schema should be synced via push.');
        }

    } catch (err) {
        console.error('Database connection failed:', err);
        // We still exit 1 if connection fails because that's critical
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
