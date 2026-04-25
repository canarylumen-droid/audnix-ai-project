import "dotenv/config";
import { db } from "./server/db.js";
import { integrations } from "./shared/schema.js";

async function check() {
  const url = process.env.DATABASE_URL || "";
  const maskedUrl = url.replace(/:[^:@]+@/, ":****@");
  console.log(`Database URL: ${maskedUrl}`);
  
  const all = await db.select().from(integrations);
  console.log(`Total integrations in DB: ${all.length}`);
  for (const i of all) {
    console.log(`- ID: ${i.id}, Provider: ${i.provider}, Connected: ${i.connected}`);
  }
  process.exit(0);
}

check();
