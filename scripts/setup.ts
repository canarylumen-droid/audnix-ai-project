// @ts-nocheck
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in environment variables');
    console.log('\n📋 Setup Instructions:');
    console.log('1. Go to https://supabase.com and create a project');
    console.log('2. Get your DATABASE_URL from Settings → Database');
    console.log('3. Add it to Replit Secrets as DATABASE_URL');
    console.log('4. Run this script again\n');
    process.exit(1);
  }

  console.log('🚀 Starting Audnix AI Database Setup...\n');

  try {
    const client = postgres(databaseUrl, { max: 1 });
    const db = drizzle(client, { schema });

    console.log('✅ Connected to database');

    // Read and execute migration files in order
    const migrationsDir = path.join(process.cwd(), 'migrations');
    // Read and execute migration files in order
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('📦 Running migrations...\n');

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);

      if (fs.existsSync(filePath)) {
        console.log(`   Executing ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf-8');

        try {
          await client.unsafe(sql);
          console.log(`   ✅ ${file} completed`);
        } catch (error: any) {
          if (error.message?.includes('already exists')) {
            console.log(`   ⚠️  ${file} - tables already exist, skipping`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n🎉 Audnix AI is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Set up your API keys in Replit Secrets');
    console.log('2. Start the server with the Run button');
    console.log('3. Visit your Repl URL to see the landing page\n');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.log('\n📋 Manual Setup:');
    console.log('1. Copy the contents of migrations/000_SETUP_SUPABASE.sql');
    console.log('2. Go to your Supabase project → SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Repeat for all migration files in order\n');
    process.exit(1);
  }
}

setupDatabase();
