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

  async createNotification(data: any): Promise<any> {
    const result = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl || null,
        isRead: false,
      })
      .returning();
    
    return result[0];
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getLeadByUsername(username: string, channel: string): Promise<Lead | undefined> {
    const result = await db
      .select()
      .from(leads)
      .where(and(
        sql`LOWER(${leads.name}) = LOWER(${username})`,
        eq(leads.channel, channel as any)
      ))
      .limit(1);
    
    return result[0];
  }

  async getVideoMonitors(userId: string): Promise<any[]> {
    // Implement video monitors table query when schema is ready
    return [];
  }

  async createVideoMonitor(data: any): Promise<any> {
    // Implement when schema is ready
    return data;
  }

  async updateVideoMonitor(id: string, userId: string, updates: any): Promise<any> {
    // Implement when schema is ready
    return null;
  }

  async deleteVideoMonitor(id: string, userId: string): Promise<void> {
    // Implement when schema is ready
  }

  async isCommentProcessed(commentId: string): Promise<boolean> {
    // Implement when schema is ready
    return false;
  }

  async markCommentProcessed(commentId: string, status: string, intentType: string): Promise<void> {
    // Implement when schema is ready
  }

  async getBrandKnowledge(userId: string): Promise<string> {
    // Implement when schema is ready
    return '';
  }

  async getDeals(userId: string): Promise<any[]> {
    // Implement deals table query when schema is ready
    return [];
  }

  async createDeal(data: any): Promise<any> {
    // Implement when schema is ready
    return data;
  }

  async updateDeal(id: string, userId: string, updates: any): Promise<any> {
    // Implement when schema is ready
    return null;
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

  async getVoiceMinutesBalance(userId: string): Promise<number> {
    const user = await this.getUserById(userId);
    if (!user) return 0;
    
    // Calculate from plan + top-ups - usage
    const planMinutes = this.getVoiceMinutesForPlan(user.plan);
    // TODO: Track actual usage when voice usage table is ready
    return planMinutes;
  }

  async deductVoiceMinutes(userId: string, minutes: number): Promise<boolean> {
    const balance = await this.getVoiceMinutesBalance(userId);
    if (balance < minutes) return false;
    
    // TODO: Implement actual deduction when voice usage table is ready
    return true;
  }

  async addVoiceMinutes(userId: string, minutes: number, source: string): Promise<void> {
    // TODO: Implement when voice topups table is ready
    await this.createNotification({
      userId,
      type: 'topup_success',
      title: '✅ Top-up successful!',
      message: `+${minutes} voice minutes added to your account.`,
      actionUrl: '/dashboard/integrations'
    });
  }

  private getVoiceMinutesForPlan(plan: string): number {
    const planMinutes: Record<string, number> = {
      'starter': parseInt(process.env.VOICE_MINUTES_PLAN_49 || '300'),
      'pro': parseInt(process.env.VOICE_MINUTES_PLAN_99 || '800'),
      'enterprise': parseInt(process.env.VOICE_MINUTES_PLAN_199 || '1000'),
      'trial': 0
    };
    return planMinutes[plan] || 0;
  }
}

export const drizzleStorage = new DrizzleStorage();
