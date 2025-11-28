import { type User, type InsertUser, type Lead, type InsertLead, type Message, type InsertMessage, type Integration, type InsertIntegration } from "@shared/schema";
import { randomUUID } from "crypto";

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
  getUserCount(): Promise<number>;

  // Lead methods
  getLeads(options: { userId: string; status?: string; channel?: string; search?: string; limit?: number }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getLeadByUsername(username: string, channel: string): Promise<Lead | undefined>;
  getLeadByPhone(userId: string, phone: string): Promise<Lead | undefined>;
  createLead(lead: Partial<InsertLead> & { userId: string; name: string; channel: string }): Promise<Lead>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined>;
  getTotalLeadsCount(): Promise<number>;

  // Message methods
  getMessagesByLeadId(leadId: string): Promise<Message[]>;
  getMessages(leadId: string): Promise<Message[]>; // Alias for getMessagesByLeadId
  getAllMessages(userId: string, options?: { limit?: number; channel?: string }): Promise<Message[]>;
  createMessage(message: Partial<InsertMessage> & { leadId: string; userId: string; direction: "inbound" | "outbound"; body: string }): Promise<Message>;

  // Integration methods
  getIntegrations(userId: string): Promise<Integration[]>;
  getIntegration(userId: string, provider: string): Promise<Integration | undefined>;
  getIntegrationsByProvider(provider: string): Promise<Integration[]>;
  createIntegration(integration: Partial<InsertIntegration> & { userId: string; provider: string; encryptedMeta: string }): Promise<Integration>;
  disconnectIntegration(userId: string, provider: string): Promise<void>;
  deleteIntegration(userId: string, provider: string): Promise<void>;

  // Notification methods
  getNotifications(userId: string): Promise<any[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createNotification(data: any): Promise<any>;
  markNotificationRead(id: string): Promise<void>;

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

  // Usage tracking
  createUsageTopup(data: any): Promise<any>;
  getUsageHistory(userId: string, type?: string): Promise<any[]>;

  // Onboarding methods
  createOnboardingProfile(data: any): Promise<any>;
  getOnboardingProfile(userId: string): Promise<any | undefined>;
  updateOnboardingProfile(userId: string, updates: any): Promise<any | undefined>;

  // OTP methods
  createOtpCode(data: { email: string; code: string; expiresAt: Date; attempts: number; verified: boolean }): Promise<any>;
  getLatestOtpCode(email: string): Promise<any>;
  incrementOtpAttempts(id: string): Promise<void>;
  markOtpVerified(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leads: Map<string, Lead>;
  private messages: Map<string, Message>;
  private integrations: Map<string, Integration>;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.messages = new Map();
    this.integrations = new Map();
  }

  // ========== User Methods ==========

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.supabaseId === supabaseId,
    );
  }

  async createUser(insertUser: Partial<InsertUser> & { email: string }): Promise<User> {
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
      whatsappConnected: insertUser.whatsappConnected || false,
      pdfConfidenceThreshold: insertUser.pdfConfidenceThreshold || 0.7,
      lastInsightGeneratedAt: insertUser.lastInsightGeneratedAt || null,
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
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  // ========== Lead Methods ==========

  async getLeads(options: { userId: string; status?: string; channel?: string; search?: string; limit?: number }): Promise<Lead[]> {
    let leads = Array.from(this.leads.values()).filter(
      (lead) => lead.userId === options.userId
    );

    if (options.status) {
      leads = leads.filter((lead) => lead.status === options.status);
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

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.getLead(id);
  }

  async getLeadByUsername(username: string, channel: string): Promise<Lead | undefined> {
    const leads = await this.getLeads({ userId: '', limit: 1000 });
    return leads.find(lead =>
      lead.name.toLowerCase() === username.toLowerCase() &&
      lead.channel === channel
    );
  }

  async getLeadByPhone(userId: string, phone: string): Promise<Lead | undefined> {
    const leads = await this.getLeads({ userId, limit: 1000 });
    return leads.find(lead => lead.phone === phone);
  }

  async createLead(insertLead: Partial<InsertLead> & { userId: string; name: string; channel: string }): Promise<Lead> {
    const id = randomUUID();
    const now = new Date();

    const lead: Lead = {
      id,
      userId: insertLead.userId,
      externalId: insertLead.externalId || null,
      name: insertLead.name,
      channel: insertLead.channel as any,
      email: insertLead.email || null,
      phone: insertLead.phone || null,
      status: insertLead.status || "new",
      score: insertLead.score || 0,
      warm: insertLead.warm || false,
      lastMessageAt: insertLead.lastMessageAt || null,
      aiPaused: insertLead.aiPaused || false,
      pdfConfidence: insertLead.pdfConfidence || null,
      tags: insertLead.tags || [],
      metadata: insertLead.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead = { ...lead, ...updates, updatedAt: new Date() };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async getTotalLeadsCount(): Promise<number> {
    return this.leads.size;
  }

  // ========== Message Methods ==========

  async getMessagesByLeadId(leadId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.leadId === leadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getMessages(leadId: string): Promise<Message[]> {
    return this.getMessagesByLeadId(leadId);
  }

  async getAllMessages(userId: string, options?: { limit?: number; channel?: string }): Promise<Message[]> {
    let msgs = Array.from(this.messages.values())
      .filter((msg) => msg.userId === userId);
    
    if (options?.channel) {
      msgs = msgs.filter((msg) => msg.provider === options.channel);
    }
    
    msgs = msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (options?.limit) {
      msgs = msgs.slice(0, options.limit);
    }
    
    return msgs;
  }

  async createMessage(message: Partial<InsertMessage> & { leadId: string; userId: string; direction: "inbound" | "outbound"; body: string }): Promise<Message> {
    const id = randomUUID();
    const now = new Date();

    const newMessage: Message = {
      id,
      leadId: message.leadId,
      userId: message.userId,
      provider: message.provider || "instagram",
      direction: message.direction,
      body: message.body,
      audioUrl: message.audioUrl || null,
      metadata: message.metadata || {},
      createdAt: now,
    };

    this.messages.set(id, newMessage);
    return newMessage;
  }

  // ========== Integration Methods ==========

  async getIntegrations(userId: string): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.userId === userId
    );
  }

  async getIntegration(userId: string, provider: string): Promise<Integration | undefined> {
    return Array.from(this.integrations.values()).find(
      (integration) => integration.userId === userId && integration.provider === provider
    );
  }

  async getIntegrationsByProvider(provider: string): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.provider === provider
    );
  }

  async createIntegration(integration: Partial<InsertIntegration> & { userId: string; provider: string; encryptedMeta: string }): Promise<Integration> {
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
    };

    this.integrations.set(id, newIntegration);
    return newIntegration;
  }

  async disconnectIntegration(userId: string, provider: string): Promise<void> {
    const integration = Array.from(this.integrations.values()).find(
      (i) => i.userId === userId && i.provider === provider
    );

    if (integration) {
      this.integrations.delete(integration.id);
    }
  }

  async deleteIntegration(userId: string, provider: string): Promise<void> {
    return this.disconnectIntegration(userId, provider);
  }

  // ========== Notification Methods ==========

  private notifications: Map<string, any> = new Map();
  private readNotifications: Set<string> = new Set();

  async getNotifications(userId: string): Promise<any[]> {
    // Return notifications from leads for demo purposes
    const leads = await this.getLeads({ userId, limit: 10 });
    return leads.map((lead, index) => ({
      id: lead.id,
      type: lead.status === 'converted' ? 'conversion' : 'lead_reply',
      title: lead.status === 'converted' ? 'New conversion!' : 'New lead',
      message: `${lead.name} from ${lead.channel}${lead.status === 'converted' ? ' converted to a customer' : ''}`,
      timestamp: lead.createdAt,
      read: this.readNotifications.has(lead.id),
    }));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    this.readNotifications.add(notificationId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId);
    notifications.forEach(n => this.readNotifications.add(n.id));
  }

  async createNotification(data: any): Promise<any> {
    const id = randomUUID();
    const notification = { id, ...data, createdAt: new Date() };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    this.readNotifications.add(id);
  }

  // Video monitor methods
  private videoMonitors: Map<string, any> = new Map();
  private processedComments: Set<string> = new Set();
  private brandKnowledge: Map<string, string> = new Map();

  async getVideoMonitors(userId: string): Promise<any[]> {
    return Array.from(this.videoMonitors.values()).filter(m => m.userId === userId);
  }

  async createVideoMonitor(data: any): Promise<any> {
    const id = randomUUID();
    const monitor = { id, ...data, createdAt: new Date() };
    this.videoMonitors.set(id, monitor);
    return monitor;
  }

  async updateVideoMonitor(id: string, userId: string, updates: any): Promise<any> {
    const monitor = this.videoMonitors.get(id);
    if (!monitor || monitor.userId !== userId) return null;

    const updated = { ...monitor, ...updates };
    this.videoMonitors.set(id, updated);
    return updated;
  }

  async deleteVideoMonitor(id: string, userId: string): Promise<void> {
    const monitor = this.videoMonitors.get(id);
    if (monitor && monitor.userId === userId) {
      this.videoMonitors.delete(id);
    }
  }

  async isCommentProcessed(commentId: string): Promise<boolean> {
    return this.processedComments.has(commentId);
  }

  async markCommentProcessed(commentId: string, status: string, intentType: string): Promise<void> {
    this.processedComments.add(commentId);
  }

  async getBrandKnowledge(userId: string): Promise<string> {
    return this.brandKnowledge.get(userId) || '';
  }

  // Deal tracking
  private deals: Map<string, any> = new Map();

  async getDeals(userId: string): Promise<any[]> {
    return Array.from(this.deals.values()).filter(d => d.userId === userId);
  }

  async createDeal(data: any): Promise<any> {
    const id = randomUUID();
    const deal = { id, ...data, createdAt: new Date() };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: string, userId: string, updates: any): Promise<any> {
    const deal = this.deals.get(id);
    if (!deal || deal.userId !== userId) return null;

    const updated = { ...deal, ...updates, updatedAt: new Date() };
    this.deals.set(id, updated);
    return updated;
  }

  async calculateRevenue(userId: string): Promise<{ total: number; thisMonth: number; deals: any[] }> {
    const deals = await this.getDeals(userId);
    const closedDeals = deals.filter(d => d.status === 'closed_won');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = closedDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const thisMonth = closedDeals
      .filter(d => new Date(d.closedAt) >= thisMonthStart)
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    return { total, thisMonth, deals: closedDeals };
  }

  // Usage tracking
  private usageHistory: Map<string, any[]> = new Map();

  async createUsageTopup(data: any): Promise<any> {
    const id = randomUUID();
    const now = new Date();
    const topup = { id, ...data, createdAt: now };

    if (!this.usageHistory.has(data.userId)) {
      this.usageHistory.set(data.userId, []);
    }
    this.usageHistory.get(data.userId)!.push(topup);
    return topup;
  }

  async getUsageHistory(userId: string, type?: string): Promise<any[]> {
    let history = this.usageHistory.get(userId) || [];
    if (type) {
      history = history.filter(item => item.type === type);
    }
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Onboarding methods
  private onboardingProfiles: Map<string, any> = new Map();

  async createOnboardingProfile(data: any): Promise<any> {
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

  async getOnboardingProfile(userId: string): Promise<any | undefined> {
    return this.onboardingProfiles.get(userId);
  }

  async updateOnboardingProfile(userId: string, updates: any): Promise<any | undefined> {
    const existing = this.onboardingProfiles.get(userId);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.onboardingProfiles.set(userId, updated);
    return updated;
  }

  // OTP methods (MemStorage implementation)
  private otpCodes: Map<string, any> = new Map();

  async createOtpCode(data: { email: string; code: string; expiresAt: Date; attempts: number; verified: boolean }): Promise<any> {
    const id = randomUUID();
    const now = new Date();
    const otpCode = { id, ...data, createdAt: now, updatedAt: now };
    this.otpCodes.set(id, otpCode);
    return otpCode;
  }

  async getLatestOtpCode(email: string): Promise<any> {
    // In-memory, this is inefficient, but for demonstration:
    return Array.from(this.otpCodes.values())
      .filter(code => code.email === email)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    const code = this.otpCodes.get(id);
    if (code) {
      code.attempts++;
      code.updatedAt = new Date();
      this.otpCodes.set(id, code);
    }
  }

  async markOtpVerified(id: string): Promise<void> {
    const code = this.otpCodes.get(id);
    if (code) {
      code.verified = true;
      code.updatedAt = new Date();
      this.otpCodes.set(id, code);
    }
  }

  // getUserByEmail is already defined above for User, but for OTP context, we might need to return null if not found.
  // The interface definition for IStorage already has a getUserByEmail that returns User | null.
  // If the existing implementation returns undefined and needs to return null, it would be changed.
  // For now, assuming the existing getUserByEmail is compatible or will be adjusted.
  // If a distinct getUserByEmail for OTP context is needed, it would be implemented here.
}

// Use DrizzleStorage with Replit PostgreSQL database
import { drizzleStorage } from "./drizzle-storage";

export const storage: IStorage = drizzleStorage;

console.log("✓ Using DrizzleStorage with PostgreSQL (persistent storage enabled)");