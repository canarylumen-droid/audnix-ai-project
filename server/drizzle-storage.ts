import type { IStorage } from "./storage";
import type { User, InsertUser, Lead, InsertLead, Message, InsertMessage, Integration, InsertIntegration } from "@shared/schema";
import { db } from "./db";
import { users, leads, messages, integrations, notifications, deals, usageTopups } from "@shared/schema";
import { eq, and, or, like, desc, sql, gte } from "drizzle-orm";

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

  async getMessages(leadId: string): Promise<Message[]> {
    return this.getMessagesByLeadId(leadId);
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
      metadata: n.metadata
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
        metadata: data.metadata || {}
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
    const result = await db.execute(sql`
      SELECT * FROM video_monitors 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `);
    return result.rows as any[];
  }

  async createVideoMonitor(data: any): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO video_monitors (user_id, video_id, video_url, product_link, cta_text, is_active, auto_reply_enabled, metadata)
      VALUES (${data.userId}, ${data.videoId}, ${data.videoUrl}, ${data.productLink}, ${data.ctaText || 'Check it out'}, ${data.isActive ?? true}, ${data.autoReplyEnabled ?? true}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `);
    return result.rows[0];
  }

  async updateVideoMonitor(id: string, userId: string, updates: any): Promise<any> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }
    if (updates.autoReplyEnabled !== undefined) {
      setClauses.push(`auto_reply_enabled = $${paramIndex++}`);
      values.push(updates.autoReplyEnabled);
    }
    if (updates.productLink) {
      setClauses.push(`product_link = $${paramIndex++}`);
      values.push(updates.productLink);
    }
    if (updates.ctaText) {
      setClauses.push(`cta_text = $${paramIndex++}`);
      values.push(updates.ctaText);
    }

    if (setClauses.length === 0) return null;

    values.push(id, userId);
    const result = await db.execute(sql.raw(`
      UPDATE video_monitors 
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING *
    `));

    return result.rows[0];
  }

  async deleteVideoMonitor(id: string, userId: string): Promise<void> {
    await db.execute(sql`
      DELETE FROM video_monitors 
      WHERE id = ${id} AND user_id = ${userId}
    `);
  }

  async isCommentProcessed(commentId: string): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT 1 FROM processed_comments WHERE comment_id = ${commentId} LIMIT 1
    `);
    return result.rows.length > 0;
  }

  async markCommentProcessed(commentId: string, status: string, intentType: string): Promise<void> {
    await db.execute(sql`
      INSERT INTO processed_comments (comment_id, status, intent_type, commenter_username, comment_text)
      VALUES (${commentId}, ${status}, ${intentType}, 'unknown', '')
      ON CONFLICT (comment_id) DO NOTHING
    `);
  }

  async getBrandKnowledge(userId: string): Promise<string> {
    const result = await db.execute(sql`
      SELECT content FROM brand_embeddings 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    return result.rows.map((r: any) => r.content).join('\n');
  }

  async getDeals(userId: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT d.*, l.name as lead_name 
      FROM deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      WHERE d.user_id = ${userId}
      ORDER BY d.created_at DESC
    `);
    return result.rows as any[];
  }

  async createDeal(data: any): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO deals (user_id, lead_id, title, amount, currency, status, source, metadata)
      VALUES (${data.userId}, ${data.leadId || null}, ${data.title}, ${data.amount}, ${data.currency || 'USD'}, ${data.status || 'open'}, ${data.source || 'manual'}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `);
    return result.rows[0];
  }

  async updateDeal(id: string, userId: string, updates: any): Promise<any> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
      if (updates.status === 'closed_won' || updates.status === 'closed_lost') {
        setClauses.push(`closed_at = NOW()`);
      }
    }
    if (updates.amount !== undefined) {
      setClauses.push(`amount = $${paramIndex++}`);
      values.push(updates.amount);
    }

    if (setClauses.length === 0) return null;

    values.push(id, userId);
    const result = await db.execute(sql.raw(`
      UPDATE deals 
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING *
    `));

    return result.rows[0];
  }

  async calculateRevenue(userId: string): Promise<{ total: number; thisMonth: number; deals: any[] }> {
    const allDeals = await db.select().from(deals).where(eq(deals.userId, userId));
    const closedDeals = allDeals.filter(d => d.status === 'closed_won');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = closedDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const thisMonth = closedDeals
      .filter(d => d.convertedAt && new Date(d.convertedAt) >= thisMonthStart)
      .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    return { total, thisMonth, deals: closedDeals };
  }

  async createUsageTopup(data: any): Promise<any> {
    const topup = {
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      metadata: data.metadata || {}
    };

    const result = await db.insert(usageTopups).values(topup).returning();
    return result[0];
  }

  async getUsageHistory(userId: string, type?: string): Promise<any[]> {
    let query = db.select().from(usageTopups).where(eq(usageTopups.userId, userId));

    if (type) {
      query = query.where(eq(usageTopups.type, type));
    }

    const history = await query.orderBy(desc(usageTopups.createdAt));
    return history;
  }

  async getVoiceMinutesBalance(userId: string): Promise<number> {
    const user = await this.getUserById(userId);
    if (!user) return 0;

    const planMinutes = this.getVoiceMinutesForPlan(user.plan);
    const topupMinutes = user.voiceMinutesTopup || 0;
    const usedMinutes = user.voiceMinutesUsed || 0;

    return Math.max(0, planMinutes + topupMinutes - usedMinutes);
  }

  async deductVoiceMinutes(userId: string, minutes: number): Promise<boolean> {
    const balance = await this.getVoiceMinutesBalance(userId);
    if (balance < minutes) return false;

    const user = await this.getUserById(userId);
    if (!user) return false;

    await this.updateUser(userId, {
      voiceMinutesUsed: (user.voiceMinutesUsed || 0) + minutes
    });

    return true;
  }

  async addVoiceMinutes(userId: string, minutes: number, source: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) return;

    await this.updateUser(userId, {
      voiceMinutesTopup: (user.voiceMinutesTopup || 0) + minutes
    });

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