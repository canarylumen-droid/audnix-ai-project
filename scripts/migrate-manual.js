
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

        // Read migration file
        console.log('📖 Reading migration file...');
        const migrationFile = path.join(__dirname, '..', 'migrations', '030_complete_schema.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        // Run migration
        console.log('🚀 Executing migration...');

        await pool.query(sql);

        console.log('✨ Migration applied successfully!');

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
