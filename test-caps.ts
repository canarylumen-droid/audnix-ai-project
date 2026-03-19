process.env.REDIS_URL = '';
import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';
import { mailboxHealthService } from './server/lib/email/mailbox-health-service.js';

async function test() {
  const mb2Id = '00000000-0000-0000-0000-000000000002';
  
  console.log('Testing getMailboxCapacities...');
  try {
    const caps = await mailboxHealthService.getMailboxCapacities([mb2Id]);
    console.log('SUCCESS:', JSON.stringify(Array.from(caps.entries())));
  } catch (e: any) {
    console.error('FULL ERROR:', e.message);
    console.error('STACK:', e.stack?.split('\n').slice(0, 5).join('\n'));
  }
  process.exit(0);
}
test();
