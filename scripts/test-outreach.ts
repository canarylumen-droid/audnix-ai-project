
import { storage } from '../server/storage.js';
import { runDemoOutreach } from '../server/lib/outreach/outreach-runner.js';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("🔍 Checking configuration...");

  // 1. Find the user
  // Try to find a user with the email 'canarylumen1@gmail.com' or just the first user
  let user = await storage.getUserByEmail('canarylumen1@gmail.com');
  if (!user) {
    console.log("User 'canarylumen1@gmail.com' not found. Fetching first user...");
    const result = await db.execute(sql`SELECT * FROM users LIMIT 1`);
    if (result.rows.length > 0) {
      user = result.rows[0] as any;
      console.log(`Found user: ${user.email} (${user.id})`);
    } else {
      console.error("❌ No users found in database.");
      process.exit(1);
    }
  } else {
    console.log(`✅ Found user: ${user.email}`);
  }

  // 2. Check SMTP Integration
  const integration = await storage.getIntegration(user.id, 'custom_email');
  if (!integration || !integration.connected) {
    console.error("❌ SMTP not configured/connected for this user.");
    console.log("Current integration status:", integration);
    
    // Check if there are ANY integrations
    const allIntegrations = await db.execute(sql`SELECT * FROM integrations WHERE user_id = ${user.id}`);
    console.log("All user integrations:", allIntegrations.rows);
    
    process.exit(1);
  }
  console.log("✅ SMTP configured:", integration.settings);

  // 3. Run Outreach Demo
  console.log("\n🚀 Starting Outreach Demo...");
  try {
    const result = await runDemoOutreach(user.id);
    console.log("\n✅ Demo Complete!");
    console.log("Summary:", result.summary);
    console.log("Results:", JSON.stringify(result.results, null, 2));
  } catch (error) {
    console.error("\n❌ Demo Failed:", error);
  }

  process.exit(0);
}

main().catch(console.error);
