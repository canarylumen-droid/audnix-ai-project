import 'dotenv/config';
import { db } from './server/db.js';
import { sql, eq, or, isNull } from 'drizzle-orm';
import { users, integrations } from './shared/schema.js';

async function checkDataSanity() {
  console.log('--- Data Sanity Audit ---');
  
  // 1. Check for users with missing plan/tier
  const usersWithMissingPlans = await db.select().from(users).where(
    or(
      isNull(users.plan),
      isNull(users.subscriptionTier)
    )
  );
  
  if (usersWithMissingPlans.length > 0) {
    console.log(`❌ Found ${usersWithMissingPlans.length} users with missing plan/tier. Fixing...`);
    for (const user of usersWithMissingPlans) {
      await db.update(users).set({ 
        plan: user.plan || 'trial',
        subscriptionTier: user.subscriptionTier || 'free'
      }).where(eq(users.id, user.id));
    }
    console.log('✅ Users plan/tier sanity fixed.');
  } else {
    console.log('✅ All users have valid plan/tier values.');
  }

  // 2. Check for integrations with missing critical fields
  const integrationsWithMissingFields = await db.select().from(integrations).where(
    or(
      isNull(integrations.dailyLimit),
      isNull(integrations.healthStatus),
      isNull(integrations.reputationScore)
    )
  );

  if (integrationsWithMissingFields.length > 0) {
    console.log(`❌ Found ${integrationsWithMissingFields.length} integrations with missing fields. Fixing...`);
    for (const integration of integrationsWithMissingFields) {
      await db.update(integrations).set({
        dailyLimit: integration.dailyLimit ?? 50,
        healthStatus: integration.healthStatus ?? 'connected',
        reputationScore: integration.reputationScore ?? 100
      }).where(eq(integrations.id, integration.id));
    }
    console.log('✅ Integrations fields sanity fixed.');
  } else {
    console.log('✅ All integrations have valid critical fields.');
  }

  console.log('\n✅ Data integrity check complete.');
}

checkDataSanity().catch(console.error);
