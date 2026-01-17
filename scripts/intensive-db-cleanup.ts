import { getDatabase } from "../server/db.js";
import { prospects } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { EmailVerifier } from "../server/lib/scraping/email-verifier.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_LATEST_MODEL } from "../server/lib/ai/model-config.js";
import 'dotenv/config';

async function performIntensiveCleanup() {
    console.log("🚀 Starting Graceful Neural Cleanup...");
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
    let bouncyCount = 0;
    let recoveredCount = 0;
    let domainFixedCount = 0;

    for (const lead of allLeads) {
        try {
            console.log(`\n🔍 Checking: ${lead.entity} (${lead.email})`);

            // --- STEP 1: VERIFICATION ---
            let verification = await verifier.verify(lead.email || "");

            // --- STEP 2: NEURAL RECOVERY (If invalid) ---
            if (!verification.valid && lead.email && lead.website) {
                console.log(`   ⚠️ Invalid Deliverability. Attempting Neural Discovery...`);
                const recoveryPrompt = `
                    BUSINESS: ${lead.entity}
                    CURRENT EMAIL: ${lead.email}
                    WEBSITE: ${lead.website}
                    
                    The current email failed deliverability (No MX or Rejection). 
                    Use your knowledge to find or correct the likely valid business email.
                    Common issues: Wrong TLD (.co instead of .com) or wrong domain structure.
                    
                    Return ONLY the corrected email string or "NONE".
                `;

                try {
                    const recoveryResult = await model.generateContent(recoveryPrompt);
                    const correctedEmail = recoveryResult.response.text().trim();

                    if (correctedEmail !== 'NONE' && correctedEmail !== lead.email && correctedEmail.includes('@')) {
                        console.log(`   ✨ Neural Discovery found candidate: ${correctedEmail}`);
                        const secondaryCheck = await verifier.verify(correctedEmail);
                        if (secondaryCheck.valid) {
                            console.log(`   ✅ RECOVERY SUCCESSFUL: ${correctedEmail}`);
                            await db.update(prospects)
                                .set({
                                    email: correctedEmail,
                                    status: 'recovered',
                                    verified: true,
                                    verifiedAt: new Date()
                                })
                                .where(eq(prospects.id, lead.id));
                            recoveredCount++;
                            validCount++;
                            continue;
                        }
                    }
                } catch (e) {
                    console.warn("   ⚠️ Neural recovery failed.");
                }
            }

            if (!verification.valid) {
                console.log(`   ❄️ Marking as BOUNCY: ${verification.reason}`);
                await db.update(prospects)
                    .set({
                        status: 'bouncy',
                        verified: false,
                        verifiedAt: new Date()
                    })
                    .where(eq(prospects.id, lead.id));
                bouncyCount++;
                continue;
            }

            // --- STEP 3: DOMAIN AUDIT (For valid leads) ---
            if (lead.website) {
                // ... same domain audit logic but update status to 'hardened'
                const auditPrompt = `ENTITY: ${lead.entity}\nWEBSITE: ${lead.website}\nCorrect? Return JSON: {"is_correct": boolean, "suggested": "string|null"}`;
                try {
                    const auditRes = await model.generateContent(auditPrompt);
                    const audit = JSON.parse(auditRes.response.text().replace(/```json|```/g, "").trim());
                    if (!audit.is_correct && audit.suggested) {
                        console.log(`   🛠️ Updating Domain: ${lead.website} -> ${audit.suggested}`);
                        await db.update(prospects).set({ website: audit.suggested }).where(eq(prospects.id, lead.id));
                        domainFixedCount++;
                    }
                } catch (e) { }
            }

            // Survived all checks
            await db.update(prospects)
                .set({
                    status: 'hardened',
                    verified: true,
                    verifiedAt: new Date(),
                    leadScore: Math.max(lead.leadScore || 0, 50)
                })
                .where(eq(prospects.id, lead.id));

            validCount++;
            console.log("   ✅ Lead Hardened & Verified.");

        } catch (err) {
            console.error(`   ❌ Error verifying ${lead.email}:`, err);
        }
    }

    console.log(`\n✨ GRACEFUL CLEANUP COMPLETE ✨`);
    console.log(`✅ Verified Leads: ${validCount}`);
    console.log(`✨ Recovered by AI: ${recoveredCount}`);
    console.log(`❄️ Questionable/Bouncy: ${bouncyCount}`);
    console.log(`🛠️ Domains Corrected: ${domainFixedCount}`);
    process.exit(0);
}

performIntensiveCleanup().catch(err => {
    console.error("Fatal Cleanup Error:", err);
    process.exit(1);
});
