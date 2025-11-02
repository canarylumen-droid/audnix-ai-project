
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function setup() {
  console.log('🚀 Setting up Audnix AI CRM...\n');

  // Check environment variables
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.log('\n📝 Add these to Replit Secrets');
    process.exit(1);
  }

  console.log('✅ Environment variables configured\n');

  // Run migrations
  console.log('🗄️  Running database migrations...\n');
  
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`  ⏳ Running ${file}...`);

    try {
      await db.execute(sqlContent as any);
      console.log(`  ✅ ${file} complete`);
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === '42P07') {
        console.log(`  ⏭️  ${file} (already exists)`);
      } else {
        console.error(`  ❌ ${file} failed:`, error.message);
      }
    }
  }

  console.log('\n✅ Database migrations complete!');
  console.log('🎉 Audnix AI CRM is ready to use!\n');
  console.log('📋 Next steps:');
  console.log('   1. Add API keys to Secrets (OpenAI, Stripe, etc.)');
  console.log('   2. Click Run to start the server');
  console.log('   3. Visit your Repl URL to see the app');
}

setup().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
