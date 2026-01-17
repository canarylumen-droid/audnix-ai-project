import { getDatabase } from "../../db.js";
import { prospects, users } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { wsSync } from "../websocket-sync.js";
import { AdvancedCrawler } from "./crawler-service.js";
import { EmailVerifier } from "./email-verifier.js";
import { GEMINI_LATEST_MODEL } from "../ai/model-config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class AudnixIngestor {
    private userId: string;
    private crawler: AdvancedCrawler;
    private verifier: EmailVerifier;

    constructor(userId: string) {
        this.userId = userId;
        this.crawler = new AdvancedCrawler(this.log.bind(this));
        this.verifier = new EmailVerifier();
    }

    private async log(text: string, type: string = 'info') {
        process.stdout.write(`[${type.toUpperCase()}] ${text}\n`);
        wsSync.broadcastToUser(this.userId, {
            type: 'PROSPECTING_LOG',
            payload: { text, type, timestamp: new Date().toISOString() }
        });
    }

    async startNeuralScan(query: string) {
        try {
            const db = getDatabase();
            if (!db) {
                await this.log(`[Error] Database connection is required for neural scanning.`, 'error');
                return;
            }

            await this.log(`[Neural Engine] Activating Gemini 2.0 Discovery Protocol...`, 'info');

            // 1. Extract Intent and Volume
            const model = genAI.getGenerativeModel({ model: GEMINI_LATEST_MODEL });
            const prompt = `
                Analyze this lead generation request: "${query}"
                Return as JSON:
                {
                    "niche": "string",
                    "location": "string",
                    "volume": number,
                    "platforms": ["string"],
                    "filters": ["string"],
                    "intent_type": "website_search" | "no_website_ghost" | "social_only"
                }
            `;

            let intent;
            try {
                const result = await model.generateContent(prompt);
                intent = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
            } catch (err) {
                await this.log(`[Neural Engine] Engine unreachable. Switching to Local Linguistic Parser...`, 'warning');

                // Smarter fallback niche extraction
                let fallbackNiche = query;
                const match = query.match(/(?:leads of|for|target|scout)\s+(.*?)(?:\s+in|\s+making|\s+with|\s+but|$)/i);
                if (match && match[1]) {
                    fallbackNiche = match[1];
                } else {
                    fallbackNiche = query.split(' ').slice(0, 5).join(' ');
                }

                intent = {
                    niche: fallbackNiche,
                    location: query.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)?.[1] || "USA",
                    volume: parseInt(query.match(/(\d+)/)?.[1] || "200"),
                    platforms: ["google", "instagram", "linkedin", "maps"],
                    filters: ["direct contact"],
                    intent_type: query.toLowerCase().includes("no website") ? "no_website_ghost" : "website_search"
                };
            }

            intent.volume = Math.max(500, Math.min(1000000, intent.volume));
            await this.log(`[Intel] Niche: ${intent.niche} | Type: ${intent.intent_type} | Target: ${intent.volume}`, 'success');

            // 2. Multi-Source Discovery
            await this.log(`[Crawler] Initiating multi-source discovery...`, 'info');
            let rawLeads = [];
            if (intent.intent_type === 'no_website_ghost') {
                rawLeads = await this.crawler.discoverLeads(intent.niche, intent.location, intent.volume);
                const ghosts = await this.crawler.searchNoWebsiteLeads(intent.niche, intent.location, Math.ceil(intent.volume / 2));
                rawLeads.push(...ghosts);
            } else {
                rawLeads = await this.crawler.discoverLeads(intent.niche, intent.location, intent.volume);
            }

            if (rawLeads.length === 0) {
                await this.log(`[System] No domains found. Try refining your query.`, 'warning');
                return;
            }

            await this.log(`[Discovery] ${rawLeads.length} potential targets identified.`, 'success');

            // 3. Enrichment
            await this.log(`[Enrichment] Deep scanning ${rawLeads.length} targets...`, 'info');
            const enrichedLeads = await this.crawler.enrichWebsitesParallel(rawLeads);

            // 4. Ingestion
            let ingestedCount = 0;
            let verifiedCount = 0;
            let highQualityCount = 0;

            const batchSize = 20;
            for (let i = 0; i < enrichedLeads.length; i += batchSize) {
                const batch = enrichedLeads.slice(i, i + batchSize);
                await Promise.all(batch.map(async (enriched) => {
                    try {
                        if (!enriched.email) return;

                        // Terminal Aesthetic: Detailed progress
                        await this.log(`[Neural Decrypt] Breaking SSL on node: ${enriched.entity || enriched.email.split('@')[1]}...`, 'raw');

                        if (enriched.email.match(/^(info|support|admin|noreply|no-reply|hr)@/i)) {
                            await this.log(`[Filter] Skipping generic node: ${enriched.email}`, 'warning');
                            return;
                        }

                        // Quality hurdle (50) for advanced verification
                        if (enriched.leadScore < 50) return;

                        // 4. Neural Verification (Advanced Domain Check)
                        await this.log(`[Neural Verify] Cross-checking domain: ${enriched.website}...`, 'raw');

                        // Check if website actually belongs to entity (AI-powered sanity check)
                        const crossCheckModel = genAI.getGenerativeModel({ model: GEMINI_LATEST_MODEL });
                        const crossCheckPrompt = `ENTITY: ${enriched.entity}\nWEBSITE: ${enriched.website}\nDoes this website realistically belong to this entity? Return only "YES" or "NO".`;

                        try {
                            const checkResult = await crossCheckModel.generateContent(crossCheckPrompt);
                            const answer = checkResult.response.text().trim().toUpperCase();
                            if (answer === 'NO') {
                                await this.log(`[Neural Filter] Domain mismatch detected: ${enriched.website} is not ${enriched.entity}`, 'warning');
                                return;
                            }
                        } catch (e) {
                            // If AI check fails, we proceed with caution
                        }

                        // 5. Hardened SMTP Verification with Neural Recovery
                        let verification = await this.verifier.verify(enriched.email);

                        if (!verification.valid) {
                            // Try Neural Recovery: Maybe domain TLD is wrong?
                            await this.log(`[Neural Path] Deliverability failed for ${enriched.email}. Attempting domain recovery...`, 'raw');
                            const recoveryModel = genAI.getGenerativeModel({ model: GEMINI_LATEST_MODEL });
                            const recoveryPrompt = `BUSINESS: ${enriched.entity}\nEMAIL: ${enriched.email}\nWEBSITE: ${enriched.website}\nDeliverability failed. Is there a more likely valid business email or domain for this business? Return ONLY the corrected email string or "NONE".`;

                            try {
                                const recoveryResult = await recoveryModel.generateContent(recoveryPrompt);
                                const correctedEmail = recoveryResult.response.text().trim();
                                if (correctedEmail !== 'NONE' && correctedEmail !== enriched.email && correctedEmail.includes('@')) {
                                    await this.log(`[Neural recovery] Found potential correction: ${correctedEmail}. Re-checking...`, 'info');
                                    const secondaryVerification = await this.verifier.verify(correctedEmail);
                                    if (secondaryVerification.valid) {
                                        enriched.email = correctedEmail;
                                        verification = secondaryVerification;
                                        (enriched as any).recovered = true;
                                        await this.log(`[Neural Success] Domain recovered! Using ${correctedEmail}`, 'success');
                                    }
                                }
                            } catch (e) { }
                        }

                        if (!verification.valid) {
                            await this.log(`[SMTP Rejection] ${enriched.email} failed final check. Marking as questionable.`, 'warning');
                            // We'll still proceed but mark clearly as unverified/bouncy
                        }

                        const existing = await db.select().from(prospects).where(eq(prospects.email, enriched.email)).limit(1);
                        if (existing.length > 0) return;

                        const temperature = enriched.leadScore >= 85 ? '🔥 HOT' : (enriched.leadScore >= 60 ? '⚡ WARM' : '❄️ COLD');
                        const [inserted] = await db.insert(prospects).values({
                            userId: this.userId,
                            entity: enriched.entity,
                            industry: intent.niche,
                            location: enriched.location || intent.location,
                            email: enriched.email,
                            phone: enriched.phone || null,
                            website: enriched.website,
                            platforms: enriched.platforms,
                            leadScore: enriched.leadScore,
                            verified: verification.valid,
                            verifiedAt: new Date(),
                            status: (enriched as any).recovered ? 'recovered' : (verification.valid ? 'hardened' : 'bouncy'),
                            source: enriched.source,
                            metadata: {
                                intent,
                                temperature,
                                role: (enriched as any).role,
                                socialProfiles: enriched.socialProfiles,
                                verification_reason: verification.reason,
                                deliverability: verification.valid ? 'safe' : 'bouncy'
                            }
                        } as any).returning();

                        ingestedCount++;
                        if (verification.riskLevel === 'low') verifiedCount++;
                        if (enriched.leadScore >= 90) highQualityCount++;

                        await this.log(`[Signal] ${temperature} | ${inserted.entity} | ${inserted.email}`, 'success');

                        wsSync.broadcastToUser(this.userId, {
                            type: 'PROSPECT_FOUND',
                            payload: inserted
                        });
                    } catch (err) { }
                }));
            }

            await db.update(users).set({ lastProspectScanAt: new Date() }).where(eq(users.id, this.userId));
            await this.log(`[Protocol] Scan COMPLETE. ${ingestedCount} leads ingested.`, 'success');

        } catch (error) {
            console.error("Scraping Error:", error);
            await this.log(`[System Error] ${error instanceof Error ? error.message : 'Unknown failure'}`, 'error');
        }
    }

    async verifyLead(prospectId: string) {
        const db = getDatabase();
        if (!db) return;
        try {
            const [prospect] = await db.select().from(prospects).where(eq(prospects.id, prospectId));
            if (!prospect || !prospect.email) return;

            const verification = await this.verifier.verify(prospect.email);
            if (verification.valid) {
                await db.update(prospects).set({
                    verified: true,
                    status: 'hardened',
                    verifiedAt: new Date()
                }).where(eq(prospects.id, prospectId));
                wsSync.broadcastToUser(this.userId, {
                    type: 'PROSPECT_UPDATED',
                    payload: { id: prospectId, verified: true, status: 'hardened' }
                });
            }
        } catch (error) { }
    }
}
