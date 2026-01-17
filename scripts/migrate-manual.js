
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// THE CORRECT DATABASE CONNECTION (Prefer Env Var, Fallback to Hardcoded for Manual Runs)
const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_y1WCRm9QsVJh@ep-wispy-frost-ahj6lqe0-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log('🔌 Connecting to CORRECT database (ep-wispy-frost)...');

    const pool = new Pool({
        connectionString: CONNECTION_STRING,
        ssl: true
    });

    try {
        // Test connection
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        console.log('✅ Connected successfully at:', res.rows[0].now);
        client.release();

        // Read all migration files
        const migrationDir = path.join(__dirname, '..', 'migrations');
        const files = fs.readdirSync(migrationDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`📦 Found ${files.length} migrations`);

        for (const file of files) {
            console.log(`🚀 Running ${file}...`);
            const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
            try {
                await pool.query(sql);
                console.log(`   ✅ Success`);
            } catch (err) {
                if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                    console.log(`   ℹ️  Skipped (already exists)`);
                } else {
                    console.log(`   ⚠️  Error: ${err.message}`);
                }
            }
        }

        console.log('✨ All migrations processed');

        // Verify tables
        console.log('🔍 Verifying schema...');
        const tableRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log(`📊 Found ${tableRes.rowCount} tables:`);
        tableRes.rows.forEach(r => console.log(` - ${r.table_name}`));

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
