import 'dotenv/config';
import { getDatabase } from '../server/db.js';
import { users, integrations, leads } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function verify() {
  const db = getDatabase();
  if (!db) {
    console.error("❌ No database connection");
    process.exit(1);
  }

  const targetEmail = 'canarylumen1@gmail.com';
  console.log(`🔍 Verifying setup for ${targetEmail}...`);

  // 1. Check User
  const [user] = await db.select().from(users).where(eq(users.email, targetEmail));
  if (!user) {
    console.error(`❌ User ${targetEmail} not found!`);
    process.exit(1);
  }
  console.log(`✅ User found: ${user.id}`);

  // 2. Check Integration
  const [integration] = await db.select().from(integrations).where(
    and(
      eq(integrations.userId, user.id),
      eq(integrations.provider, 'custom_email')
    )
  );
  
  if (!integration || !integration.connected) {
    console.warn(`⚠️ SMTP Integration (custom_email) not found or not connected for ${targetEmail}`);
  } else {
    console.log(`✅ SMTP Integration connected.`);
  }

  // 3. Check Leads
  const userLeads = await db.select().from(leads).where(eq(leads.userId, user.id));
  console.log(`📊 Found ${userLeads.length} leads for this user.`);
  
  if (userLeads.length > 0) {
    userLeads.forEach((l, i) => {
      console.log(`   ${i + 1}. ${l.name} (${l.email}) - Status: ${l.status}`);
    });
  }

  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
