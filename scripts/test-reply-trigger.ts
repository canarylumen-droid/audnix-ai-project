import 'dotenv/config';
import { db } from '../server/db.js';
import { pagedEmailImport } from '../server/lib/imports/paged-email-importer.js';
import { followUpQueue, leads, users } from '../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function runTest() {
    console.log('🧪 Starting Reply AI Trigger Test...');

    // 1. Get a test user (or create one if needed, but we typically have seed data)
    const user = await db.query.users.findFirst();
    if (!user) {
        console.error('❌ No user found in DB. Run seed script first.');
        process.exit(1);
    }
    console.log(`👤 Using user: ${user.email} (${user.id})`);

    // 2. Create/Get a test lead
    const testEmail = `test.lead.${Date.now()}@example.com`;
    console.log(`📧 Creating test lead: ${testEmail}`);

    const [lead] = await db.insert(leads).values({
        userId: user.id,
        email: testEmail,
        name: 'Test Lead',
        channel: 'email',
        status: 'new', // Status that allows auto-reply
        aiPaused: false,
        metadata: { source: 'test_script' }
    }).returning();

    // 3. Simulate an Outbound Message occurring > 2 hours ago (to satisfy the "not recently replied" check)
    // We need to inject a fake message or just ensure the logic allows it.
    // The logic checks: hoursSinceLastOutbound > 2.
    // If there are NO outbound messages, it's Infinity > 2. Good.

    // 4. Simulate Inbound Email
    const inboundEmail = {
        from: testEmail,
        to: user.email,
        subject: 'Interested in your services',
        text: 'Hi, I saw your proposal and I am interested. valid-response', // valid-response might trigger positive sentiment
        date: new Date(),
        messageId: `<${randomUUID()}@example.com>`
    };

    console.log('📨 Simulating inbound email import...');
    const result = await pagedEmailImport(user.id, [inboundEmail], undefined, 'inbound');

    console.log('📊 Import Result:', result);

    if (result.imported === 0) {
        console.error('❌ Email was not imported! Check logs above.');
        process.exit(1);
    }

    // 5. Verify Queue
    console.log('🔍 Checking FollowUpQueue...');

    // Give it a moment for the async operation to finish (though await pagedEmailImport should handle it)
    await new Promise(r => setTimeout(r, 1000));

    const jobs = await db.select().from(followUpQueue)
        .where(eq(followUpQueue.leadId, lead.id))
        .orderBy(desc(followUpQueue.createdAt));

    if (jobs.length > 0) {
        const job = jobs[0];
        console.log(`✅ SUCCESS! Job found in queue:`);
        console.log(`   - ID: ${job.id}`);
        console.log(`   - Status: ${job.status}`);
        console.log(`   - ScheduledAt: ${job.scheduledAt}`);
        console.log(`   - Context:`, job.context);
    } else {
        console.error('❌ FAILURE: No job found in followUpQueue for this lead.');
    }

    console.log('Done.');
    process.exit(0);
}

runTest().catch(console.error);
