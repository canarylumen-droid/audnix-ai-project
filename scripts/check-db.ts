
import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

async function checkDb() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        await client.connect();
        console.log('Connected to database');
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables found:');
        res.rows.forEach(row => console.log(' - ' + row.table_name));

        if (res.rows.some(r => r.table_name === 'users')) {
            const userCount = await client.query('SELECT count(*) FROM users');
            console.log('User count:', userCount.rows[0].count);
        }
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

checkDb();
