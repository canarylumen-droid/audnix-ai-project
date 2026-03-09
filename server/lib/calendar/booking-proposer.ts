import { generateReply } from "../ai/ai-service.js";
import { MODELS } from "../ai/model-config.js";
import { getCalendlySlots, createCalendlyEvent } from "./calendly.js";
import { db } from "../../db.js";
import { calendarSettings, integrations } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";

export class BookingProposer {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Parses natural language into a time request and matches with Calendly slots
     */
    async proposeTimes(userInput: string): Promise<{
        suggestedSlots: string[];
        parsedIntent: string;
        needsClarification: boolean;
    }> {
        try {
            // 1. Get user's Calendly settings
            const [settings] = await db.select().from(calendarSettings).where(eq(calendarSettings.userId, this.userId)).limit(1);
            const [integration] = await db.select().from(integrations).where(eq(integrations.userId, this.userId)).limit(1);

            if (!settings?.calendlyToken || !settings.calendlyEnabled) {
                return { suggestedSlots: [], parsedIntent: "Calendly not connected", needsClarification: true };
            }

            // 2. Use AI to extract requested time range
            const prompt = `
                Extract the user's preferred meeting times from this message: "${userInput}"
                
                Identify:
                1. Specific days (e.g., "Tuesday", "Jan 15th")
                2. Time ranges (e.g., "afternoon", "before 12pm", "anytime")
                3. Urgency (e.g., "this week", "next month")

                Current Date/Time: ${new Date().toLocaleString()}

                Return JSON:
                {
                    "days": ["string"],
                    "timeRanges": ["string"],
                    "parsedIntent": "string",
                    "confidence": number (0-1)
                }
            `;

            const result = await generateReply(
                "You are a calendar assistant.",
                prompt,
                {
                    model: MODELS.sales_reasoning,
                    jsonMode: true
                }
            );
            const extraction = JSON.parse((result.text || "{}").trim());

            if (extraction.confidence < 0.5) {
                return { suggestedSlots: [], parsedIntent: extraction.parsedIntent, needsClarification: true };
            }

            // 3. Get actual Calendly slots
            const slots = await getCalendlySlots(settings.calendlyToken, 14); // Look 2 weeks ahead

            // 4. Match slots with extraction using AI
            const matchingPrompt = `
                Find the best 3-5 matching time slots from this list based on the user's request: "${userInput}"
                
                Available Slots:
                ${slots.map(s => s.time).join('\n')}

                Rules:
                - Return the ISO strings of the best matches.
                - If no close matches, return empty list.
                
                Return JSON:
                {
                    "matches": ["ISO_STRING"]
                }
            `;

            const matchResult = await generateReply(
                "You are a calendar matching assistant.",
                matchingPrompt,
                {
                    model: MODELS.sales_reasoning,
                    jsonMode: true
                }
            );
            const matches = JSON.parse((matchResult.text || "{}").trim());

            return {
                suggestedSlots: matches.matches,
                parsedIntent: extraction.parsedIntent,
                needsClarification: matches.matches.length === 0
            };

        } catch (error) {
            console.error("BookingProposer Error:", error);
            return { suggestedSlots: [], parsedIntent: "Error processing request", needsClarification: true };
        }
    }

    /**
     * Automatically books a slot if user confirms
     */
    async bookConfirmedSlot(leadEmail: string, leadName: string, confirmedTime: string) {
        const [settings] = await db.select().from(calendarSettings).where(eq(calendarSettings.userId, this.userId)).limit(1);
        if (!settings?.calendlyToken) return null;

        return await createCalendlyEvent(
            settings.calendlyToken,
            leadEmail,
            leadName,
            new Date(confirmedTime),
            settings.calendlyEventTypeUri || undefined
        );
    }
}
