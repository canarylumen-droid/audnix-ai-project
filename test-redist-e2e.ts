process.env.REDIS_URL = '';
import 'dotenv/config';
import { db } from './server/db.js';
import { integrations, campaignLeads, userOutreachSettings, users } from './shared/schema.js';
import { eq, and, inArray, or } from 'drizzle-orm';
import { mailboxHealthService } from './server/lib/email/mailbox-health-service.js';
import { redistributionWorker } from './server/lib/email/redistribution-worker.js';

async function test() {
  const [user] = await db.select().from(users).limit(1);
  const userId = user.id;
  const mb1Id = '00000000-0000-0000-0000-000000000001';
  const mb2Id = '00000000-0000-0000-0000-000000000002';

  // Ensure auto_redistribute is ON
  await db.update(userOutreachSettings).set({ autoRedistribute: true }).where(eq(userOutreachSettings.userId, userId));
  console.log('[1] autoRedistribute set to TRUE');

  // Step 1: getActiveMailboxes
  const active = await mailboxHealthService.getActiveMailboxes(userId);
  console.log(`[2] Active mailboxes: ${active.length}`);
  active.forEach(m => console.log(`    ${m.id} provider=${m.provider} health=${m.healthStatus}`));

  // Step 2: getMailboxCapacities
  const mbIds = active.map(m => m.id);
  const caps = await mailboxHealthService.getMailboxCapacities(mbIds);
  console.log(`[3] Capacities: ${JSON.stringify(Array.from(caps.entries()))}`);

  // Step 3: Check stranded leads
  const stranded = await db.select().from(campaignLeads).where(
    and(eq(campaignLeads.integrationId, mb1Id), or(eq(campaignLeads.status, 'pending'), eq(campaignLeads.status, 'queued')))
  );
  console.log(`[4] Stranded leads on mb1: ${stranded.length}`);
  stranded.forEach(l => console.log(`    ${l.id} status=${l.status}`));

  // Step 4: Call redistributeForUser directly
  const failedMbs = [{ id: mb1Id, userId, provider: 'custom_email' }];
  console.log('[5] Calling redistributeForUser...');
  try {
    const count = await redistributionWorker.redistributeForUser(userId, failedMbs);
    console.log(`[6] Result: ${count} leads redistributed`);
  } catch(e: any) {
    console.error(`[6] ERROR: ${e.message}`);
  }

  // Step 5: Check result
  const onMb2 = await db.select().from(campaignLeads).where(eq(campaignLeads.integrationId, mb2Id));
  console.log(`[7] Leads now on mb2: ${onMb2.length}`);

  process.exit(0);
}
test().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
