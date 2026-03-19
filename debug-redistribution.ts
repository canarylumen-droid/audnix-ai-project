process.env.REDIS_URL = '';
import 'dotenv/config';
import { db } from './server/db.js';
import { integrations, campaignLeads, userOutreachSettings, users } from './shared/schema.js';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { mailboxHealthService } from './server/lib/email/mailbox-health-service.js';

async function debug() {
  const [user] = await db.select().from(users).limit(1);
  const userId = user.id;
  const mb2Id = '00000000-0000-0000-0000-000000000002';

  console.log('=== Step 1: getActiveMailboxes ===');
  try {
    const active = await mailboxHealthService.getActiveMailboxes(userId);
    console.log(`Active mailboxes: ${active.length}`);
    active.forEach(m => console.log(`  - ${m.id} provider=${m.provider} health=${m.healthStatus} connected=${m.connected}`));
  } catch (e: any) {
    console.error('getActiveMailboxes ERROR:', e.message);
  }

  console.log('\n=== Step 2: getMailboxCapacities ===');
  try {
    const caps = await mailboxHealthService.getMailboxCapacities([mb2Id]);
    console.log(`Capacities: ${JSON.stringify(Array.from(caps.entries()))}`);
  } catch (e: any) {
    console.error('getMailboxCapacities ERROR:', e.message);
  }

  console.log('\n=== Step 3: Check settings ===');
  const [settings] = await db.select().from(userOutreachSettings).where(eq(userOutreachSettings.userId, userId));
  console.log(`autoRedistribute: ${settings?.autoRedistribute}`);

  console.log('\n=== Step 4: Stranded leads check ===');
  const mb1Id = '00000000-0000-0000-0000-000000000001';
  const stranded = await db.select().from(campaignLeads).where(
    and(
      eq(campaignLeads.integrationId, mb1Id),
      eq(campaignLeads.status, 'pending')
    )
  );
  console.log(`Stranded leads on mb1: ${stranded.length}`);

  process.exit(0);
}

debug().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
