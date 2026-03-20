
import "dotenv/config";
import { db } from "./server/db.js";
import { integrations } from "./shared/schema.js";
import * as fs from "fs";

async function diagnose() {
  let output = "";
  try {
    const allIntegrations = await db.select().from(integrations);
    output += `Found ${allIntegrations.length} integrations.\n`;
    
    for (const integration of allIntegrations) {
      const meta = integration.encryptedMeta;
      const parts = meta.split(':');
      output += `ID: ${integration.id}, Provider: ${integration.provider}, Parts: ${parts.length}, Length: ${meta.length}, Connected: ${integration.connected}\n`;
      if (parts.length !== 3) {
        output += `  INVALID FORMAT: "${meta}"\n`;
      }
    }
    fs.writeFileSync("diag_out.txt", output, "utf-8");
    process.exit(0);
  } catch (error) {
    console.error("Diagnosis failed:", error);
    process.exit(1);
  }
}

diagnose();
