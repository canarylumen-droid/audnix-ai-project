import "dotenv/config";
import { db } from "./server/db.js";
import { integrations } from "./shared/schema.js";
import { inArray } from "drizzle-orm";

async function deleteDummy() {
  try {
    const dummyIds = [
      "00000000-0000-4000-a000-000000000003",
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ];
    
    console.log("Deleting dummy integrations:", dummyIds);
    await db.delete(integrations).where(inArray(integrations.id, dummyIds));
    console.log("Deleted successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to delete records:", error);
    process.exit(1);
  }
}

deleteDummy();
