
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
    // Convert PDF to text
    const text = await extractTextFromPDF(fileBuffer);
    
    // Parse text for lead information
    const leads = parseLeadsFromText(text);
    
    if (leads.length === 0) {
      return {
        success: false,
        error: 'No valid lead data found in PDF'
      };
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
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Basic text extraction - looks for common patterns
  const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
  return text;
}

/**
 * Parse leads from extracted text
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
  
  // Extract emails
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = text.match(emailRegex) || [];
  
  // Extract phone numbers
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex) || [];
  
  // Extract names (capitalized words)
  const nameRegex = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
  const names = text.match(nameRegex) || [];
  
  // Combine into leads
  const maxLength = Math.max(emails.length, phones.length, names.length);
  
  for (let i = 0; i < maxLength; i++) {
    const lead: any = {};
    
    if (names[i]) lead.name = names[i];
    if (emails[i]) lead.email = emails[i];
    if (phones[i]) lead.phone = phones[i].replace(/\D/g, '');
    
    // Only add if we have at least a name or email
    if (lead.name || lead.email) {
      leads.push(lead);
    }
  }
  
  return leads;
}
