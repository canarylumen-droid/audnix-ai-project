
import 'dotenv/config';
import pg from 'pg';
import { fileURLToPath } from 'url';

async function check() {
    console.log('🔌 Testing Database Connection...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not set');
        process.exit(1);
    }

    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000, // 5s timeout
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected to connection pool');

        const res = await client.query('SELECT NOW() as now');
        console.log('✅ Query successful:', res.rows[0].now);

        console.log('🔍 Checking tables...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('   Tables found:', tables.rows.map(r => r.table_name).join(', '));

        const sessions = await client.query(`SELECT count(*), json_agg(sess) as sessions FROM user_sessions`);
        console.log('   User Sessions count:', sessions.rows[0].count);
        // console.log('   Sample Session:', sessions.rows[0].sessions);

        const users = await client.query(`SELECT count(*) FROM users`);
        console.log('   Users count:', users.rows[0].count);

        client.release();
    } catch (err: any) {
        console.error('❌ Connection failed:', err.message);
        if (err.code) console.error('   Code:', err.code);
    } finally {
        await pool.end();
    }
}

check();
