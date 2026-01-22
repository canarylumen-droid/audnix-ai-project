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
    channel: { description: "Communication channel (instagram/email)", required: false },
};

export type LeadColumnMapping = {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
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
    sampleRows: Record<string, string>[] = []
): Promise<MappingResult> {
    const targetFields = Object.keys(LEADS_SCHEMA);

    // Build sample data context
    const sampleContext = sampleRows.slice(0, 3).map(row =>
        headers.map(h => `${h}: ${row[h] || ''}`).join(', ')
    ).join('\n');

    const prompt = `You are a data mapping expert. Map the user's CSV columns to our target schema.

TARGET SCHEMA (fields we need):
${targetFields.map(f => `- ${f}: ${LEADS_SCHEMA[f as keyof typeof LEADS_SCHEMA].description}`).join('\n')}

USER CSV HEADERS:
${headers.map(h => `- "${h}"`).join('\n')}

${sampleContext ? `SAMPLE DATA:\n${sampleContext}` : ''}

TASK: Return a JSON object mapping USER HEADERS to TARGET FIELDS.
Only map columns you're confident about. Each target field should have at most one source column.

Return format:
{
  "mapping": { "targetField": "sourceColumnName", ... },
  "confidence": 0.0-1.0,
  "unmappedColumns": ["columns that don't map to any field"]
}

IMPORTANT: 
- "mapping" values should be the EXACT column names from the user's headers
- Only include mappings you're confident about
- Return valid JSON only`;

    try {
        // Try Gemini first
        if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        console.warn("AI mapping failed, using fallback:", error);
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
            /^first[_\s-]?name$/i, /^person$/i, /^lead$/i, /^customer$/i
        ],
        email: [
            /^e?-?mail$/i, /^email[_\s-]?addr/i, /^contact[_\s-]?email$/i,
            /^e-?mail[_\s-]?address$/i
        ],
        phone: [
            /^phone$/i, /^mobile$/i, /^cell$/i, /^tel/i, /^contact[_\s-]?number$/i,
            /^phone[_\s-]?number$/i
        ],
        company: [
            /^company$/i, /^org/i, /^business$/i, /^employer$/i, /^firm$/i
        ],
        channel: [
            /^channel$/i, /^source$/i, /^platform$/i
        ],
        industry: [
            /^industry$/i, /^niche$/i, /^sector$/i, /^category$/i
        ],
        website: [
            /^website$/i, /^url$/i, /^link$/i, /^site$/i, /^domain$/i
        ],
        notes: [
            /^notes$/i, /^description$/i, /^info$/i, /^comments$/i, /^about$/i
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
): { name?: string; email?: string; phone?: string; company?: string; channel?: string } {
    let email = mapping.email ? row[mapping.email]?.trim() : undefined;
    let phone = mapping.phone ? row[mapping.phone]?.trim() : undefined;

    // Fallback: If no email was mapped, search all columns for an email pattern
    if (!email) {
        for (const value of Object.values(row)) {
            if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
                email = value.trim();
                break;
            }
        }
    }

    // Fallback: If no phone was mapped, search all columns for a phone-like pattern
    if (!phone) {
        for (const value of Object.values(row)) {
            if (typeof value === 'string' && /^\+?[\d\s-]{10,15}$/.test(value.trim())) {
                phone = value.trim();
                break;
            }
        }
    }

    return {
        name: mapping.name ? row[mapping.name]?.trim() : undefined,
        email,
        phone,
        company: mapping.company ? row[mapping.company]?.trim() : undefined,
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

