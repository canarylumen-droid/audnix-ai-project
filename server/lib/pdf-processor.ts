
import { supabaseAdmin } from './supabase-admin';
import { storage } from '../storage';

interface PDFProcessingResult {
  success: boolean;
  leadsCreated: number;
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
 * Process PDF file and extract lead information with AI
 */
export async function processPDF(
  fileBuffer: Buffer,
  userId: string
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
    
    // Enhanced parsing with AI if available
    let parsedLeads = parseLeadsFromText(text);
    
    // Use OpenAI for better extraction if configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key') {
      try {
        parsedLeads = await extractLeadsWithAI(text);
      } catch (error) {
        console.warn('AI extraction failed, using regex fallback:', error);
      }
    }
    
    if (parsedLeads.length === 0) {
      return {
        success: false,
        leadsCreated: 0,
        error: 'No valid lead data found in PDF'
      };
    }
    
    // Create leads in database
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
          source: 'pdf_import'
        });
        
        createdLeads.push({
          id: lead.id,
          name: lead.name,
          email: lead.email || undefined,
          phone: lead.phone || undefined,
          company: lead.company || undefined
        });
      } catch (error) {
        console.error('Error creating lead:', error);
      }
    }
    
    return {
      success: true,
      leadsCreated: createdLeads.length,
      leads: createdLeads
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
 * Extract leads using OpenAI for better accuracy
 */
async function extractLeadsWithAI(text: string): Promise<Array<{
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}>> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Extract all lead information from the text. Return a JSON array of objects with fields: name, email, phone, company. Be thorough and accurate.'
      }, {
        role: 'user',
        content: text.substring(0, 8000) // Limit to avoid token limits
      }],
      response_format: { type: 'json_object' }
    })
  });
  
  if (!response.ok) {
    throw new Error('OpenAI extraction failed');
  }
  
  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return result.leads || [];
}

/**
 * Parse leads from text using advanced regex patterns
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
