import { getDatabase } from "../server/db.js";
import { prospects } from "../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { EmailVerifier } from "../server/lib/scraping/email-verifier.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_LATEST_MODEL } from "../server/lib/ai/model-config.js";
import 'dotenv/config';

async function performIntensiveCleanup() {
    console.log("🚀 Starting Intensive Database Cleanup...");
    const db = getDatabase();
    if (!db) {
        console.error("❌ Database connection failed");
        return;
    }

    const verifier = new EmailVerifier();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: GEMINI_LATEST_MODEL });

    // 1. Fetch all leads
    const allLeads = await db.select().from(prospects);
    console.log(`📊 Found ${allLeads.length} leads in database.`);

    let validCount = 0;
    let removedCount = 0;
    let domainFixedCount = 0;

    for (const lead of allLeads) {
        try {
            console.log(`\n🔍 Verifying: ${lead.entity} (${lead.email})`);

            // --- STEP 1: SMTP HANDSHAKE ---
            console.log("   ⚡ Performing SMTP Handshake...");
            const verification = await verifier.verify(lead.email);

            if (!verification.valid) {
                console.log(`   ❌ REJECTED: ${verification.reason}`);
                await db.delete(prospects).where(eq(prospects.id, lead.id));
                removedCount++;
                continue;
            }

            // --- STEP 2: DOMAIN VERIFICATION & AI AUDIT ---
            if (lead.website) {
                console.log(`   🌐 Auditing Domain: ${lead.website}`);

                const prompt = `
                    Analyze this business and its website:
                    ENTITY: ${lead.entity}
                    WEBSITE: ${lead.website}
                    
                    Does this website correctly belong to this business? 
                    Some leads might have wrong TLDs (e.g. .co instead of .org).
                    If the website is WRONG, suggest the CORRECT one if you are certain.
                    
                    Return as JSON:
                    {
                        "is_correct": boolean,
                        "suggested_website": "string | null",
                        "reason": "string"
                    }
                `;

                try {
                    const result = await model.generateContent(prompt);
                    const audit = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

                    if (!audit.is_correct) {
                        if (audit.suggested_website) {
                            console.log(`   ⚠️ CORRECTING DOMAIN: ${lead.website} -> ${audit.suggested_website}`);
                            await db.update(prospects)
                                .set({
                                    website: audit.suggested_website,
                                    metadata: { ...(lead.metadata as any), domain_audit: audit }
                                })
                                .where(eq(prospects.id, lead.id));
                            domainFixedCount++;
                        } else {
                            console.log(`   ❌ INVALID DOMAIN: ${audit.reason}`);
                            await db.delete(prospects).where(eq(prospects.id, lead.id));
                            removedCount++;
                            continue;
                        }
                    } else {
                        console.log("   ✅ Domain Verified");
                    }
                } catch (e) {
                    console.warn("   ⚠️ AI Domain Audit failed, skipping to next step.");
                }
            }

            // If it survived, update status
            await db.update(prospects)
                .set({
                    status: 'verified',
                    verified: true,
                    verifiedAt: new Date(),
                    leadScore: Math.max(lead.leadScore || 0, 50) // Ensure floor of 50
                })
                .where(eq(prospects.id, lead.id));

            validCount++;
            console.log("   ✅ Lead Hardened & Verified.");

        } catch (err) {
            console.error(`   ❌ Error verifying ${lead.email}:`, err);
        }
    }

    console.log(`\n✨ CLEANUP COMPLETE ✨`);
    console.log(`✅ Leads Hardened: ${validCount}`);
    console.log(`🛠️ Domains Fixed: ${domainFixedCount}`);
    console.log(`🗑️ Invalid Leads Removed: ${removedCount}`);
    process.exit(0);
}

performIntensiveCleanup().catch(err => {
    console.error("Fatal Cleanup Error:", err);
    process.exit(1);
});
