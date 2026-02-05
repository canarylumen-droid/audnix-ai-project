import { DrizzleStorage } from './server/drizzle-storage.js';
import { sendEmail } from './server/lib/channels/email.js';

async function triggerTest() {
  const userId = '7e06031e-09ec-4558-abe1-ac853c5093a9';
  const leadEmail = 'canarylumen@gmail.com';
  
  // Use DrizzleStorage directly to ensure local connection works
  const storage = new DrizzleStorage();
  
  const leads = await storage.getLeads({ userId, search: leadEmail });
  let lead = leads.find(l => l.email === leadEmail);
  
  if (!lead) {
    console.log(`Lead ${leadEmail} not found, creating...`);
    lead = await storage.createLead({
      userId,
      name: 'Test Lead',
      email: leadEmail,
      channel: 'email',
      status: 'new'
    });
  }

  console.log(`Sending test email to ${leadEmail} (Lead ID: ${lead.id})...`);
  await sendEmail(userId, lead.id, 'Test Email: IMAP Sync Check', 'Hello! This is a test email sent to verify real-time IMAP sync, "Sent" folder reflection, and read/opened tracking. Please reply to this to test inbound sync.', true);
  console.log('✅ Test email sent successfully.');
  process.exit(0);
}

triggerTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
