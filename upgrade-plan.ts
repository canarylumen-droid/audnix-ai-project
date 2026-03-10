import { config } from "dotenv";
config();
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function upgradeUser() {
  try {
    const email = "team.replyflow@gmail.com";
    const result = await db.update(users)
      .set({ subscriptionTier: "enterprise" })
      .where(eq(users.email, email))
      .returning();
    
    if (result.length > 0) {
      console.log(`Successfully upgraded ${email} to enterprise.`);
    } else {
      console.log(`User ${email} not found.`);
    }
  } catch (error) {
    console.error("Error upgrading user:", error);
  }
  process.exit(0);
}

upgradeUser();
