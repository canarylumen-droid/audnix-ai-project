
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

/**
 * Robustly splits SQL string into statements, respecting:
 * - Single quotes ('string')
 * - Dollar quotes ($$ block $$) - specific tag support omitted for simplicity but handles standard $$
 * - Comments (-- line, / * block * /)
 */
function splitSql(sql) {
    const statements = [];
    let buffer = '';
    let inDollarBlock = false;
    let inSingleQuote = false;
    let inLineComment = false;
    let inBlockComment = false;

    // Iterate character by character
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1] || '';

        // -- 1. Handle Line Comments --
        if (inLineComment) {
            if (char === '\n') inLineComment = false;
            buffer += char;
            continue;
        }

        // -- 2. Handle Block Comments --
        if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                buffer += '*/';
                i++; // skip /
            } else {
                buffer += char;
            }
            continue;
        }

        // -- 3. Handle Single Quotes --
        if (inSingleQuote) {
            if (char === "'") {
                if (nextChar === "'") { // Escaped quote via doubling
                    buffer += "''";
                    i++; // skip next '
                } else {
                    inSingleQuote = false; // End quote
                    buffer += "'";
                }
            } else {
                buffer += char;
            }
            continue;
        }

        // -- 4. Handle Dollar Quotes ($$) --
        // Note: This matches standard $$ markers. Named tags like $func$ are not deeply supported 
        // to keep this script lightweight, but most migrations use plain $$.
        if (inDollarBlock) {
            if (char === '$' && nextChar === '$') {
                inDollarBlock = false;
                buffer += '$$';
                i++; // skip next $
            } else {
                buffer += char;
            }
            continue;
        }

        // -- Check for Start of Comments --
        if (char === '-' && nextChar === '-') {
            inLineComment = true;
            buffer += '--';
            i++;
            continue;
        }
        if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            buffer += '/*';
            i++;
            continue;
        }

        // -- Check for Start of Single Quote --
        if (char === "'") {
            inSingleQuote = true;
            buffer += "'";
            continue;
        }

        // -- Check for Start of Dollar Quote --
        if (char === '$' && nextChar === '$') {
            inDollarBlock = true;
            buffer += '$$';
            i++;
            continue;
        }

        // -- Split on Semicolon (if not in any block) --
        if (char === ';') {
            if (buffer.trim()) {
                statements.push(buffer.trim());
            }
            buffer = '';
            continue;
        }

        buffer += char;
    }

    // Push remaining buffer
    if (buffer.trim()) {
        statements.push(buffer.trim());
    }

    return statements;
}

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
                // Use robust splitter
                const statements = splitSql(sqlStr);

                for (const statement of statements) {
                    try {
                        await pool.query(statement);
                    } catch (stmtErr) {
                        // Ignore harmless "exists" errors
                        const isDuplicate = stmtErr.message.includes('already exists') ||
                            stmtErr.message.includes('duplicate') ||
                            stmtErr.code === '42710' || // duplicate_object
                            stmtErr.code === '42P07';   // duplicate_table

                        if (!isDuplicate) {
                            console.log(`   ⚠️  Statement Error in ${file}:`);
                            console.log(`      Error: ${stmtErr.message}`);
                            console.log(`      Snippet: ${statement.substring(0, 100)}...`);
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
