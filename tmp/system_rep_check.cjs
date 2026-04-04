
const pg = require('pg');
require('dotenv').config();

async function checkAllReputation() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const res = await client.query(`
        SELECT u.email as user_email, i.provider, i.reputation_score, i.warmup_status, i.daily_limit, i.connected
        FROM integrations i 
        JOIN users u ON i.user_id = u.id
        WHERE i.provider IN ('gmail', 'outlook', 'custom_email')
    `);

    console.log('--- System-Wide Reputation Report ---');
    if (res.rows.length === 0) {
      console.log('No email mailboxes found in the system.');
    } else {
      res.rows.forEach(m => {
        const score = m.reputation_score !== null ? m.reputation_score : 100;
        let status = 'Excellent 🟢';
        if (score < 40) status = 'Critical 🔴 (Paused)';
        else if (score < 70) status = 'Caution 🟠 (Throttled)';
        else if (score < 90) status = 'Good 🟡';

        console.log(`- User: ${m.user_email}`);
        console.log(`  Mailbox: ${m.provider} (Connected: ${m.connected})`);
        console.log(`  Health Score: ${score}/100`);
        console.log(`  Status: ${status}`);
        console.log('----------------------------');
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkAllReputation();
