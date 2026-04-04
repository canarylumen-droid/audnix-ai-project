
const pg = require('pg');
require('dotenv').config();

async function checkReputation() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Get the most recent user
    const userRes = await client.query('SELECT id, email FROM users ORDER BY id DESC LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found.');
      return;
    }
    const user = userRes.rows[0];
    console.log(`Checking reputation for user: ${user.email}`);

    // Get integrations
    const intRes = await client.query('SELECT id, provider, reputation_score, warmup_status, daily_limit, encrypted_meta FROM integrations WHERE user_id = $1', [user.id]);
    
    console.log('\n--- Domain Reputation Report ---');
    if (intRes.rows.length === 0) {
      console.log('No mailboxes connected.');
    } else {
      intRes.rows.forEach(m => {
        const score = m.reputation_score !== null ? m.reputation_score : 100;
        let status = 'Excellent 🟢';
        let advice = 'Your domain at peak health. High-volume outreach is safe.';
        
        if (score < 40) {
          status = 'Critical 🔴 (Paused)';
          advice = 'WARNING: Your domain is blacklisted or has high bounce rates. Stop all outreach immediately and start a 2-week warmup.';
        } else if (score < 70) {
          status = 'Caution 🟠 (Throttled)';
          advice = 'ATTENTION: Recent bounces have impacted your score. We have auto-throttled your volume to protect the domain.';
        } else if (score < 90) {
          status = 'Good 🟡';
          advice = 'Domain is healthy. Keep monitor bounce rates below 2%.';
        }

        // Try to get email from meta
        let email = m.provider;
        try {
            const meta = JSON.parse(m.encrypted_meta || '{}');
            email = meta.user || meta.email || m.provider;
        } catch(e) {}

        console.log(`- Mailbox: ${email}`);
        console.log(`  Health Score: ${score}/100`);
        console.log(`  Current Status: ${status}`);
        console.log(`  Daily Limit: ${m.daily_limit}`);
        console.log(`  Advice: ${advice}`);
        console.log('----------------------------');
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkReputation();
