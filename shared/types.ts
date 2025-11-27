export interface PDFProcessingResult {
  success: boolean;
  leadsCreated: number;
  text?: string;
  confidence?: number | null;
  missingFields?: string[];
  offerExtracted?: {
    productName: string;
    description: string;
    price?: string;
    link?: string;
    features: string[];
    benefits: string[];
    cta?: string;
    supportEmail?: string;
  };
  brandExtracted?: {
    colors: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
    companyName?: string;
    tagline?: string;
    website?: string;
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

export interface AIResponse {
  content: string;
  reasoning?: string;
  suggestedActions?: string[];
  confidence?: number;
}

export interface FollowUpTask {
  id: string;
  userId: string;
  leadId: string;
  channel: 'email' | 'whatsapp' | 'instagram';
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastError?: string;
  context: Record<string, any>;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: Date;
}

export interface WorkerHealthStatus {
  name: string;
  isRunning: boolean;
  lastHeartbeat?: Date;
  processedCount: number;
  errorCount: number;
  avgProcessingTime?: number;
}

export type SubscriptionTier = 'free' | 'trial' | 'starter' | 'pro' | 'enterprise';
export type PlanType = 'trial' | 'starter' | 'pro' | 'enterprise';
export type ChannelType = 'email' | 'whatsapp' | 'instagram';
export type LeadStatus = 'new' | 'open' | 'replied' | 'converted' | 'not_interested' | 'cold';
export type MessageDirection = 'inbound' | 'outbound';
