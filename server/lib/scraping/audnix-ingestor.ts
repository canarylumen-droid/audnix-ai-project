import { db } from "../../db.js";
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

    private async log(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
        wsSync.broadcastToUser(this.userId, {
            type: 'PROSPECTING_LOG',
            payload: {
                id: Math.random().toString(36),
                text,
                type,
                timestamp: new Date()
            }
        });
    }

    async startNeuralScan(query: string) {
        try {
            await this.log(`[Neural Engine] Activating Gemini 2.0 Discovery Protocol...`, 'info');

            // 1. Extract Intent and Volume using Gemini 2.0
            const model = genAI.getGenerativeModel({ model: GEMINI_LATEST_MODEL });
            const prompt = `
                Analyze this lead generation request: "${query}"
                
                OBJECTIVE: 
                Determine the target audience including potential partners, investors, or specific lead types.
                
                Identify:
                1. Main Niche/Industry
                2. Target Geographic Location (Global if not specified)
                3. Requested Lead Volume (Up to 1,000,000. Default to 10,000 if not specified)
                4. Platform Focus (LinkedIn, Instagram, Crunchbase, etc.)
                5. High-Value Filters (e.g., "Series A funded", "decision makers", "personal emails")

                Return as JSON:
                {
                    "niche": "string",
                    "location": "string",
                    "volume": number,
                    "platforms": ["string"],
                    "filters": ["string"]
                }
            `;

            const result = await model.generateContent(prompt);
            const intent = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

            // Enforce volume limits (Millions of data points scalability)
            intent.volume = Math.max(500, Math.min(1000000, intent.volume));

            await this.log(`[Intel] Niche: ${intent.niche} | Location: ${intent.location} | Target: ${intent.volume} leads`, 'success');

            // 2. Multi-Source Discovery
            await this.log(`[Crawler] Initiating multi-source discovery (Google, Bing, Social)...`, 'info');
            const rawLeads = await this.crawler.discoverLeads(intent.niche, intent.location, intent.volume);

            if (rawLeads.length === 0) {
                await this.log(`[System] No domains found. Try refining your query or check internet connection.`, 'warning');
                return;
            }

            await this.log(`[Discovery] ${rawLeads.length} potential targets identified.`, 'success');

            // 3. PARALLEL Enrichment (40 concurrent workers)
            await this.log(`[Enrichment] Processing ${rawLeads.length} leads with 40 parallel workers...`, 'info');

            const enrichedLeads = await this.crawler.enrichWebsitesParallel(rawLeads);

            // 4. Batch Filter and Ingest (Turbo Mode)
            let ingestedCount = 0;
            let verifiedCount = 0;
            let highQualityCount = 0;

            const batchSize = 20;
            for (let i = 0; i < enrichedLeads.length; i += batchSize) {
                const batch = enrichedLeads.slice(i, i + batchSize);
                await Promise.all(batch.map(async (enriched) => {
                    try {
                        if (!enriched.email) return;
                        if (enriched.email.match(/^(info|contact|support|hello|admin|noreply|no-reply|hr|sales|team|office)@/i)) return;
                        if (enriched.leadScore < 70) return;

                        const verification = await this.verifier.verify(enriched.email);
                        if (!verification.valid) return;

                        const existing = await db.select()
                            .from(prospects)
                            .where(eq(prospects.email, enriched.email))
                            .limit(1);

                        if (existing.length > 0) return;

                        const [inserted] = await db.insert(prospects).values({
                            userId: this.userId,
                            entity: enriched.entity,
                            industry: intent.niche,
                            location: enriched.location || intent.location,
                            email: enriched.email,
                            phone: enriched.phone || null,
                            website: enriched.website,
                            platforms: enriched.platforms,
                            wealthSignal: enriched.wealthSignal,
                            verified: verification.riskLevel === 'low',
                            verifiedAt: verification.riskLevel === 'low' ? new Date() : null,
                            status: verification.riskLevel === 'low' ? 'verified' : 'found',
                            source: enriched.source,
                            metadata: {
                                intent,
                                leadScore: enriched.leadScore,
                                personalEmail: enriched.personalEmail,
                                founderEmail: enriched.founderEmail,
                                estimatedRevenue: (enriched as any).estimatedRevenue,
                                role: (enriched as any).role,
                                verification: {
                                    reason: verification.reason,
                                    riskLevel: verification.riskLevel
                                },
                                socialProfiles: enriched.socialProfiles
                            }
                        }).returning();

                        ingestedCount++;
                        if (verification.riskLevel === 'low') verifiedCount++;
                        if (enriched.leadScore >= 95) highQualityCount++;

                        wsSync.broadcastToUser(this.userId, {
                            type: 'PROSPECT_FOUND',
                            payload: inserted
                        });

                        await this.log(`[Ingested] ${enriched.entity} | ${enriched.email}`, 'success');
                    } catch (err) { }
                }));
            }

            // Update user's last scan timestamp
            await db.update(users)
                .set({ lastProspectScanAt: new Date() })
                .where(eq(users.id, this.userId));

            await this.log(`[Protocol] Scan COMPLETE. ${ingestedCount} leads ingested (${verifiedCount} verified, ${highQualityCount} high-quality).`, 'success');

        } catch (error) {
            console.error("Scraping Error:", error);
            await this.log(`[System Error] ${error instanceof Error ? error.message : 'Unknown failure'}`, 'error');
        }
    }

    /**
     * Manual verification for individual leads
     */
    async verifyLead(prospectId: string) {
        try {
            const [prospect] = await db.select().from(prospects).where(eq(prospects.id, prospectId));
            if (!prospect || !prospect.email) return;

            await this.log(`[SMTP] Re-verifying ${prospect.email}...`, 'info');

            const verification = await this.verifier.verify(prospect.email);

            if (verification.valid) {
                await db.update(prospects)
                    .set({
                        verified: true,
                        status: 'verified',
                        verifiedAt: new Date(),
                        metadata: {
                            ...prospect.metadata as any,
                            verification: {
                                reason: verification.reason,
                                riskLevel: verification.riskLevel,
                                verifiedAt: new Date().toISOString()
                            }
                        }
                    })
                    .where(eq(prospects.id, prospectId));

                await this.log(`[Verified] ${prospect.email} - ${verification.reason}`, 'success');

                wsSync.broadcastToUser(this.userId, {
                    type: 'PROSPECT_UPDATED',
                    payload: { id: prospectId, verified: true, status: 'verified' }
                });
            } else {
                await this.log(`[Failed] ${prospect.email} - ${verification.reason}`, 'error');
            }

        } catch (error) {
            await this.log(`[SMTP] Verification failed: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
        }
    }
}
