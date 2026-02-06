
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// THE CORRECT DATABASE CONNECTION (Prefer Env Var)
const RAW_CONNECTION_STRING = process.env.DATABASE_URL;

if (!RAW_CONNECTION_STRING) {
    console.error('❌ DATABASE_URL environment variable is missing!');
    process.exit(1);
}

// Normalize connection string for SSL compatibility
const dbUrl = new URL(RAW_CONNECTION_STRING);
if (RAW_CONNECTION_STRING.includes('neon.tech')) {
    dbUrl.searchParams.set('sslmode', 'require');
}
const CONNECTION_STRING = dbUrl.toString();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log('🔌 Connecting to database...');

    const pool = new Pool({
        connectionString: CONNECTION_STRING,
        ssl: RAW_CONNECTION_STRING.includes('neon.tech') ? { 
            rejectUnauthorized: false,
        } : false
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
            const sqlStr = fs.readFileSync(path.join(migrationDir, file), 'utf8');
            try {
                // Split script into individual statements to handle errors gracefully
                const statements = sqlStr.split(';').filter(s => s.trim().length > 0);
                for (const statement of statements) {
                    try {
                        await pool.query(statement);
                    } catch (stmtErr) {
                        if (!stmtErr.message.includes('already exists') && !stmtErr.message.includes('duplicate')) {
                            console.log(`   ⚠️  Statement Error in ${file}: ${stmtErr.message}`);
                        }
                    }
                }
                console.log(`   ✅ Processed ${file}`);
            } catch (err) {
                console.log(`   ⚠️  Critical Error in ${file}: ${err.message}`);
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
