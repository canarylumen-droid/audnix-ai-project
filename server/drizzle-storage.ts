import type { IStorage } from "./storage";
import type { User, InsertUser, Lead, InsertLead, Message, InsertMessage, Integration, InsertIntegration } from "@shared/schema";
import { db } from "./db";
import { users, leads, messages, integrations, notifications } from "@shared/schema";
import { eq, and, or, like, desc, sql } from "drizzle-orm";

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.supabaseId, supabaseId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: Partial<InsertUser> & { email: string }): Promise<User> {
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 3);

    const result = await db
      .insert(users)
      .values({
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
        supabaseId: insertUser.supabaseId || null,
        lastLogin: new Date(),
      })
      .returning();

    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0].count);
  }

  async getLeads(options: {
    userId: string;
    status?: string;
    channel?: string;
    search?: string;
    limit?: number;
  }): Promise<Lead[]> {
    let query = db.select().from(leads).where(eq(leads.userId, options.userId));

    if (options.status) {
      query = query.where(eq(leads.status, options.status as any));
    }

    if (options.channel) {
      query = query.where(eq(leads.channel, options.channel as any));
    }

    if (options.search) {
      const searchPattern = `%${options.search}%`;
      query = query.where(
        or(
          like(leads.name, searchPattern),
          like(leads.email, searchPattern),
          like(leads.phone, searchPattern)
        )
      );
    }

    query = query.orderBy(desc(leads.createdAt));

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return result[0];
  }

  async createLead(insertLead: Partial<InsertLead> & { userId: string; name: string; channel: string }): Promise<Lead> {
    const result = await db
      .insert(leads)
      .values({
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
        tags: insertLead.tags || [],
        metadata: insertLead.metadata || {},
      })
      .returning();

    return result[0];
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const result = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    return result[0];
  }

  async getTotalLeadsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(leads);
    return Number(result[0].count);
  }

  async getMessagesByLeadId(leadId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.leadId, leadId))
      .orderBy(messages.createdAt);
  }

  async createMessage(
    message: Partial<InsertMessage> & {
      leadId: string;
      userId: string;
      direction: "inbound" | "outbound";
      body: string;
    }
  ): Promise<Message> {
    const result = await db
      .insert(messages)
      .values({
        leadId: message.leadId,
        userId: message.userId,
        provider: message.provider || "instagram",
        direction: message.direction,
        body: message.body,
        audioUrl: message.audioUrl || null,
        metadata: message.metadata || {},
      })
      .returning();

    await db
      .update(leads)
      .set({ lastMessageAt: new Date() })
      .where(eq(leads.id, message.leadId));

    return result[0];
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async createIntegration(
    integration: Partial<InsertIntegration> & {
      userId: string;
      provider: string;
      encryptedMeta: string;
    }
  ): Promise<Integration> {
    const result = await db
      .insert(integrations)
      .values({
        userId: integration.userId,
        provider: integration.provider as any,
        encryptedMeta: integration.encryptedMeta,
        connected: integration.connected ?? true,
        accountType: integration.accountType || null,
        lastSync: integration.lastSync || null,
      })
      .returning();

    return result[0];
  }

  async disconnectIntegration(userId: string, provider: string): Promise<void> {
    await db
      .delete(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider as any)));
  }

  async getNotifications(userId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
    
    return result.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.createdAt,
      read: n.isRead,
      actionUrl: n.actionUrl,
    }));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

export const drizzleStorage = new DrizzleStorage();
