import { sendEmail } from './server/lib/channels/email.ts';
import { storage } from './server/storage.ts';

async function main() {
  const userId = '7e06031e-09ec-4558-abe1-ac853c5093a9';
  const recipient = 'canarylumen@gmail.com';
  
  console.log(`Starting live test for ${recipient}...`);
  
  const leads = await storage.getLeads({ userId, search: recipient });
  let lead = leads.find(l => l.email === recipient);
  
  if (!lead) {
    console.log('Creating lead...');
    lead = await storage.createLead({
      userId,
      name: 'Test Lead',
      email: recipient,
      channel: 'email',
      status: 'new'
    });
  }

  console.log(`Triggering sendEmail for lead ID: ${lead.id}...`);
  try {
    await sendEmail(userId, lead.id, 'URGENT: Live Test Sync Check', 'Hello! This is a real email sent from your Audnix dashboard to verify: \n1. Outbound delivery\n2. Sent folder sync\n3. Tracking pixel injection\n\nPlease reply to this email once you receive it.', true);
    console.log('✅ LIVE EMAIL SENT SUCCESSFULLY');
  } catch (error) {
    console.error('❌ FAILED TO SEND EMAIL:', error);
    process.exit(1);
  }
  process.exit(0);
}

main();
