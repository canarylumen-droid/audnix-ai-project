/**
 * AI-Powered CSV Column Mapper
 * Automatically maps user CSV columns to the leads table schema using AI
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Target schema for leads table
export const LEADS_SCHEMA = {
    name: { description: "Full name of the lead/contact", required: true },
    email: { description: "Email address", required: false },
    phone: { description: "Phone/mobile number", required: false },
    company: { description: "Company/organization name", required: false },
    role: { description: "Job title or role (e.g. Founder, CEO)", required: false },
    bio: { description: "Brief background or specific info about the lead", required: false },
    channel: { description: "Communication channel (instagram/email)", required: false },
};

export type LeadColumnMapping = {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    bio?: string;
    channel?: string;
    industry?: string;
    website?: string;
    notes?: string;
};

export interface MappingResult {
    mapping: LeadColumnMapping;
    confidence: number;
    unmappedColumns: string[];
}

// Initialize AI clients
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

/**
 * Use AI to map CSV headers to leads schema
 */
export async function mapCSVColumnsToSchema(
    headers: string[],
    sampleRows: Record<string, string>[] = [],
    skipAI: boolean = false
): Promise<MappingResult> {
    const targetFields = Object.keys(LEADS_SCHEMA);

    if (skipAI) {
        return fallbackMapping(headers);
    }

    // Build sample data context
    const sampleContext = sampleRows.slice(0, 3).map(row =>
        headers.map(h => `${h}: ${row[h] || ''}`).join(', ')
    ).join('\n');

    const prompt = `You are an elite data architect specialized in messy CSV ingestion. Your task is to accurately map foreign CSV headers to our standardized leads schema.

TARGET SCHEMA (Internal Fields):
${targetFields.map(f => `- ${f}: ${LEADS_SCHEMA[f as keyof typeof LEADS_SCHEMA].description}`).join('\n')}

IMPORT SOURCE HEADERS:
${headers.map(h => `- "${h}"`).join('\n')}

${sampleContext ? `REAL SAMPLE DATA FROM FILE (First 3 rows):\n${sampleContext}` : ''}

TASK:
Identify which user column corresponds to which target field. 
- Use the sample data to disambiguate (e.g., if a column is named "ID" but contains "john@doe.com", it's an email).
- If multiple columns could match (e.g., "First Name", "Last Name"), prioritize the one with full content.
- Be precise with "Company" vs "Name".

Return ONLY a JSON object:
{
  "mapping": { "name": "UserHeaderA", "email": "UserHeaderB", ... },
  "confidence": 0.0-1.0,
  "unmappedColumns": ["list of headers that don't match our schema"]
}

IMPORTANT: The "mapping" keys must be exactly from our TARGET SCHEMA. Values must be EXACT headers from the USER CSV.`;

    try {
        // Try Gemini first
        if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return normalizeMapping(parsed, headers);
            }
        }

        // Fallback to OpenAI
        if (openai) {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a data mapping expert. Return valid JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 500,
                response_format: { type: "json_object" }
            });

            const response = completion.choices[0].message.content;
            if (response) {
                const parsed = JSON.parse(response);
                return normalizeMapping(parsed, headers);
            }
        }
    } catch (error) {
        console.warn(`[CSV] AI mapping failed (${error instanceof Error ? error.message : 'Unknown error'}), using robust fallback`);
        // Use local robust fallback instead of external one
        return fallbackMapping(headers);
    }

    // Fallback: use fuzzy matching
    return fallbackMapping(headers);
}

/**
 * Normalize and validate the AI response
 */
function normalizeMapping(parsed: any, headers: string[]): MappingResult {
    const mapping: LeadColumnMapping = {};
    const mappedColumns = new Set<string>();

    // Handle different response formats
    const rawMapping = parsed.mapping || parsed;

    for (const [targetField, sourceColumn] of Object.entries(rawMapping)) {
        if (targetField in LEADS_SCHEMA && typeof sourceColumn === 'string') {
            // Verify the source column exists in headers (case-insensitive)
            const matchedHeader = headers.find(h =>
                h.toLowerCase() === sourceColumn.toLowerCase()
            );
            if (matchedHeader) {
                mapping[targetField as keyof LeadColumnMapping] = matchedHeader;
                mappedColumns.add(matchedHeader);
            }
        }
    }

    const unmappedColumns = headers.filter(h => !mappedColumns.has(h));

    return {
        mapping,
        confidence: parsed.confidence || 0.8,
        unmappedColumns
    };
}

/**
 * Fallback mapping using fuzzy string matching
 */
function fallbackMapping(headers: string[]): MappingResult {
    const mapping: LeadColumnMapping = {};
    const mappedColumns = new Set<string>();

    // Common variations for each field
    const patterns: Record<string, RegExp[]> = {
        name: [
            /^name$/i, /^full[_\s-]?name$/i, /^contact[_\s-]?name$/i,
            /^first[_\s-]?name$/i, /^person$/i, /^lead$/i, /^customer$/i,
            /^fname$/i, /^lname$/i, /^contact$/i, /^entity$/i, /^fullname$/i,
            /^prospective[_\s-]?name$/i
        ],
        email: [
            /^e?-?mail$/i, /^email[_\s-]?addr/i, /^contact[_\s-]?email$/i,
            /^e-?mail[_\s-]?address$/i, /^mail$/i, /^work[_\s-]?email$/i,
            /^primary[_\s-]?email$/i, /^email[_\s-]?(1|2)$/i
        ],
        phone: [
            /^phone$/i, /^mobile$/i, /^cell$/i, /^tel/i, /^contact[_\s-]?number$/i,
            /^phone[_\s-]?number$/i, /^telephone$/i, /^whatsapp$/i
        ],
        company: [
            /^company$/i, /^org/i, /^business$/i, /^employer$/i, /^firm$/i,
            /^account$/i, /^company[_\s-]?name$/i, /^organization$/i
        ],
        role: [
            /^role$/i, /^title$/i, /^job[_\s-]?title$/i, /^position$/i, /^function$/i,
            /^occupation$/i, /^work[_\s-]?role$/i
        ],
        channel: [
            /^channel$/i, /^source$/i, /^platform$/i, /^medium$/i, /^origin$/i
        ],
        industry: [
            /^industry$/i, /^niche$/i, /^sector$/i, /^category$/i, /^market$/i
        ],
        website: [
            /^website$/i, /^url$/i, /^link$/i, /^site$/i, /^domain$/i, /^web[_\s-]?addr/i
        ],
        notes: [
            /^notes$/i, /^description$/i, /^info$/i, /^comments$/i, /^about$/i,
            /^remarks$/i, /^feedback$/i, /^details$/i, /^extra$/i
        ]
    };

    for (const [field, regexes] of Object.entries(patterns)) {
        for (const header of headers) {
            if (mappedColumns.has(header)) continue;

            for (const regex of regexes) {
                if (regex.test(header)) {
                    mapping[field as keyof LeadColumnMapping] = header;
                    mappedColumns.add(header);
                    break;
                }
            }
            if (mapping[field as keyof LeadColumnMapping]) break;
        }
    }

    const unmappedColumns = headers.filter(h => !mappedColumns.has(h));

    return {
        mapping,
        confidence: 0.6, // Lower confidence for fallback
        unmappedColumns
    };
}

/**
 * Extract a lead record using the mapping
 */
export function extractLeadFromRow(
    row: Record<string, string>,
    mapping: LeadColumnMapping
): { name?: string; email?: string; phone?: string; company?: string; channel?: string; role?: string; bio?: string } {
    let email = mapping.email ? row[mapping.email]?.trim() : undefined;
    
    // Fallback: If no email was mapped, search all columns for an email pattern
    if (!email) {
        for (const value of Object.values(row)) {
            if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
                email = value.trim();
                break;
            }
        }
    }

    return {
        name: mapping.name ? row[mapping.name]?.trim() : undefined,
        email,
        phone: undefined, // Skip phone numbers per user request
        company: mapping.company ? row[mapping.company]?.trim() : undefined,
        role: mapping.role ? row[mapping.role]?.trim() : undefined,
        bio: mapping.bio ? row[mapping.bio]?.trim() : (mapping.notes ? row[mapping.notes]?.trim() : undefined),
        channel: mapping.channel ? row[mapping.channel]?.trim() : undefined,
    };
}

/**
 * Extract all unmapped columns as metadata (industry, notes, etc.)
 * This preserves any extra details the user included in their CSV
 */
export function extractExtraFieldsAsMetadata(
    row: Record<string, string>,
    mapping: LeadColumnMapping
): Record<string, string> {
    const mappedColumns = new Set(Object.values(mapping).filter(Boolean));
    const metadata: Record<string, string> = {};

    for (const [column, value] of Object.entries(row)) {
        if (!mappedColumns.has(column) && value?.trim()) {
            // Convert column name to snake_case for metadata key
            const key = column.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
            if (key) {
                metadata[key] = value.trim();
            }
        }
    }

    return metadata;
}

