
import { supabaseAdmin } from './supabase-admin';
import { storage } from '../storage';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

interface PDFProcessingResult {
  success: boolean;
  leadsCreated: number;
  offerExtracted?: {
    productName: string;
    description: string;
    price?: string;
    link?: string;
    features: string[];
    benefits: string[];
  };
  leads?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  }>;
  error?: string;
}

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
    
    const data = await pdfParse(fileBuffer);
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
    if (options?.extractOffer) {
      offerData = await extractOfferWithAI(text, userId);
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
        const lead = await storage.createLead({
          userId,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          channel: 'manual',
          status: 'new',
          source: 'pdf_import',
          metadata: {
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
          company: lead.company || undefined
        });

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
      offerExtracted: offerData
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
 * Extract offer/product information from PDF using AI
 */
async function extractOfferWithAI(text: string, userId: string): Promise<any> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key') {
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Extract product/service/offer information from this document. Identify the main offering, pricing, features, benefits, and any links or CTAs. Return detailed JSON.'
      }, {
        role: 'user',
        content: text.substring(0, 12000)
      }],
      response_format: { type: 'json_object' },
      max_completion_tokens: 800
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Store offer in user's profile for future auto-responses
    if (result.productName) {
      await storage.updateUser(userId, {
        metadata: {
          extracted_offer: result,
          offer_updated_at: new Date().toISOString()
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Offer extraction error:', error);
    return null;
  }
}

/**
 * Auto-reach out to leads via email or WhatsApp with offer info
 */
async function autoReachOutToLead(
  userId: string,
  lead: any,
  offerData: any
): Promise<void> {
  try {
    const { sendEmail } = await import('./channels/email');
    const { sendWhatsAppMessage } = await import('./channels/whatsapp');

    const message = `Hey ${lead.name}! I noticed you might be interested in ${offerData.productName}. ${offerData.description}

${offerData.features?.slice(0, 3).map((f: string) => `✓ ${f}`).join('\n')}

${offerData.price ? `Investment: ${offerData.price}` : ''}
${offerData.link ? `Learn more: ${offerData.link}` : ''}

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
            buttonText: 'Get Started',
            buttonUrl: offerData.link || '#',
            businessName: 'Your Business'
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
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key') {
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
    lead.company || '',
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
