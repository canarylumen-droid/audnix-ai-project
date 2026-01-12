import { supabaseAdmin } from './supabase-admin.js';
import { storage } from '../storage.js';
import { scheduleInitialFollowUp } from './ai/follow-up-worker.js';
import OpenAI from 'openai';
import type { PDFProcessingResult } from '../../shared/types.js';

const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.error('❌ CRITICAL: OPENAI_API_KEY not set');
  console.error('📋 PDF analysis and AI features will be disabled');
}
const openai = new OpenAI({
  apiKey: openaiKey,
});

/**
 * Process PDF file and extract lead information + offer details with AI
 */
export async function processPDF(
  fileBuffer: Buffer,
  userId: string,
  options?: {
    autoReachOut?: boolean;
    extractOffer?: boolean;
  }
): Promise<PDFProcessingResult> {
  try {
    const pdfParse = require('pdf-parse');

    // Handle large files (>10MB) with max buffer size
    const maxBufferSize = 50 * 1024 * 1024; // 50MB max
    if (fileBuffer.length > maxBufferSize) {
      return {
        success: false,
        leadsCreated: 0,
        error: `PDF too large (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`
      };
    }

    const data = await pdfParse(fileBuffer, {
      max: 0, // Parse all pages
      version: 'v2.0.550' // Use latest version
    });
    const text = data.text;

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        leadsCreated: 0,
        error: 'PDF appears to be empty or contains only images'
      };
    }

    // Extract offer/product information if requested
    let offerData;
    let brandData;
    if (options?.extractOffer) {
      const extractedData = await extractOfferAndBrandWithAI(text, userId);
      offerData = extractedData.offer;
      brandData = extractedData.brand;
    }

    // Extract leads with AI
    let parsedLeads = await extractLeadsWithAI(text);

    if (parsedLeads.length === 0) {
      // Fallback to regex if AI fails
      parsedLeads = parseLeadsFromText(text);
    }

    if (parsedLeads.length === 0 && !offerData) {
      return {
        success: false,
        leadsCreated: 0,
        error: 'No valid lead data or offer information found in PDF'
      };
    }

    // Create leads in database with extracted contact info
    const createdLeads = [];
    for (const leadData of parsedLeads) {
      try {
        const leadChannel = leadData.email ? 'email' : leadData.phone ? 'whatsapp' : 'instagram';
        const lead = await storage.createLead({
          userId,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          channel: leadChannel as 'email' | 'instagram' | 'whatsapp',
          status: 'new',
          metadata: {
            source: 'pdf_import',
            company: leadData.company,
            pdf_extracted: true,
            has_email: !!leadData.email,
            has_phone: !!leadData.phone,
          }
        });

        createdLeads.push({
          id: lead.id,
          name: lead.name,
          email: lead.email || undefined,
          phone: lead.phone || undefined,
          company: lead.metadata?.company || undefined
        });

        // Auto-schedule initial follow-up for imported leads
        try {
          await scheduleInitialFollowUp(userId, lead.id, leadChannel as 'email' | 'whatsapp' | 'instagram' | 'manual');
        } catch (followUpError) {
          console.warn(`Failed to schedule follow-up for ${lead.name}:`, followUpError);
        }

        // Auto-reach out if enabled and offer data exists
        if (options?.autoReachOut && offerData && (leadData.email || leadData.phone)) {
          await autoReachOutToLead(userId, lead, offerData);
        }
      } catch (error) {
        console.error('Error creating lead:', error);
      }
    }

    return {
      success: true,
      leadsCreated: createdLeads.length,
      leads: createdLeads,
      offerExtracted: offerData,
      brandExtracted: brandData
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      success: false,
      leadsCreated: 0,
      error: error instanceof Error ? error.message : 'Failed to process PDF'
    };
  }
}

/**
 * Extract colors from PDF text using advanced regex patterns
 */
function extractColorsFromText(text: string): {
  primary?: string;
  secondary?: string;
  accent?: string;
  all: string[];
} {
  const colors: string[] = [];

  // Extract hex colors (#RRGGBB or #RGB)
  const hexPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const hexMatches = text.match(hexPattern) || [];
  colors.push(...hexMatches);

  // Extract RGB/RGBA colors
  const rgbPattern = /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)/gi;
  let rgbMatch;
  while ((rgbMatch = rgbPattern.exec(text)) !== null) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    // Convert RGB to hex
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    colors.push(hex.toUpperCase());
  }

  // Extract named colors in brand context
  const colorNames = [
    'navy', 'blue', 'coral', 'teal', 'purple', 'violet', 'indigo',
    'green', 'emerald', 'red', 'crimson', 'orange', 'amber', 'yellow',
    'gold', 'pink', 'rose', 'magenta', 'cyan', 'turquoise', 'lime',
    'mint', 'sage', 'olive', 'maroon', 'burgundy', 'plum', 'lavender'
  ];

  const brandColorPattern = new RegExp(
    `(?:brand|primary|secondary|accent|main)\\s*(?:color|colour)?\\s*:?\\s*(${colorNames.join('|')})`,
    'gi'
  );
  const namedMatches = text.match(brandColorPattern) || [];
  colors.push(...namedMatches.map(m => m.split(/[:\s]+/).pop()!));

  // Remove duplicates and normalize
  const uniqueColors = [...new Set(colors.map(c => c.toUpperCase()))];

  // Try to identify primary, secondary, accent from context
  let primary, secondary, accent;

  const primaryMatch = text.match(/primary\s*(?:color|colour)?[:\s]*([#\w]+)/i);
  if (primaryMatch) primary = primaryMatch[1];

  const secondaryMatch = text.match(/secondary\s*(?:color|colour)?[:\s]*([#\w]+)/i);
  if (secondaryMatch) secondary = secondaryMatch[1];

  const accentMatch = text.match(/accent\s*(?:color|colour)?[:\s]*([#\w]+)/i);
  if (accentMatch) accent = accentMatch[1];

  // Fallback: assign first 3 unique colors
  if (!primary && uniqueColors.length > 0) primary = uniqueColors[0];
  if (!secondary && uniqueColors.length > 1) secondary = uniqueColors[1];
  if (!accent && uniqueColors.length > 2) accent = uniqueColors[2];

  return {
    primary,
    secondary,
    accent,
    all: uniqueColors
  };
}

/**
 * Extract offer/product information AND brand colors/identity from PDF using AI + regex
 */
async function extractOfferAndBrandWithAI(text: string, userId: string): Promise<{
  offer: any;
  brand: any;
}> {
  // First, extract colors using regex (works without OpenAI)
  const extractedColors = extractColorsFromText(text);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not configured - using regex-based brand extraction only');
    // Return regex-based colors if OpenAI not available
    return {
      offer: null,
      brand: {
        colors: {
          primary: extractedColors.primary,
          secondary: extractedColors.secondary,
          accent: extractedColors.accent
        },
        allColors: extractedColors.all
      }
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `Extract BOTH product/service AND brand identity from this document. Return JSON with two objects:

1. "offer": Extract product name, description, pricing, features (array), benefits (array), CTA text, support/contact email, and any links
2. "brand": Extract brand colors (hex codes like #FF5733, RGB values, or color names), company name, tagline, website URL, logo description

For colors, aggressively extract:
- ALL hex codes (#RRGGBB or #RGB)
- ALL RGB/RGBA values
- Color names mentioned in branding context (navy, coral, teal, etc.)
- Primary, secondary, and accent colors explicitly

Return ALL colors found, even if more than 3. Be thorough - this is critical for email branding.`
      }, {
        role: 'user',
        content: text.substring(0, 12000)
      }],
      response_format: { type: 'json_object' },
      max_completion_tokens: 1200
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ Brand analysis complete via OpenAI');

    // Merge AI-extracted colors with regex-extracted colors for maximum coverage
    const aiColors = result.brand?.colors || {};
    const mergedColors = {
      primary: aiColors.primary || extractedColors.primary,
      secondary: aiColors.secondary || extractedColors.secondary,
      accent: aiColors.accent || extractedColors.accent,
      allColors: [
        ...(aiColors.allColors || []),
        ...extractedColors.all
      ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    };

    result.brand = {
      ...result.brand,
      colors: mergedColors
    };

    // Store both offer and brand in user's profile for future auto-responses
    if (result.offer?.productName || result.brand?.companyName) {
      await storage.updateUser(userId, {
        metadata: {
          extracted_offer: result.offer || {},
          extracted_brand: result.brand || {},
          brand_colors: mergedColors,
          extraction_updated_at: new Date().toISOString()
        }
      });
    }

    return {
      offer: result.offer || null,
      brand: result.brand || null
    };
  } catch (error: any) {
    console.error('❌ Brand/Offer extraction error:', error?.message || error);
    console.error('📋 Falling back to regex-based brand extraction');
    // Return regex-based extraction as fallback
    return {
      offer: null,
      brand: {
        colors: {
          primary: extractedColors.primary,
          secondary: extractedColors.secondary,
          accent: extractedColors.accent
        },
        allColors: extractedColors.all
      }
    };
  }
}

/**
 * Auto-reach out to leads via email or WhatsApp with offer info and brand colors
 */
async function autoReachOutToLead(
  userId: string,
  lead: any,
  offerData: any
): Promise<void> {
  try {
    const { sendEmail } = await import('./channels/email.js');
    const { sendWhatsAppMessage } = await import('./channels/whatsapp.js');

    // Get user's extracted brand data
    const user = await storage.getUserById(userId);
    const brandData = user?.metadata?.extracted_brand || {};
    const brandColors = brandData.colors || {};

    const message = `Hey ${lead.name}! I noticed you might be interested in ${offerData.productName}. ${offerData.description}

${offerData.features?.slice(0, 3).map((f: string) => `✓ ${f}`).join('\n')}

${offerData.price ? `Investment: ${offerData.price}` : ''}
${offerData.link ? `Learn more: ${offerData.link}` : ''}
${offerData.supportEmail ? `\nQuestions? Reach us at ${offerData.supportEmail}` : ''}

Would you like to discuss how this can help you?`;

    // Try email first if available
    if (lead.email) {
      try {
        await sendEmail(
          userId,
          lead.email,
          message,
          `${offerData.productName} - Exclusive Offer`,
          {
            buttonText: offerData.cta || 'Get Started',
            buttonUrl: offerData.link || brandData.website || '#',
            businessName: brandData.companyName || 'Your Business',
            brandColors: {
              primary: brandColors.primary,
              accent: brandColors.accent || brandColors.secondary
            }
          }
        );

        await storage.createMessage({
          leadId: lead.id,
          userId,
          provider: 'email',
          direction: 'outbound',
          body: message,
          metadata: {
            auto_outreach: true,
            source: 'pdf_extraction'
          }
        });
      } catch (error) {
        console.error('Email outreach failed:', error);
      }
    }

    // Try WhatsApp if phone available
    if (lead.phone) {
      try {
        await sendWhatsAppMessage(
          userId,
          lead.phone,
          message,
          {
            button: offerData.link ? {
              text: 'Learn More',
              url: offerData.link
            } : undefined
          }
        );

        await storage.createMessage({
          leadId: lead.id,
          userId,
          provider: 'whatsapp',
          direction: 'outbound',
          body: message,
          metadata: {
            auto_outreach: true,
            source: 'pdf_extraction'
          }
        });
      } catch (error) {
        console.error('WhatsApp outreach failed:', error);
      }
    }
  } catch (error) {
    console.error('Auto-reach out error:', error);
  }
}

/**
 * Extract leads using OpenAI for better accuracy
 */
async function extractLeadsWithAI(text: string): Promise<Array<{
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}>> {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Extract all lead contact information from the text. Look for names, email addresses, phone numbers, and company names. Return a JSON array of objects with fields: name, email, phone, company. Be thorough and accurate.'
      }, {
        role: 'user',
        content: text.substring(0, 8000)
      }],
      response_format: { type: 'json_object' },
      max_completion_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.leads || [];
  } catch (error) {
    console.error('AI lead extraction failed:', error);
    return [];
  }
}

/**
 * Parse leads from text using advanced regex patterns (fallback)
 */
function parseLeadsFromText(text: string): Array<{
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}> {
  const leads: Array<{
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  }> = [];

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const nameRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\b/g;
  const companyRegex = /\b([A-Z][A-Za-z0-9\s&]+(?:Inc|LLC|Corp|Ltd|Limited|Co|Company|Group|Solutions|Technologies)\.?)\b/g;

  const emailMap = new Map<string, string>();
  const phoneMap = new Map<string, string>();
  const companyMap = new Map<string, string>();

  for (const line of lines) {
    const lineEmail = line.match(emailRegex)?.[0];
    const lineName = line.match(nameRegex)?.[0];
    const linePhone = line.match(phoneRegex)?.[0];
    const lineCompany = line.match(companyRegex)?.[0];

    if (lineName) {
      if (lineEmail) emailMap.set(lineName, lineEmail);
      if (linePhone) phoneMap.set(lineName, linePhone.replace(/\D/g, ''));
      if (lineCompany) companyMap.set(lineName, lineCompany);
    }
  }

  const names = text.match(nameRegex) || [];
  const uniqueNames = new Set(names);

  for (const name of uniqueNames) {
    leads.push({
      name,
      email: emailMap.get(name),
      phone: phoneMap.get(name),
      company: companyMap.get(name)
    });
  }

  if (leads.length === 0) {
    const emails = text.match(emailRegex) || [];
    for (const email of emails) {
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      const capitalizedName = namePart.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      leads.push({ name: capitalizedName, email });
    }
  }

  return leads;
}

/**
 * Export leads to CSV format
 */
export async function exportLeadsToCSV(userId: string): Promise<string> {
  const leads = await storage.getLeads({ userId, limit: 10000 });

  const headers = ['Name', 'Email', 'Phone', 'Company', 'Channel', 'Status', 'Score', 'Created At'];
  const rows = leads.map(lead => [
    lead.name,
    lead.email || '',
    lead.phone || '',
    lead.metadata?.company || '',
    lead.channel,
    lead.status,
    lead.score || 0,
    new Date(lead.createdAt).toISOString()
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
}
