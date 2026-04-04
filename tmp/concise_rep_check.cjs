
const pg = require('pg');
require('dotenv').config();

const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => client.query('SELECT u.email, i.provider, i.reputation_score, i.connected FROM integrations i JOIN users u ON i.user_id = u.id'))
    .then(res => {
        console.log('REPUTATION_RESULTS:' + JSON.stringify(res.rows));
        process.exit(0);
    })
    .catch(err => {
        console.error('DATABASE_ERROR:' + err.message);
        process.exit(1);
    });
