import "dotenv/config";
import { db } from "./server/db.js";
import { integrations } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import * as fs from "fs";

async function checkUser() {
  try {
    const userId = "4906053c-e00c-40ba-ba1c-1ad132327b06";
    const userIntegrations = await db.select().from(integrations).where(eq(integrations.userId, userId));
    let output = `Found ${userIntegrations.length} integrations for user.\n`;
    for (const int of userIntegrations) {
      output += `ID: ${int.id}, Provider: ${int.provider}, Meta: ${int.encryptedMeta}\n`;
    }
    fs.writeFileSync("user_out.txt", output);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
