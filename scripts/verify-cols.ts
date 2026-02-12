
import pg from 'pg';
import 'dotenv/config';
import fs from 'fs';

async function verify() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    
    const report = [];
    const tables = ['email_messages', 'campaign_leads'];
    
    for (const table of tables) {
        const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        report.push({ table, columns: res.rows.map(r => r.column_name) });
    }
    
    fs.writeFileSync('schema_verify.json', JSON.stringify(report, null, 2));
    client.release();
    await pool.end();
}

verify();
