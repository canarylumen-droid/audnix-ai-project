
import { supabaseAdmin } from './supabase-admin';

interface PDFProcessingResult {
  success: boolean;
  leads?: Array<{
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  }>;
  error?: string;
}

/**
 * Process PDF file and extract lead information
 */
export async function processPDF(
  fileBuffer: Buffer,
  userId: string
): Promise<PDFProcessingResult> {
  try {
    // Import pdf-parse dynamically
    const pdfParse = require('pdf-parse');
    
    // Extract text from PDF
    const data = await pdfParse(fileBuffer);
    const text = data.text;
    
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'PDF appears to be empty or contains only images'
      };
    }
    
    // Parse text for lead information
    const leads = parseLeadsFromText(text);
    
    if (leads.length === 0) {
      return {
        success: false,
        error: 'No valid lead data found in PDF. Expected format: name, email, phone, or company information'
      };
    }
    
    // Save leads to database if Supabase is configured
    if (supabaseAdmin) {
      for (const lead of leads) {
        await supabaseAdmin.from('leads').insert({
          user_id: userId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          channel: 'manual',
          status: 'new',
          source: 'pdf_import',
          created_at: new Date().toISOString()
        });
      }
    }
    
    return {
      success: true,
      leads
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process PDF'
    };
  }
}

/**
 * Parse leads from extracted text using advanced regex patterns
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
  
  // Split text into lines for better parsing
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract all emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  
  // Extract all phone numbers (various formats)
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = text.match(phoneRegex) || [];
  
  // Extract names (capitalized words, 2-4 words)
  const nameRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\b/g;
  const names = text.match(nameRegex) || [];
  
  // Extract company names (look for Inc, LLC, Corp, Ltd, etc.)
  const companyRegex = /\b([A-Z][A-Za-z0-9\s&]+(?:Inc|LLC|Corp|Ltd|Limited|Co|Company|Group|Solutions|Technologies|Consulting)\.?)\b/g;
  const companies = text.match(companyRegex) || [];
  
  // Create a map to associate data
  const emailMap = new Map<string, string>();
  const phoneMap = new Map<string, string>();
  const companyMap = new Map<string, string>();
  
  // Try to associate emails with names by proximity
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineEmail = line.match(emailRegex)?.[0];
    const lineName = line.match(nameRegex)?.[0];
    const linePhone = line.match(phoneRegex)?.[0];
    const lineCompany = line.match(companyRegex)?.[0];
    
    if (lineName) {
      if (lineEmail) emailMap.set(lineName, lineEmail);
      if (linePhone) phoneMap.set(lineName, linePhone);
      if (lineCompany) companyMap.set(lineName, lineCompany);
    }
  }
  
  // Build leads from names with associated data
  const uniqueNames = new Set(names);
  for (const name of uniqueNames) {
    const lead: any = { name };
    
    if (emailMap.has(name)) lead.email = emailMap.get(name);
    if (phoneMap.has(name)) lead.phone = phoneMap.get(name)?.replace(/\D/g, '');
    if (companyMap.has(name)) lead.company = companyMap.get(name);
    
    leads.push(lead);
  }
  
  // If no names found but we have emails, create leads from emails
  if (leads.length === 0 && emails.length > 0) {
    for (const email of emails) {
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      const capitalizedName = namePart.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      leads.push({
        name: capitalizedName,
        email: email
      });
    }
  }
  
  return leads;
}
