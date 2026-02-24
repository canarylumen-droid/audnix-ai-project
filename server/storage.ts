import { drizzleStorage } from "./drizzle-storage.js";
import { type User, type InsertUser, type Lead, type InsertLead, type Message, type InsertMessage, type Integration, type InsertIntegration, type FollowUpQueue, type InsertFollowUpQueue, type OAuthAccount, type InsertOAuthAccount, type CalendarEvent, type InsertCalendarEvent, type AuditTrail, type InsertAuditTrail, type Organization, type InsertOrganization, type TeamMember, type InsertTeamMember, type Payment, type InsertPayment, type AiLearningPattern, type InsertAiLearningPattern, type SmtpSettings, type InsertSmtpSettings, type EmailMessage, type InsertEmailMessage, type Notification, type InsertNotification, type Thread, type InsertThread, type LeadInsight, type InsertLeadInsight, smtpSettings, users, leads, messages, integrations, followUpQueue, aiLearningPatterns, notifications, threads, leadInsights } from "../shared/schema.js";
import { randomUUID } from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./db.js";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser> & { email: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsers(): Promise<User[]>; // Alias for getAllUsers
  getUserCount(): Promise<number>;

  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getOrganizationsByOwner(ownerId: string): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;

  // Team Member methods
  getTeamMember(orgId: string, userId: string): Promise<TeamMember | undefined>;
  getOrganizationMembers(orgId: string): Promise<(TeamMember & { user: User })[]>;
  getUserOrganizations(userId: string): Promise<(Organization & { role: TeamMember["role"] })[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(orgId: string, userId: string): Promise<void>;

  // Lead methods
  getLeads(options: { userId: string; status?: string; channel?: string; search?: string; limit?: number; offset?: number; includeArchived?: boolean }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getLeadByEmail(email: string, userId: string): Promise<Lead | undefined>;
  getExistingEmails(userId: string, emails: string[]): Promise<string[]>;
  getLeadsCount(userId: string): Promise<number>;
  getLeadByUsername(username: string, channel: string): Promise<Lead | undefined>;
  getLeadBySocialId(socialId: string, channel: string): Promise<Lead | undefined>;
  createLead(lead: Partial<InsertLead> & { userId: string; name: string; channel: string }, options?: { suppressNotification?: boolean }): Promise<Lead>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined>;
  archiveLead(id: string, userId: string, archived: boolean): Promise<Lead | undefined>;
  deleteLead(id: string, userId: string): Promise<void>;
  archiveMultipleLeads(ids: string[], userId: string, archived: boolean): Promise<void>;
  deleteMultipleLeads(ids: string[], userId: string): Promise<void>;
  getTotalLeadsCount(): Promise<number>;
  getEmailMessages(userId: string): Promise<EmailMessage[]>;
  createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage>;
  createAuditLog(data: InsertAuditTrail): Promise<AuditTrail>;
  getAuditLogs(userId: string): Promise<AuditTrail[]>;

  // Message methods
  getMessagesByLeadId(leadId: string): Promise<Message[]>;
  getMessages(leadId: string): Promise<Message[]>; // Alias for getMessagesByLeadId
  getAllMessages(userId: string, options?: { limit?: number; channel?: string }): Promise<Message[]>;
  createMessage(message: Partial<InsertMessage> & { leadId: string; userId: string; direction: "inbound" | "outbound"; body: string; threadId?: string }): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined>;
  getMessageByTrackingId(trackingId: string): Promise<Message | undefined>;
  getEmailMessageByMessageId(messageId: string): Promise<EmailMessage | undefined>;

  // Draft methods
  getDraftByLeadId(userId: string, leadId: string): Promise<MessageDraft | undefined>;
  saveDraft(userId: string, leadId: string, content: string, subject?: string, channel?: string): Promise<MessageDraft>;
  deleteDraft(userId: string, leadId: string): Promise<void>;

  // Thread methods
  getOrCreateThread(userId: string, leadId: string, subject: string, providerThreadId?: string): Promise<Thread>;
  getThreadsByLeadId(leadId: string): Promise<Thread[]>;
  updateThread(id: string, updates: Partial<Thread>): Promise<Thread | undefined>;

  // Integration methods
  getIntegrations(userId: string): Promise<Integration[]>;
  getIntegration(userId: string, provider: string): Promise<Integration | undefined>;
  getIntegrationsByProvider(provider: string): Promise<Integration[]>;
  createIntegration(integration: Partial<InsertIntegration> & { userId: string; provider: string; encryptedMeta: string }): Promise<Integration>;
  updateIntegration(userId: string, provider: string, updates: Partial<Integration>): Promise<Integration | undefined>;
  disconnectIntegration(userId: string, provider: string): Promise<void>;
  deleteIntegration(userId: string, provider: string): Promise<void>;

  // (Notification methods defined below with proper types)

  // Video monitor methods
  getVideoMonitors(userId: string): Promise<any[]>;
  createVideoMonitor(data: any): Promise<any>;
  updateVideoMonitor(id: string, userId: string, updates: any): Promise<any>;
  deleteVideoMonitor(id: string, userId: string): Promise<void>;
  isCommentProcessed(commentId: string): Promise<boolean>;
  markCommentProcessed(commentId: string, status: string, intentType: string): Promise<void>;
  getBrandKnowledge(userId: string): Promise<string>;

  // Deal tracking methods
  getDeals(userId: string): Promise<any[]>;
  createDeal(data: any): Promise<any>;
  updateDeal(id: string, userId: string, updates: any): Promise<any>;
  calculateRevenue(userId: string): Promise<{ total: number; thisMonth: number; deals: any[] }>;

  // Payment methods
  createPayment(data: InsertPayment): Promise<Payment>;
  getPayments(userId: string): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Usage tracking
  createUsageTopup(data: any): Promise<any>;
  getUsageHistory(userId: string, type?: string): Promise<any[]>;

  // Onboarding methods
  createOnboardingProfile(data: any): Promise<any>;
  getOnboardingProfile(userId: string): Promise<any | undefined>;
  updateOnboardingProfile(userId: string, updates: any): Promise<any | undefined>;

  // OTP methods
  createOtpCode(data: { email: string; code: string; expiresAt: Date; attempts: number; verified: boolean; passwordHash?: string; purpose?: string }): Promise<any>;
  getLatestOtpCode(email: string, purpose?: string): Promise<any>;
  incrementOtpAttempts(id: string): Promise<void>;
  markOtpVerified(id: string): Promise<void>;
  cleanupDemoData(): Promise<{ deletedUsers: number }>;

  // SMTP Settings
  getSmtpSettings(userId: string): Promise<SmtpSettings[]>;

  // Follow Up Queue
  createFollowUp(data: InsertFollowUpQueue): Promise<FollowUpQueue>;
  getPendingFollowUp(leadId: string): Promise<FollowUpQueue | undefined>;
  getFollowUpById(id: string): Promise<FollowUpQueue | undefined>;
  updateFollowUp(id: string, updates: Partial<FollowUpQueue>): Promise<FollowUpQueue | undefined>;
  getDueFollowUps(): Promise<FollowUpQueue[]>;

  // AI Learning Patterns
  getLearningPatterns(userId: string): Promise<AiLearningPattern[]>;
  recordLearningPattern(userId: string, key: string, success: boolean): Promise<void>;

  // OAuth Accounts
  getOAuthAccount(userId: string, provider: string): Promise<OAuthAccount | undefined>;
  getSoonExpiringOAuthAccounts(provider: string, thresholdMinutes: number): Promise<OAuthAccount[]>;
  saveOAuthAccount(data: InsertOAuthAccount): Promise<OAuthAccount>;
  deleteOAuthAccount(userId: string, provider: string): Promise<void>;

  // Reputation & Delivery
  getRecentBounces(userId: string, hours?: number): Promise<any[]>;
  getDomainVerifications(userId: string, limit?: number): Promise<any[]>;

  // Permanent Email Storage
  createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage>;
  getEmailMessages(userId: string): Promise<EmailMessage[]>;

  // Calendar Events
  createCalendarEvent(data: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvents(userId: string): Promise<CalendarEvent[]>;

  // Lead Insight methods
  getLeadInsight(leadId: string): Promise<LeadInsight | undefined>;
  upsertLeadInsight(insight: InsertLeadInsight): Promise<LeadInsight>;

  // Voice Balance
  getVoiceMinutesBalance(userId: string): Promise<number>;

  // Analytics
  getAnalyticsSummary(userId: string, startDate: Date): Promise<{
    summary: {
      totalLeads: number;
      conversions: number;
      conversionRate: string;
      active: number;
      ghosted: number;
      notInterested: number;
      leadsReplied: number;
      bestReplyHour: number | null;
    };
    channelBreakdown: Array<{ channel: string; count: number; percentage: number }>;
    statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
    timeline: Array<{ date: string; leads: number; conversions: number }>;
    positiveSentimentRate: string;
  }>;

  // Gmail/Outlook
  getEmailMessageByMessageId(messageId: string): Promise<EmailMessage | undefined>;

  // Notifications
  getNotifications(userId: string, opts?: { limit?: number; offset?: number; dateFrom?: Date; dateTo?: Date }): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string, userId?: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  clearAllNotifications(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;

  getDashboardStats(userId: string, overrideDates?: { start: Date; end: Date }): Promise<{
    totalLeads: number;
    newLeads: number;
    activeLeads: number;
    convertedLeads: number;
    hardenedLeads: number;
    bouncyLeads: number;
    recoveredLeads: number;
    positiveIntents: number;
    totalMessages: number;
    messagesToday: number;
    messagesYesterday: number;
    pipelineValue: number;
    closedRevenue: number;
    openRate: number;
    responseRate: number;
    averageResponseTime: string;
  }>;

  getAnalyticsFull(userId: string, days: number): Promise<{
    metrics: {
      sent: number;
      opened: number;
      replied: number;
      booked: number;
      leadsFiltered: number;
      conversionRate: number;
      responseRate: number;
      openRate: number;
      closedRevenue: number;
    };
    timeSeries: Array<{
      name: string;
      sent_email: number;
      sent_instagram: number;
      opened: number;
      replied_email: number;
      replied_instagram: number;
      booked: number;
    }>;
    channelPerformance: Array<{ channel: string; value: number }>;
    recentEvents: Array<{ id: string; type: string; description: string; time: string; isNew: boolean }>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leads: Map<string, Lead>;
  private messages: Map<string, Message>;
  private integrations: Map<string, Integration>;
  private organizations: Map<string, Organization>;
  private teamMembers: Map<string, TeamMember>;
  private payments: Map<string, Payment>;
  private threads: Map<string, Thread>;
  private leadInsightsStore: Map<string, LeadInsight>;

  private followUps: Map<string, FollowUpQueue>;
  private learningPatterns: Map<string, AiLearningPattern>;
  private emailMessages: Map<string, EmailMessage>;
  private auditLogs: Map<string, AuditTrail>;
  private calendarEvents: Map<string, CalendarEvent>;
  private otpCodes: Map<string, any>;
  private onboardingProfiles: Map<string, any>;
  private usageTopups: Map<string, any[]>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.messages = new Map();
    this.integrations = new Map();
    this.organizations = new Map();
    this.teamMembers = new Map();
    this.payments = new Map();
    this.threads = new Map();
    this.leadInsightsStore = new Map();
    this.followUps = new Map();
    this.learningPatterns = new Map();
    this.emailMessages = new Map();
    this.auditLogs = new Map();
    this.calendarEvents = new Map();
    this.otpCodes = new Map();
    this.onboardingProfiles = new Map();
    this.usageTopups = new Map();
    this.notifications = new Map();
  }

  async getVoiceMinutesBalance(userId: string): Promise<number> {
    const user = this.users.get(userId);
    return (Number(user?.voiceMinutesUsed) || 0) + (Number(user?.voiceMinutesTopup) || 0);
  }

  async getExistingEmails(userId: string, emails: string[]): Promise<string[]> {
    const userLeads = Array.from(this.leads.values()).filter(l => l.userId === userId);
    return emails.filter(e => userLeads.some(l => l.email === e));
  }

  async getLeadsCount(userId: string): Promise<number> {
    return Array.from(this.leads.values()).filter(l => l.userId === userId).length;
  }

  // --- Organization Methods ---
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(o => o.slug === slug);
  }

  async getOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
    return Array.from(this.organizations.values()).filter(o => o.ownerId === ownerId);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const newOrg: Organization = {
      ...org,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      slug: org.slug ?? null,
      stripeCustomerId: org.stripeCustomerId ?? null,
      subscriptionId: org.subscriptionId ?? null,
      plan: org.plan ?? "trial",
      metadata: org.metadata ?? {}
    };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    const updated = { ...org, ...updates, updatedAt: new Date() };
    this.organizations.set(id, updated);
    return updated;
  }

  // --- Team Member Methods ---
  async getTeamMember(orgId: string, userId: string): Promise<TeamMember | undefined> {
    return Array.from(this.teamMembers.values()).find(m => m.organizationId === orgId && m.userId === userId);
  }

  async getOrganizationMembers(orgId: string): Promise<(TeamMember & { user: User })[]> {
    return Array.from(this.teamMembers.values())
      .filter(m => m.organizationId === orgId)
      .map(m => ({ ...m, user: this.users.get(m.userId)! }));
  }



  async getUserOrganizations(userId: string): Promise < (Organization & { role: TeamMember["role"] })[] > {
  return Array.from(this.teamMembers.values())
    .filter(m => m.userId === userId)
    .map(m => ({ ...this.organizations.get(m.organizationId)!, role: m.role }));
}

  async addTeamMember(member: InsertTeamMember): Promise < TeamMember > {
  const id = randomUUID();
  const newMember: TeamMember = {
    ...member,
    id,
    invitedAt: new Date(),
    acceptedAt: null,
    invitedBy: member.invitedBy ?? null,
    role: member.role ?? "member"
  };
  this.teamMembers.set(id, newMember);
  return newMember;
}

  async removeTeamMember(orgId: string, userId: string): Promise < void> {
  const member = Array.from(this.teamMembers.values()).find(m => m.organizationId === orgId && m.userId === userId);
  if(member) this.teamMembers.delete(member.id);
}

  async getFollowUpById(id: string): Promise < FollowUpQueue | undefined > {
  return Array.from(this.followUps.values()).find(f => f.id === id);
}
  async updateFollowUp(id: string, updates: Partial<FollowUpQueue>): Promise < FollowUpQueue | undefined > {
  const followUp = this.followUps.get(id);
  if(!followUp) return undefined;
  const updated = { ...followUp, ...updates, updatedAt: new Date() };
  this.followUps.set(id, updated);
  return updated;
}
  async getDueFollowUps(): Promise < FollowUpQueue[] > {
  const now = new Date();
  return Array.from(this.followUps.values())
    .filter(f => f.status === 'pending' && f.scheduledAt <= now)
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
}
  async getLearningPatterns(userId: string): Promise < AiLearningPattern[] > {
  return Array.from(this.learningPatterns.values()).filter(p => p.userId === userId);
}
  async recordLearningPattern(userId: string, key: string, success: boolean): Promise < void> {
  const id = randomUUID();
  const existing = Array.from(this.learningPatterns.values()).find(p => p.userId === userId && p.patternKey === key);
  if(existing) {
    existing.strength = success ? existing.strength + 1 : Math.max(0, existing.strength - 1);
    existing.lastUsedAt = new Date();
  } else {
    const now = new Date();
    this.learningPatterns.set(id, {
      id,
      userId,
      patternKey: key,
      strength: success ? 1 : 0,
      metadata: {},
      lastUsedAt: now,
      createdAt: now
    });
  }
}
  async createPayment(data: InsertPayment): Promise < Payment > {
  const id = randomUUID();
  const payment: Payment = {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    stripePaymentId: data.stripePaymentId ?? null,
    plan: data.plan ?? null,
    paymentLink: data.paymentLink ?? null,
    status: (data as any).status || "pending",
    currency: (data as any).currency || "USD",
    webhookPayload: (data as any).webhookPayload || {}
  };
  this.payments.set(id, payment);
  return payment;
}

  async getPayments(userId: string): Promise < Payment[] > {
  return Array.from(this.payments.values()).filter(p => p.userId === userId);
}

  async getPaymentById(id: string): Promise < Payment | undefined > {
  return this.payments.get(id);
}

  async updatePayment(id: string, updates: Partial<Payment>): Promise < Payment | undefined > {
  const payment = this.payments.get(id);
  if(!payment) return undefined;
  const updated = { ...payment, ...updates, updatedAt: new Date() };
  this.payments.set(id, updated);
  return updated;
}


  // ========== User Methods ==========

  async getPendingFollowUp(leadId: string): Promise < FollowUpQueue | undefined > {
  return Array.from(this.followUps.values()).find(f => f.leadId === leadId && f.status === 'pending');
}

  async getUser(id: string): Promise < User | undefined > {
  return this.users.get(id);
}

  async getUserById(id: string): Promise < User | undefined > {
  return this.users.get(id);
}

  async getUserByEmail(email: string): Promise < User | undefined > {
  return Array.from(this.users.values()).find(
    (user) => user.email === email,
  );
}

  async getUserByUsername(username: string): Promise < User | undefined > {
  return Array.from(this.users.values()).find(
    (user) => user.username === username,
  );
}

  async getUserBySupabaseId(supabaseId: string): Promise < User | undefined > {
  return Array.from(this.users.values()).find(
    (user) => user.supabaseId === supabaseId,
  );
}

  async createUser(insertUser: Partial<InsertUser> & { email: string }): Promise < User > {
  const id = randomUUID();
  const now = new Date();

  // Calculate trial expiry (3 days from now)
  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 3);

  const user: User = {
    id,
    supabaseId: insertUser.supabaseId || null,
    email: insertUser.email,
    password: insertUser.password || null,
    name: insertUser.name || null,
    username: insertUser.username || null,
    avatar: insertUser.avatar || null,
    company: insertUser.company || null,
    timezone: insertUser.timezone || "America/New_York",
    plan: insertUser.plan || "trial",
    subscriptionTier: insertUser.subscriptionTier || "free",
    trialExpiresAt: insertUser.trialExpiresAt || trialExpiry,
    replyTone: insertUser.replyTone || "professional",
    role: insertUser.role || "member",
    stripeCustomerId: insertUser.stripeCustomerId || null,
    stripeSubscriptionId: insertUser.stripeSubscriptionId || null,
    voiceCloneId: insertUser.voiceCloneId || null,
    voiceMinutesUsed: insertUser.voiceMinutesUsed || 0,
    voiceMinutesTopup: insertUser.voiceMinutesTopup || 0,
    businessName: insertUser.businessName || null,
    voiceRules: insertUser.voiceRules || null,
    pdfConfidenceThreshold: insertUser.pdfConfidenceThreshold || 0.7,
    lastInsightGeneratedAt: insertUser.lastInsightGeneratedAt || null,
    lastProspectScanAt: insertUser.lastProspectScanAt || null,
    paymentStatus: insertUser.paymentStatus || "none",
    pendingPaymentPlan: insertUser.pendingPaymentPlan || null,
    pendingPaymentAmount: insertUser.pendingPaymentAmount || null,
    pendingPaymentDate: insertUser.pendingPaymentDate || null,
    paymentApprovedAt: insertUser.paymentApprovedAt || null,
    stripeSessionId: insertUser.stripeSessionId || null,
    subscriptionId: insertUser.subscriptionId || null,
    metadata: insertUser.metadata || {},
    createdAt: now,
    lastLogin: now,
    updatedAt: now,
    calendarLink: insertUser.calendarLink || null,
    brandGuidelinePdfUrl: insertUser.brandGuidelinePdfUrl || null,
    brandGuidelinePdfText: insertUser.brandGuidelinePdfText || null,
    config: insertUser.config || {},
    filteredLeadsCount: insertUser.filteredLeadsCount || 0,
  };

  this.users.set(id, user);
  return user;
}

  async updateUser(id: string, updates: Partial<User>): Promise < User | undefined > {
  const user = this.users.get(id);
  if(!user) return undefined;

  const updatedUser = {
    ...user,
    ...updates,
    calendarLink: updates.calendarLink !== undefined ? updates.calendarLink : user.calendarLink,
    brandGuidelinePdfUrl: updates.brandGuidelinePdfUrl !== undefined ? updates.brandGuidelinePdfUrl : user.brandGuidelinePdfUrl,
    brandGuidelinePdfText: updates.brandGuidelinePdfText !== undefined ? updates.brandGuidelinePdfText : user.brandGuidelinePdfText,
    metadata: updates.metadata ? { ...user.metadata, ...updates.metadata } : user.metadata
  };
  this.users.set(id, updatedUser);
  return updatedUser;
}

  async getAllUsers(): Promise < User[] > {
  return Array.from(this.users.values());
}

  async getUserCount(): Promise < number > {
  return this.users.size;
}

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // ========== Lead Methods ==========

  async getLeads(options: { userId: string; status?: string; channel?: string; search?: string; limit?: number; includeArchived?: boolean }): Promise < Lead[] > {
  let leads = Array.from(this.leads.values()).filter(
    (lead) => lead.userId === options.userId
  );

  if(options.status) {
  leads = leads.filter((lead) => lead.status === options.status);
}

if (!options.includeArchived) {
  leads = leads.filter(lead => !lead.archived);
}

if (options.channel) {
  leads = leads.filter((lead) => lead.channel === options.channel);
}

if (options.search) {
  const searchLower = options.search.toLowerCase();
  leads = leads.filter((lead) =>
    lead.name.toLowerCase().includes(searchLower) ||
    lead.email?.toLowerCase().includes(searchLower) ||
    lead.phone?.includes(searchLower)
  );
}

leads = leads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

if (options.limit) {
  leads = leads.slice(0, options.limit);
}

return leads;
  }

  async getLead(id: string): Promise < Lead | undefined > {
  return this.leads.get(id);
}

  async getLeadById(id: string): Promise < Lead | undefined > {
  return this.getLead(id);
}

  async getLeadByUsername(username: string, channel: string): Promise < Lead | undefined > {
  return Array.from(this.leads.values()).find(lead =>
    lead.name.toLowerCase() === username.toLowerCase() &&
    lead.channel === channel
  );
}

  async getLeadByEmail(email: string, userId: string): Promise < Lead | undefined > {
  return Array.from(this.leads.values()).find(lead =>
    lead.email?.toLowerCase() === email.toLowerCase() &&
    lead.userId === userId
  );
}

  async getLeadBySocialId(socialId: string, channel: string): Promise < Lead | undefined > {
  return Array.from(this.leads.values()).find(lead =>
    lead.externalId === socialId &&
    lead.channel === channel
  );
}


  async createLead(insertLead: Partial<InsertLead> & { userId: string; name: string; channel: string }, options?: { suppressNotification?: boolean }): Promise<Lead> {
  const id = randomUUID();
  const now = new Date();

  const lead: Lead = {
    id,
    userId: insertLead.userId,
    organizationId: insertLead.organizationId || null,
    externalId: insertLead.externalId || null,
    name: insertLead.name,
    company: insertLead.company || null,
    role: insertLead.role || null,
    bio: insertLead.bio || null,
    snippet: insertLead.snippet || null,
    channel: insertLead.channel as "instagram" | "email",
    email: insertLead.email || null,
    replyEmail: insertLead.replyEmail || insertLead.email || null,
    phone: insertLead.phone || null,
    status: (insertLead.status as any) || "new",
    score: insertLead.score || 0,
    warm: insertLead.warm || false,
    lastMessageAt: insertLead.lastMessageAt || null,
    aiPaused: insertLead.aiPaused || false,
    verified: insertLead.verified || false,
    verifiedAt: insertLead.verifiedAt || null,
    pdfConfidence: insertLead.pdfConfidence || null,
    archived: insertLead.archived || false,
    tags: insertLead.tags || [],
    metadata: insertLead.metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  this.leads.set(id, lead);
  return lead;
}

  async updateLead(id: string, updates: Partial<Lead>): Promise < Lead | undefined > {
  const lead = this.leads.get(id);
  if(!lead) return undefined;

  const updatedLead = { ...lead, ...updates, updatedAt: new Date() };
  this.leads.set(id, updatedLead);
  return updatedLead;
}

  async getTotalLeadsCount(): Promise < number > {
  return this.leads.size;
}

  async archiveLead(id: string, userId: string, archived: boolean): Promise < Lead | undefined > {
  const lead = this.leads.get(id);
  if(!lead || lead.userId !== userId) return undefined;
const updated = { ...lead, archived, updatedAt: new Date() };
this.leads.set(id, updated);
return updated;
  }

  async deleteLead(id: string, userId: string): Promise < void> {
  const lead = this.leads.get(id);
  if(lead && lead.userId === userId) {
  this.leads.delete(id);
}
  }

  async archiveMultipleLeads(ids: string[], userId: string, archived: boolean): Promise < void> {
  for(const id of ids) {
    const lead = this.leads.get(id);
    if (lead && lead.userId === userId) {
      this.leads.set(id, { ...lead, archived, updatedAt: new Date() });
    }
  }
}

  async deleteMultipleLeads(ids: string[], userId: string): Promise < void> {
  for(const id of ids) {
    const lead = this.leads.get(id);
    if (lead && lead.userId === userId) {
      this.leads.delete(id);
    }
  }
}


  async getCalendarEvents(userId: string): Promise < CalendarEvent[] > {
  return Array.from(this.calendarEvents.values())
    .filter(e => e.userId === userId)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

  // ========== Message Methods ==========

  async getMessagesByLeadId(leadId: string): Promise < Message[] > {
  return Array.from(this.messages.values())
    .filter((msg) => msg.leadId === leadId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

  async getMessages(leadId: string): Promise < Message[] > {
  return this.getMessagesByLeadId(leadId);
}

  async getAllMessages(userId: string, options ?: { limit?: number; channel?: string }): Promise < Message[] > {
  let msgs = Array.from(this.messages.values())
    .filter((msg) => msg.userId === userId);

  if(options?.channel) {
    msgs = msgs.filter((msg) => msg.provider === options.channel);
  }

    msgs = msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if(options?.limit) {
    msgs = msgs.slice(0, options.limit);
  }

    return msgs;
}

  async createMessage(message: Partial<InsertMessage> & { leadId: string; userId: string; direction: "inbound" | "outbound"; body: string; threadId?: string }): Promise < Message > {
    const id = randomUUID();
    const now = new Date();
    const threadId = message.threadId || null;

    const newMessage: Message = {
      id,
      leadId: message.leadId,
      userId: message.userId,
      threadId: threadId as any,
      provider: message.provider || "instagram",
      direction: message.direction,
      subject: message.subject || null,
      body: message.body,
      audioUrl: message.audioUrl || null,
      trackingId: message.trackingId || null,
      openedAt: message.openedAt || null,
      clickedAt: message.clickedAt || null,
      repliedAt: message.repliedAt || null,
      isRead: message.isRead ?? (message.direction === 'outbound'),
      metadata: message.metadata || {},
      createdAt: now,
    };

    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getOrCreateThread(userId: string, leadId: string, subject: string, providerThreadId?: string): Promise<Thread> {
    const existing = Array.from(this.threads.values()).find(t => 
      t.userId === userId && 
      t.leadId === leadId && 
      (providerThreadId ? (t.metadata as any)?.providerThreadId === providerThreadId : true)
    );

    if (existing) return existing;

    const id = randomUUID();
    const newThread: Thread = {
      id,
      userId,
      leadId,
      subject,
      lastMessageAt: new Date(),
      metadata: providerThreadId ? { providerThreadId } : {},
      createdAt: new Date(),
    };
    this.threads.set(id, newThread);
    return newThread;
  }

  async getThreadsByLeadId(leadId: string): Promise<Thread[]> {
    return Array.from(this.threads.values()).filter(t => t.leadId === leadId);
  }

  async updateThread(id: string, updates: Partial<Thread>): Promise<Thread | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;
    const updated = { ...thread, ...updates };
    this.threads.set(id, updated);
    return updated;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise < Message | undefined > {
  const message = this.messages.get(id);
  if(!message) return undefined;
  const updated = { ...message, ...updates };
  this.messages.set(id, updated);
  return updated;
}

  async getMessageByTrackingId(trackingId: string): Promise < Message | undefined > {
  return Array.from(this.messages.values()).find(m => m.trackingId === trackingId);
}

  // ========== Integration Methods ==========

  async getIntegrations(userId: string): Promise < Integration[] > {
  return Array.from(this.integrations.values()).filter(
    (integration) => integration.userId === userId
  );
}

  async getIntegration(userId: string, provider: string): Promise < Integration | undefined > {
  return Array.from(this.integrations.values()).find(
    (integration) => integration.userId === userId && integration.provider === provider
  );
}

  async getIntegrationsByProvider(provider: string): Promise < Integration[] > {
  return Array.from(this.integrations.values()).filter(
    (integration) => integration.provider === provider
  );
}

  async createIntegration(integration: Partial<InsertIntegration> & { userId: string; provider: string; encryptedMeta: string }): Promise < Integration > {
  const id = randomUUID();
  const now = new Date();

  const newIntegration: Integration = {
    id,
    userId: integration.userId,
    provider: integration.provider as any,
    encryptedMeta: integration.encryptedMeta,
    connected: integration.connected ?? true,
    accountType: integration.accountType || null,
    lastSync: integration.lastSync || null,
    createdAt: now,
    updatedAt: now,
  };

  this.integrations.set(id, newIntegration);
  return newIntegration;
}

  async updateIntegration(userId: string, provider: string, updates: Partial<Integration>): Promise < Integration | undefined > {
  const integration = Array.from(this.integrations.values()).find(
    (i) => i.userId === userId && i.provider === provider
  );

  if(!integration) return undefined;

  const updated = { ...integration, ...updates };
  this.integrations.set(integration.id, updated);
  return updated;
}

  async disconnectIntegration(userId: string, provider: string): Promise < void> {
  const integration = Array.from(this.integrations.values()).find(
    (i) => i.userId === userId && i.provider === provider
  );

  if(integration) {
    this.integrations.delete(integration.id);
  }
}

  async deleteIntegration(userId: string, provider: string): Promise < void> {
  return this.disconnectIntegration(userId, provider);
}


  // Video monitor methods
  private videoMonitors: Map<string, any> = new Map();
  private processedComments: Set<string> = new Set();
  private brandKnowledge: Map<string, string> = new Map();

  async getVideoMonitors(userId: string): Promise < any[] > {
  return Array.from(this.videoMonitors.values()).filter(m => m.userId === userId);
}

  async createVideoMonitor(data: any): Promise < any > {
  const id = randomUUID();
  const monitor = { id, ...data, createdAt: new Date() };
  this.videoMonitors.set(id, monitor);
  return monitor;
}

  async updateVideoMonitor(id: string, userId: string, updates: any): Promise < any > {
  const monitor = this.videoMonitors.get(id);
  if(!monitor || monitor.userId !== userId) return null;

const updated = { ...monitor, ...updates };
this.videoMonitors.set(id, updated);
return updated;
  }

  async deleteVideoMonitor(id: string, userId: string): Promise < void> {
  const monitor = this.videoMonitors.get(id);
  if(monitor && monitor.userId === userId) {
  this.videoMonitors.delete(id);
}
  }

  async isCommentProcessed(commentId: string): Promise < boolean > {
  return this.processedComments.has(commentId);
}

  async markCommentProcessed(commentId: string, status: string, intentType: string): Promise < void> {
  this.processedComments.add(commentId);
}

  async getBrandKnowledge(userId: string): Promise < string > {
  return this.brandKnowledge.get(userId) || '';
}

  // Deal tracking
  private deals: Map<string, any> = new Map();

  async getDeals(userId: string): Promise < any[] > {
  return Array.from(this.deals.values()).filter(d => d.userId === userId);
}

  async createDeal(data: any): Promise < any > {
  const id = randomUUID();
  const deal = { id, ...data, createdAt: new Date() };
  this.deals.set(id, deal);
  return deal;
}

  async updateDeal(id: string, userId: string, updates: any): Promise < any > {
  const deal = this.deals.get(id);
  if(!deal || deal.userId !== userId) return null;

const updated = { ...deal, ...updates, updatedAt: new Date() };
this.deals.set(id, updated);
return updated;
  }

  async calculateRevenue(userId: string): Promise < { total: number; thisMonth: number; deals: any[] } > {
  const deals = await this.getDeals(userId);
  const closedDeals = deals.filter(d => d.status === 'closed_won');

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = closedDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const thisMonth = closedDeals
    .filter(d => d.convertedAt && new Date(d.convertedAt) >= thisMonthStart)
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return { total, thisMonth, deals: closedDeals };
}

  // Usage tracking
  private usageHistory: Map<string, any[]> = new Map();

  async createUsageTopup(data: any): Promise < any > {
  const id = randomUUID();
  const now = new Date();
  const topup = { id, ...data, createdAt: now };

  if(!this.usageHistory.has(data.userId)) {
  this.usageHistory.set(data.userId, []);
}
this.usageHistory.get(data.userId)!.push(topup);
return topup;
  }

  async getUsageHistory(userId: string, type ?: string): Promise < any[] > {
  let history = this.usageHistory.get(userId) || [];
  if(type) {
    history = history.filter(item => item.type === type);
  }
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

  async getSmtpSettings(userId: string): Promise < SmtpSettings[] > {
  return [];
}

  async getRecentBounces(userId: string, hours: number = 168): Promise < any[] > {
  return [];
}

  async getDomainVerifications(userId: string, limit: number = 10): Promise < any[] > {
  return [];
}

  // Onboarding methods

  async createOnboardingProfile(data: any): Promise < any > {
  const id = randomUUID();
  const now = new Date();
  const profile = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  this.onboardingProfiles.set(data.userId, profile);
  return profile;
}

  async getOnboardingProfile(userId: string): Promise < any | undefined > {
  return this.onboardingProfiles.get(userId);
}

  async updateOnboardingProfile(userId: string, updates: any): Promise < any | undefined > {
  const existing = this.onboardingProfiles.get(userId);
  if(!existing) return undefined;

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  this.onboardingProfiles.set(userId, updated);
  return updated;
}

  // OTP methods (MemStorage implementation)

  async createOtpCode(data: { email: string; code: string; expiresAt: Date; attempts: number; verified: boolean; passwordHash?: string; purpose?: string }): Promise < any > {
  const id = randomUUID();
  const now = new Date();
  const otpCode = { id, ...data, purpose: data.purpose || 'login', createdAt: now, updatedAt: now };
  this.otpCodes.set(id, otpCode);
  return otpCode;
}

  async getLatestOtpCode(email: string, purpose ?: string): Promise < any > {
  // In-memory, this is inefficient, but for demonstration:
  return Array.from(this.otpCodes.values())
    .filter(code => code.email === email && (!purpose || code.purpose === purpose))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

  async incrementOtpAttempts(id: string): Promise < void> {
  const code = this.otpCodes.get(id);
  if(code) {
    code.attempts++;
    code.updatedAt = new Date();
    this.otpCodes.set(id, code);
  }
}

  async markOtpVerified(id: string): Promise < void> {
  const code = this.otpCodes.get(id);
  if(code) {
    code.verified = true;
    code.updatedAt = new Date();
    this.otpCodes.set(id, code);
  }
}

  async cleanupDemoData(): Promise < { deletedUsers: number } > {
  let deletedCount = 0;
  for(const [id, user] of this.users.entries()) {
  if (user.email.toLowerCase().endsWith('@demo.com')) {
    this.users.delete(id);
    deletedCount++;
  }
}
return { deletedUsers: deletedCount };
  }

  // getUserByEmail is already defined above for User, but for OTP context, we might need to return null if not found.
  // The interface definition for IStorage already has a getUserByEmail that returns User | null.
  // If the existing implementation returns undefined and needs to return null, it would be changed.
  // For now, assuming the existing getUserByEmail is compatible or will be adjusted.
  // If a distinct getUserByEmail for OTP context is needed, it would be implemented here.

  // ========== Follow Up Queue ==========

  async createFollowUp(data: InsertFollowUpQueue): Promise < FollowUpQueue > {
  const id = randomUUID();
  const followUp: FollowUpQueue = {
    id,
    userId: data.userId,
    leadId: data.leadId,
    channel: data.channel,
    scheduledAt: data.scheduledAt instanceof Date ? data.scheduledAt : new Date(data.scheduledAt),
    status: data.status || "pending",
    processedAt: null,
    context: data.context || {},
    errorMessage: null,
    createdAt: new Date(),
  };
  this.followUps.set(id, followUp);
  return followUp;
}


  // ========== OAuth Accounts ==========
  private oauthAccounts: Map<string, OAuthAccount> = new Map();

  async getOAuthAccount(userId: string, provider: string): Promise < OAuthAccount | undefined > {
  return Array.from(this.oauthAccounts.values()).find(
    (account) => account.userId === userId && account.provider === provider
  );
}

  async getSoonExpiringOAuthAccounts(provider: string, thresholdMinutes: number): Promise < OAuthAccount[] > {
  const now = Date.now();
  const threshold = now + thresholdMinutes * 60 * 1000;
  return Array.from(this.oauthAccounts.values()).filter(
    account => account.provider === provider &&
      account.expiresAt &&
      account.expiresAt.getTime() < threshold
  );
}

  async saveOAuthAccount(data: InsertOAuthAccount): Promise < OAuthAccount > {
  const existing = await this.getOAuthAccount(data.userId, data.provider);
  const id = existing ? existing.id : randomUUID();
  const now = new Date();

  const account: OAuthAccount = {
    id,
    userId: data.userId,
    provider: data.provider,
    providerAccountId: data.providerAccountId,
    accessToken: data.accessToken || null,
    refreshToken: data.refreshToken || null,
    expiresAt: data.expiresAt ? (data.expiresAt instanceof Date ? data.expiresAt : new Date(data.expiresAt)) : null,
    scope: data.scope || null,
    tokenType: data.tokenType || null,
    idToken: data.idToken || null,
    metadata: data.metadata || {},
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };

  this.oauthAccounts.set(id, account);
  return account;
}

  async deleteOAuthAccount(userId: string, provider: string): Promise < void> {
  const existing = await this.getOAuthAccount(userId, provider);
  if(existing) {
    this.oauthAccounts.delete(existing.id);
  }
}

  // ========== Calendar Events ==========

  async createCalendarEvent(data: InsertCalendarEvent): Promise < CalendarEvent > {
  const id = randomUUID();
  const event: CalendarEvent = {
    id,
    userId: data.userId,
    leadId: data.leadId || null,
    title: data.title,
    description: data.description || null,
    startTime: data.startTime instanceof Date ? data.startTime : new Date(data.startTime),
    endTime: data.endTime instanceof Date ? data.endTime : new Date(data.endTime),
    meetingUrl: data.meetingUrl || null,
    provider: data.provider,
    externalId: data.externalId,
    attendees: data.attendees || [],
    isAiBooked: data.isAiBooked || false,
    preCallNote: data.preCallNote || null,
    createdAt: new Date(),
  };
  this.calendarEvents.set(id, event);
  return event;
}

  // ========== Audit Trail ==========


  async toggleAi(leadId: string, paused: boolean): Promise < void> {
  const lead = this.leads.get(leadId);
  if(lead) {
    this.leads.set(leadId, { ...lead, aiPaused: paused });
  }
}

  async createEmailMessage(message: InsertEmailMessage): Promise < EmailMessage > {
  return { ...message, id: randomUUID(), createdAt: new Date() } as any;
}

  async getEmailMessages(userId: string): Promise < EmailMessage[] > {
  return [];
}

  async getEmailMessageByMessageId(messageId: string): Promise < EmailMessage | undefined > {
  return undefined;
}

  async getDashboardStats(userId: string, overrideDates ?: { start: Date; end: Date }): Promise < {
  totalLeads: number;
  newLeads: number;
  activeLeads: number;
  convertedLeads: number;
  hardenedLeads: number;
  bouncyLeads: number;
  recoveredLeads: number;
  positiveIntents: number;
  totalMessages: number;
  messagesToday: number;
  messagesYesterday: number;
  pipelineValue: number;
  closedRevenue: number;
  openRate: number;
  responseRate: number;
} > {
  const leads = Array.from(this.leads.values()).filter(l => {
    const matchUserId = l.userId === userId;
    if (!matchUserId) return false;
    if (overrideDates) {
      const createdAt = new Date(l.createdAt);
      return createdAt >= overrideDates.start && createdAt < overrideDates.end;
    }
    return true;
  });

  const messages = Array.from(this.messages.values()).filter(m => {
    const matchUserId = m.userId === userId;
    if (!matchUserId) return false;
    if (overrideDates) {
      const createdAt = new Date(m.createdAt);
      return createdAt >= overrideDates.start && createdAt < overrideDates.end;
    }
    return true;
  });

  const deals = Array.from(this.deals.values()).filter((d: any) => {
    const matchUserId = d.userId === userId;
    if (!matchUserId) return false;
    if (overrideDates) {
      const createdAt = new Date(d.createdAt);
      return createdAt >= overrideDates.start && createdAt < overrideDates.end;
    }
    return true;
  });
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

    const positiveIntents = leads.filter(l => {
      // Use lead score or specific AI intent flags
      const hasHighIntent = l.score > 75;
      const aiIntent = (l.metadata as any)?.lastAnalysis?.intentLevel === 'high' || 
                       (l.metadata as any)?.intelligence?.intent?.intentLevel === 'high';
      return hasHighIntent || aiIntent;
    }).length;

    // Calculate pipeline value including AI-predicted amounts for leads without explicit deals
    const explicitDealValue = deals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
    const predictedDealValue = leads
      .filter((l: any) => {
        // Only include predicted value if there's no explicit deal for this lead
        const hasNoDeal = !deals.some((d: any) => d.leadId === l.id);
        const prediction = (l.metadata as any)?.intelligence?.predictions?.predictedAmount;
        return hasNoDeal && prediction && prediction > 0;
      })
      .reduce((sum: number, l: any) => sum + (Number((l.metadata as any).intelligence.predictions.predictedAmount) || 0), 0);

    return {
      totalLeads: leads.length,
      newLeads: leads.filter(l => new Date(l.createdAt) >= sevenDaysAgo).length,
      activeLeads: leads.filter(l => l.status === 'open' || l.status === 'replied').length,
      convertedLeads: leads.filter(l => l.status === 'converted').length,
      hardenedLeads: leads.filter(l => l.verified).length,
      bouncyLeads: leads.filter(l => l.status === 'bouncy').length,
      recoveredLeads: leads.filter(l => l.status === 'recovered').length,
      positiveIntents,
      totalMessages: messages.length,
      messagesToday: messages.filter(m => new Date(m.createdAt) >= today && m.direction === 'outbound').length,
      messagesYesterday: messages.filter(m => {
        const d = new Date(m.createdAt);
        return d >= yesterday && d < today && m.direction === 'outbound';
      }).length,
      pipelineValue: explicitDealValue + predictedDealValue,
      closedRevenue: deals.filter(d => d.status === 'converted' || d.status === 'closed_won').reduce((sum, d) => sum + (Number(d.value) || 0), 0),
      openRate: messages.filter(m => m.direction === 'outbound' && m.openedAt).length / (messages.filter(m => m.direction === 'outbound').length || 1) * 100,
      responseRate: leads.length > 0 ? (leads.filter(l => l.status === 'replied' || l.status === 'converted').length / leads.length) * 100 : 0,
      averageResponseTime: this.calculateAverageResponseTime(userId, messages),
    };
  }

  private calculateAverageResponseTime(userId: string, userMessages: Message[]): string {
    const threadResponses: number[] = [];
    const messagesByThread = new Map<string, Message[]>();

    userMessages.forEach(m => {
      const tid = m.threadId || 'default';
      if (!messagesByThread.has(tid)) messagesByThread.set(tid, []);
      messagesByThread.get(tid)!.push(m);
    });

    messagesByThread.forEach(msgs => {
      const sorted = msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const firstOutbound = sorted.find(m => m.direction === 'outbound');
      const firstInboundAfterOutbound = firstOutbound 
        ? sorted.find(m => m.direction === 'inbound' && new Date(m.createdAt) > new Date(firstOutbound.createdAt))
        : null;

      if (firstOutbound && firstInboundAfterOutbound) {
        const diff = new Date(firstInboundAfterOutbound.createdAt).getTime() - new Date(firstOutbound.createdAt).getTime();
        threadResponses.push(diff);
      }
    });

    if (threadResponses.length === 0) return '—';
    const avgMs = threadResponses.reduce((a, b) => a + b, 0) / threadResponses.length;
    const hours = avgMs / (1000 * 60 * 60);
    
    if (hours < 1) {
      const mins = Math.round(hours * 60);
      return `${mins}m`;
    }
    return `${hours.toFixed(1)}h`;
  }

  async getAnalyticsFull(userId: string, days: number): Promise < {
  metrics: {
    sent: number;
    opened: number;
    replied: number;
    booked: number;
    leadsFiltered: number;
    conversionRate: number;
    responseRate: number;
    openRate: number;
  };
  timeSeries: Array<{
    name: string;
    sent_email: number;
    sent_instagram: number;
    opened: number;
    replied_email: number;
    replied_instagram: number;
    booked: number;
  }>;
  channelPerformance: Array<{ channel: string; value: number }>;
  recentEvents: Array<{ id: string; type: string; description: string; time: string; isNew: boolean }>;
} > {
  const leads = Array.from(this.leads.values()).filter(l => l.userId === userId);
  const allMessages = Array.from(this.messages.values()).filter(m => m.userId === userId);
  const user = Array.from(this.users.values()).find(u => u.id === userId);

  const conversions = leads.filter(l => l.status === 'converted').length;
  const replied = leads.filter(l => l.status === 'replied' || l.status === 'converted').length;
  const sent = allMessages.filter(m => m.direction === 'outbound').length;
  const opened = allMessages.filter(m => m.direction === 'outbound' && m.openedAt).length;

  const timeSeries = [];
  for(let i = days - 1; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dayStart = new Date(date.setHours(0, 0, 0, 0));
  const dayEnd = new Date(date.setHours(23, 59, 59, 999));

  const dayMessages = allMessages.filter(m => new Date(m.createdAt) >= dayStart && new Date(m.createdAt) <= dayEnd);
  const dayLeads = leads.filter(l => l.updatedAt && new Date(l.updatedAt) >= dayStart && new Date(l.updatedAt) <= dayEnd);

  timeSeries.push({
    name: dayStr,
    sent_email: dayMessages.filter(m => m.direction === 'outbound' && m.provider === 'email').length,
    sent_instagram: dayMessages.filter(m => m.direction === 'outbound' && m.provider === 'instagram').length,
    opened: dayMessages.filter(m => m.direction === 'outbound' && m.openedAt).length,
    replied_email: dayLeads.filter(l => (l.status === 'replied' || l.status === 'converted') && l.channel === 'email').length,
    replied_instagram: dayLeads.filter(l => (l.status === 'replied' || l.status === 'converted') && l.channel === 'instagram').length,
    booked: 0
  });
}

return {
  metrics: {
    sent,
    opened,
    replied,
    booked: conversions,
    leadsFiltered: user?.filteredLeadsCount || 0,
    conversionRate: leads.length > 0 ? Math.round((conversions / leads.length) * 100) : 0,
    responseRate: leads.length > 0 ? Math.round((replied / leads.length) * 100) : 0,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    closedRevenue: deals.filter(d => d.status === 'converted' || d.status === 'closed_won').reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    pipelineValue: deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    averageResponseTime: this.calculateAverageResponseTime(userId, allMessages),
  },
  timeSeries,
  channelPerformance: [
    { channel: 'Email', value: leads.filter(l => l.channel === 'email').length },
    { channel: 'Instagram', value: leads.filter(l => l.channel === 'instagram').length }
  ],
  recentEvents: leads
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5)
    .map(l => {
      const updatedDate = new Date(l.updatedAt || l.createdAt);
      return {
        id: l.id,
        type: 'interaction',
        description: `${l.name} updated status to ${l.status}`,
        time: updatedDate.toLocaleTimeString(),
        isNew: (Date.now() - updatedDate.getTime()) < 24 * 60 * 60 * 1000
      };
    })
};
  }

  async getAnalyticsSummary(userId: string, startDate: Date): Promise < {
  summary: {
    totalLeads: number;
    conversions: number;
    conversionRate: string;
    active: number;
    ghosted: number;
    notInterested: number;
    leadsReplied: number;
    bestReplyHour: number | null;
  };
  channelBreakdown: Array<{ channel: string; count: number; percentage: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  timeline: Array<{ date: string; leads: number; conversions: number }>;
  positiveSentimentRate: string;
} > {
  const allLeads = Array.from(this.leads.values()).filter(
    l => l.userId === userId && new Date(l.createdAt) >= startDate
  );

  const total = allLeads.length;
  const conversions = allLeads.filter(l => l.status === 'converted').length;
  const active = allLeads.filter(l => l.status === 'open' || l.status === 'replied').length;
  const ghosted = allLeads.filter(l => l.status === 'cold').length;
  const notInterested = allLeads.filter(l => l.status === 'not_interested').length;
  const leadsReplied = allLeads.filter(l => l.status === 'replied' || l.status === 'converted').length;

  // Use AI sentiment if available, otherwise fallback to status
  const positiveCount = allLeads.filter(l => {
    const aiSentiment = (l.metadata as any)?.lastAnalysis?.intent === 'positive' || 
                        (l.metadata as any)?.intelligence?.intent?.sentiment === 'positive';
    return aiSentiment || ['replied', 'converted', 'open'].includes(l.status);
  }).length;
  
  const negativeCount = allLeads.filter(l => {
    const aiSentiment = (l.metadata as any)?.lastAnalysis?.intent === 'negative' || 
                        (l.metadata as any)?.intelligence?.intent?.sentiment === 'negative';
    return aiSentiment || ['not_interested', 'cold'].includes(l.status);
  }).length;
  
  const totalWithSentiment = positiveCount + negativeCount;
  const positiveSentimentRate = totalWithSentiment > 0
    ? ((positiveCount / totalWithSentiment) * 100).toFixed(1)
    : '0';

  // Channel breakdown
  const channelMap = new Map<string, number>();
  allLeads.forEach(l => {
    channelMap.set(l.channel, (channelMap.get(l.channel) || 0) + 1);
  });
  const channelBreakdown = Array.from(channelMap.entries()).map(([channel, count]) => ({
    channel,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }));

  // Status breakdown
  const statusMap = new Map<string, number>();
  allLeads.forEach(l => {
    statusMap.set(l.status, (statusMap.get(l.status) || 0) + 1);
  });
  const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }));

    return {
      summary: {
        totalLeads: total,
        conversions,
        conversionRate: total > 0 ? ((conversions / total) * 100).toFixed(1) : '0',
        active,
        ghosted,
        notInterested,
        leadsReplied,
        bestReplyHour: null,
      },
      channelBreakdown,
      statusBreakdown,
      timeline: [],
      positiveSentimentRate,
    };
  }

  async createAuditLog(data: InsertAuditTrail): Promise<AuditTrail> {
    const id = randomUUID();
    const entry: AuditTrail = {
      ...data,
      id,
      messageId: data.messageId || null,
      details: data.details || {},
      createdAt: new Date(),
    };
    this.auditLogs.set(id, entry);
    return entry;
  }

  async getAuditLogs(userId: string): Promise<AuditTrail[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // --- Notification Methods ---
  async getNotifications(userId: string, opts?: { limit?: number; offset?: number; dateFrom?: Date; dateTo?: Date }): Promise<Notification[]> {
    let results = Array.from(this.notifications.values()).filter(n => n.userId === userId);
    if (opts?.dateFrom) results = results.filter(n => n.createdAt >= opts.dateFrom!);
    if (opts?.dateTo) results = results.filter(n => n.createdAt <= opts.dateTo!);
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (opts?.offset) results = results.slice(opts.offset);
    if (opts?.limit) results = results.slice(0, opts.limit);
    return results;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId && !n.isRead).length;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const now = new Date();
    const notification: Notification = {
      ...data,
      id,
      isRead: false,
      createdAt: now,
      metadata: data.metadata || {},
      actionUrl: data.actionUrl || null,
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string, userId?: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification && (!userId || notification.userId === userId)) {
      notification.isRead = true;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .forEach(n => n.isRead = true);
  }

  async clearAllNotifications(userId: string): Promise<void> {
    Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .forEach(n => this.notifications.delete(n.id));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification && notification.userId === userId) {
      this.notifications.delete(id);
    }
  }

  async getLeadInsight(leadId: string): Promise<LeadInsight | undefined> {
    return Array.from(this.leadInsightsStore.values()).find(i => i.leadId === leadId);
  }

  async upsertLeadInsight(insight: InsertLeadInsight): Promise<LeadInsight> {
    const existing = await this.getLeadInsight(insight.leadId);
    const id = existing ? existing.id : randomUUID();
    const now = new Date();

    const newInsight: LeadInsight = {
      id,
      leadId: insight.leadId,
      userId: insight.userId,
      intent: insight.intent || null,
      intentScore: insight.intentScore ?? 0,
      summary: insight.summary || null,
      nextNextStep: insight.nextNextStep || null,
      competitors: insight.competitors || [],
      painPoints: insight.painPoints || [],
      budget: insight.budget || null,
      timeline: insight.timeline || null,
      lastAnalyzedAt: insight.lastAnalyzedAt instanceof Date ? insight.lastAnalyzedAt : now,
      metadata: insight.metadata || {},
      createdAt: existing ? existing.createdAt : now,
    };

    this.leadInsightsStore.set(id, newInsight);
    return newInsight;
  }
}

export const storage: IStorage = drizzleStorage;

console.log("✓ Using DrizzleStorage with PostgreSQL (persistent storage enabled)");
