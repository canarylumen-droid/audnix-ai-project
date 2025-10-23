import { type User, type InsertUser, type Lead, type InsertLead, type Message, type InsertMessage, type Integration, type InsertIntegration } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser> & { email: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  
  // Lead methods
  getLeads(options: { userId: string; status?: string; channel?: string; search?: string; limit?: number }): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined>;
  getTotalLeadsCount(): Promise<number>;
  
  // Message methods
  getMessagesByLeadId(leadId: string): Promise<Message[]>;
  createMessage(message: Partial<InsertMessage> & { leadId: string; userId: string; direction: "inbound" | "outbound"; content: string }): Promise<Message>;
  
  // Integration methods
  getIntegrations(userId: string): Promise<Integration[]>;
  createIntegration(integration: Partial<InsertIntegration> & { userId: string; provider: string; encryptedMeta: string }): Promise<Integration>;
  disconnectIntegration(userId: string, provider: string): Promise<void>;
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
      name: insertUser.name || null,
      username: insertUser.username || null,
      avatar: insertUser.avatar || null,
      company: insertUser.company || null,
      timezone: insertUser.timezone || "America/New_York",
      plan: insertUser.plan || "trial",
      trialExpiresAt: insertUser.trialExpiresAt || trialExpiry,
      replyTone: insertUser.replyTone || "professional",
      role: insertUser.role || "member",
      stripeCustomerId: insertUser.stripeCustomerId || null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId || null,
      createdAt: now,
      lastLogin: now,
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

  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
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

  async createMessage(message: Partial<InsertMessage> & { leadId: string; userId: string; direction: "inbound" | "outbound"; content: string }): Promise<Message> {
    const id = randomUUID();
    const now = new Date();

    const newMessage: Message = {
      id,
      leadId: message.leadId,
      userId: message.userId,
      channel: message.channel || "instagram",
      direction: message.direction,
      content: message.content,
      isAiGenerated: message.isAiGenerated || false,
      hasVoiceNote: message.hasVoiceNote || false,
      voiceNoteUrl: message.voiceNoteUrl || null,
      voiceNoteDuration: message.voiceNoteDuration || null,
      attachments: message.attachments || [],
      status: message.status || "sent",
      scheduledFor: message.scheduledFor || null,
      sentAt: message.sentAt || now,
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

  async createIntegration(integration: Partial<InsertIntegration> & { userId: string; provider: string; encryptedMeta: string }): Promise<Integration> {
    const id = randomUUID();
    const now = new Date();

    const newIntegration: Integration = {
      id,
      userId: integration.userId,
      provider: integration.provider as any,
      isConnected: integration.isConnected ?? true,
      accountName: integration.accountName || null,
      accountId: integration.accountId || null,
      lastSyncAt: integration.lastSyncAt || null,
      messageVolume: integration.messageVolume || 0,
      accessToken: integration.accessToken || null,
      refreshToken: integration.refreshToken || null,
      expiresAt: integration.expiresAt || null,
      metadata: integration.metadata || {},
      createdAt: now,
      updatedAt: now,
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
}

export const storage = new MemStorage();
