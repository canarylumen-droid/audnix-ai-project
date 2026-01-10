import { db } from "../../db.js";
import { prospects, users } from "@shared/schema.js";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { wsSync } from "../websocket-sync.js";
import { AdvancedCrawler } from "./crawler-service.js";
import { EmailVerifier } from "./email-verifier.js";

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
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const prompt = `
                Analyze this lead generation request: "${query}"
                Identify:
                1. Main Niche/Industry
                2. Target Geographic Location
                3. Requested Lead Volume (Minimum 500, Maximum 2000. Default to 500 if not specified)
                4. Platform Focus (if any)
                5. Special Filters (e.g., "personal emails", "founders only", "high revenue", etc.)

                Return as JSON:
                {
                    "niche": "string",
                    "location": "string",
                    "volume": number (500-2000),
                    "platforms": ["string"],
                    "filters": ["string"]
                }
            `;

            const result = await model.generateContent(prompt);
            const intent = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

            // Enforce volume limits
            intent.volume = Math.max(500, Math.min(2000, intent.volume));

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

            // 4. Filter and Ingest
            let ingestedCount = 0;
            let verifiedCount = 0;
            let highQualityCount = 0;

            for (const enriched of enrichedLeads) {
                try {
                    // Filter: Must have email
                    if (!enriched.email) continue;

                    // Filter: No generic emails
                    if (enriched.email.match(/^(info|contact|support|hello|admin|noreply|no-reply|hr|sales|team|office)@/i)) {
                        continue;
                    }

                    // Filter: Lead score must be >= 95%
                    if (enriched.leadScore < 95) continue;

                    // SMTP Verification
                    const verification = await this.verifier.verify(enriched.email);
                    if (!verification.valid) continue;

                    // Check for duplicates
                    const existing = await db.select()
                        .from(prospects)
                        .where(eq(prospects.email, enriched.email))
                        .limit(1);

                    if (existing.length > 0) continue;

                    // Ingest into DB
                    const [inserted] = await db.insert(prospects).values({
                        userId: Number(this.userId),
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

                    // Real-time update
                    wsSync.broadcastToUser(this.userId, {
                        type: 'PROSPECT_FOUND',
                        payload: inserted
                    });

                    await this.log(`[Ingested] ${enriched.entity} | ${enriched.email} | Score: ${enriched.leadScore}% | Revenue: ${(enriched as any).estimatedRevenue || 'N/A'}`, 'success');

                } catch (err) {
                    continue;
                }
            }

            // Update user's last scan timestamp
            await db.update(users)
                .set({ lastProspectScanAt: new Date() })
                .where(eq(users.id, Number(this.userId)));

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
