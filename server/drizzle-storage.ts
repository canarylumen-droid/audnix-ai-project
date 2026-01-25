import type { IStorage } from './storage.js';
import type { User, InsertUser, Lead, InsertLead, Message, InsertMessage, Integration, InsertIntegration, Deal, OnboardingProfile, OtpCode, FollowUpQueue, InsertFollowUpQueue, OAuthAccount, InsertOAuthAccount, CalendarEvent, InsertCalendarEvent, AuditTrail, InsertAuditTrail, Organization, InsertOrganization, TeamMember, InsertTeamMember, Payment, InsertPayment } from "../shared/schema.js";
import { db } from './db.js';
import { users, leads, messages, integrations, notifications, deals, usageTopups, onboardingProfiles, otpCodes, payments, followUpQueue, oauthAccounts, calendarEvents, auditTrail, organizations, teamMembers, aiLearningPatterns } from "../shared/schema.js";
import { eq, desc, and, gte, lte, sql, not, isNull, or, like } from "drizzle-orm";
import crypto from 'crypto'; // Import crypto for UUID generation
import { wsSync } from './lib/websocket-sync.js';

// Function to check if the database connection is available
function checkDatabase() {
  // In a real application, you might want to check a connection pool or a specific connection status.
  // For this example, we'll assume `db` is either configured or not.
  // If `db` is not initialized or has issues, subsequent operations will likely fail,
  // and error handling in those operations should catch it.
  // A more robust check might involve a simple query like `db.execute(sql`SELECT 1`)`.
  if (!db) {
    throw new Error("Database connection is not available.");
  }
}

export class DrizzleStorage implements IStorage {
  async getFollowUpById(id: string): Promise<FollowUpQueue | undefined> {
    checkDatabase();
    const [result] = await db.select().from(followUpQueue).where(eq(followUpQueue.id, id)).limit(1);
    return result;
  }

  async updateFollowUp(id: string, updates: Partial<FollowUpQueue>): Promise<FollowUpQueue | undefined> {
    checkDatabase();
    const [result] = await db
      .update(followUpQueue)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(followUpQueue.id, id))
      .returning();
    return result;
  }

  async getDueFollowUps(): Promise<FollowUpQueue[]> {
    checkDatabase();
    const now = new Date();
    return await db
      .select()
      .from(followUpQueue)
      .where(and(eq(followUpQueue.status, 'pending'), lte(followUpQueue.scheduledAt, now)))
      .orderBy(desc(followUpQueue.scheduledAt));
  }
  async getVoiceMinutesBalance(userId: string): Promise<number> {
    checkDatabase();
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return (Number(user?.voiceMinutesUsed) || 0) + (Number(user?.voiceMinutesTopup) || 0);
  }

  async getLearningPatterns(userId: string): Promise<AiLearningPattern[]> {
    checkDatabase();
    return await db
      .select()
      .from(aiLearningPatterns)
      .where(eq(aiLearningPatterns.userId, userId))
      .orderBy(desc(aiLearningPatterns.strength));
  }

  async recordLearningPattern(userId: string, key: string, success: boolean): Promise<void> {
    checkDatabase();
    const [existing] = await db
      .select()
      .from(aiLearningPatterns)
      .where(and(eq(aiLearningPatterns.userId, userId), eq(aiLearningPatterns.patternKey, key)))
      .limit(1);

    if (existing) {
      await db
        .update(aiLearningPatterns)
        .set({
          strength: success ? existing.strength + 1 : Math.max(0, existing.strength - 1),
          lastUsedAt: new Date()
        })
        .where(eq(aiLearningPatterns.id, existing.id));
    } else {
      await db.insert(aiLearningPatterns).values({
        userId,
        patternKey: key,
        strength: success ? 1 : 0,
        metadata: {}
      });
    }
  }

  async getPendingFollowUp(leadId: string): Promise<FollowUpQueue | undefined> {
    checkDatabase();
    const [result] = await db
      .select()
      .from(followUpQueue)
      .where(and(eq(followUpQueue.leadId, leadId), eq(followUpQueue.status, 'pending')))
      .limit(1);
    return result;
  }

  async getUser(id: string): Promise<User | undefined> {
    checkDatabase();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    checkDatabase();
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    checkDatabase();
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    checkDatabase();
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    checkDatabase();
    const result = await db.select().from(users).where(eq(users.supabaseId, supabaseId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: Partial<InsertUser> & { email: string }): Promise<User> {
    checkDatabase();
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 3);

    // SECURITY: Always default to 'member' - only elevate to 'admin' if whitelist verified
    // NEVER trust caller-provided role to prevent privilege escalation
    let userRole: 'admin' | 'member' = 'member';
    try {
      const whitelistCheck = await db.execute(sql`
        SELECT id FROM admin_whitelist 
        WHERE LOWER(email) = LOWER(${insertUser.email})
          AND status = 'active'
        LIMIT 1
      `);

      if (whitelistCheck.rows && whitelistCheck.rows.length > 0) {
        userRole = 'admin';
        console.log(`[ADMIN] Creating admin user from whitelist: ${insertUser.email}`);
      }
    } catch (error) {
      console.error("[ADMIN] Error checking whitelist during user creation:", error);
      // SECURITY: Force 'member' role on whitelist check failure
      userRole = 'member';
    }

    const result = await db
      .insert(users)
      .values({
        email: insertUser.email,
        password: insertUser.password || null,
        name: insertUser.name || null,
        username: insertUser.username || null,
        avatar: insertUser.avatar || null,
        company: insertUser.company || null,
        timezone: insertUser.timezone || "America/New_York",
        plan: insertUser.plan || "trial",
        trialExpiresAt: insertUser.trialExpiresAt || trialExpiry,
        replyTone: insertUser.replyTone || "professional",
        role: userRole,
        stripeCustomerId: insertUser.stripeCustomerId || null,
        stripeSubscriptionId: insertUser.stripeSubscriptionId || null,
        supabaseId: insertUser.supabaseId || null,
        lastLogin: new Date(),
      })
      .returning();

    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    checkDatabase();

    // If metadata is being updated, merge it with existing metadata instead of overwriting
    if (updates.metadata) {
      const { metadata, ...otherUpdates } = updates;

      // Get current user to merge metadata
      const currentUser = await this.getUser(id);
      if (!currentUser) {
        return undefined;
      }

      // Merge metadata
      const mergedMetadata = {
        ...(currentUser.metadata ?? {}),
        ...metadata,
      };

      const result = await db
        .update(users)
        .set({
          ...otherUpdates,
          metadata: mergedMetadata as any,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    }

    // Always bump updatedAt for any update
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (result[0]) {
      wsSync.notifySettingsUpdated(id, result[0]);
    }
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    checkDatabase();
    return await db.select().from(users);
  }

  async getUserCount(): Promise<number> {
    checkDatabase();
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0].count);
  }

  // --- Organization Methods ---

  async getOrganization(id: string): Promise<Organization | undefined> {
    checkDatabase();
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0];
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    checkDatabase();
    const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    return result[0];
  }

  async getOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
    checkDatabase();
    return await db.select().from(organizations).where(eq(organizations.ownerId, ownerId));
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    checkDatabase();
    const result = await db.insert(organizations).values(org).returning();
    return result[0];
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    checkDatabase();
    const result = await db.update(organizations).set({ ...updates, updatedAt: new Date() }).where(eq(organizations.id, id)).returning();
    return result[0];
  }

  // --- Team Member Methods ---

  async getTeamMember(orgId: string, userId: string): Promise<TeamMember | undefined> {
    checkDatabase();
    const result = await db.select().from(teamMembers).where(and(eq(teamMembers.organizationId, orgId), eq(teamMembers.userId, userId))).limit(1);
    return result[0];
  }

  async getOrganizationMembers(orgId: string): Promise<(TeamMember & { user: User })[]> {
    checkDatabase();
    const result = await db.select({
      member: teamMembers,
      user: users
    })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.organizationId, orgId));

    return result.map((r: any) => ({ ...r.member, user: r.user }));
  }

  async getUserOrganizations(userId: string): Promise<(Organization & { role: TeamMember["role"] })[]> {
    checkDatabase();
    const result = await db.select({
      org: organizations,
      role: teamMembers.role
    })
      .from(teamMembers)
      .innerJoin(organizations, eq(teamMembers.organizationId, organizations.id))
      .where(eq(teamMembers.userId, userId));

    return result.map((r: any) => ({ ...r.org, role: r.role }));
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    checkDatabase();
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }

  async removeTeamMember(orgId: string, userId: string): Promise<void> {
    checkDatabase();
    await db.delete(teamMembers).where(and(eq(teamMembers.organizationId, orgId), eq(teamMembers.userId, userId)));
  }

  async getLeads(options: {
    userId: string;
    status?: string;
    channel?: string;
    search?: string;
    limit?: number;
  }): Promise<Lead[]> {
    checkDatabase();
    // Ensure userId is a string, not an object
    const userId = typeof options.userId === 'string' ? options.userId : String(options.userId);
    if (!userId || userId === '[object Object]') {
      throw new Error(`Invalid user ID: ${String(options.userId)}`);
    }
    let query = db.select().from(leads).where(eq(leads.userId, userId));

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

  async getLead(id: string): Promise<Lead | undefined> {
    checkDatabase();
    // Ensure id is a string, not an object
    const leadId = typeof id === 'string' ? id : String(id);
    if (!leadId || leadId === '[object Object]') {
      throw new Error(`Invalid lead ID: ${String(id)}`);
    }
    const result = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    return result[0];
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.getLead(id);
  }


  async createLead(insertLead: Partial<InsertLead> & { userId: string; name: string; channel: string }): Promise<Lead> {
    checkDatabase();
    const result = await db
      .insert(leads)
      .values({
        userId: insertLead.userId,
        organizationId: insertLead.organizationId || null,
        externalId: insertLead.externalId || null,
        name: insertLead.name,
        company: insertLead.company || null,
        role: insertLead.role || null,
        bio: insertLead.bio || null,
        channel: insertLead.channel as any,
        email: insertLead.email || null,
        phone: insertLead.phone || null,
        status: insertLead.status || "new",
        score: insertLead.score || 0,
        warm: insertLead.warm || false,
        lastMessageAt: insertLead.lastMessageAt || null,
        aiPaused: insertLead.aiPaused || false,
        verified: insertLead.verified || false,
        verifiedAt: insertLead.verifiedAt || null,
        pdfConfidence: insertLead.pdfConfidence || null,
        tags: insertLead.tags || [],
        metadata: insertLead.metadata || {},
      })
      .returning();

    if (result[0]) {
      wsSync.notifyLeadsUpdated(insertLead.userId, { event: 'INSERT', lead: result[0] });
    }
    return result[0];
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    checkDatabase();
    const result = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    if (result[0]) {
      wsSync.notifyLeadsUpdated(result[0].userId, { event: 'UPDATE', lead: result[0] });
    }
    return result[0];
  }

  async getTotalLeadsCount(): Promise<number> {
    checkDatabase();
    const result = await db.select({ count: sql<number>`count(*)` }).from(leads);
    return Number(result[0].count);
  }

  async getMessagesByLeadId(leadId: string): Promise<Message[]> {
    checkDatabase();
    return await db
      .select()
      .from(messages)
      .where(eq(messages.leadId, leadId))
      .orderBy(messages.createdAt);
  }

  async getMessages(leadId: string): Promise<Message[]> {
    checkDatabase();
    return this.getMessagesByLeadId(leadId);
  }

  async getAllMessages(userId: string, options?: { limit?: number; channel?: string }): Promise<Message[]> {
    checkDatabase();

    // Build conditions array
    const conditions = [eq(messages.userId, userId)];

    if (options?.channel) {
      conditions.push(eq(messages.provider, options.channel as any));
    }

    // Build query with combined conditions
    let query = db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt));

    if (options?.limit) {
      return await query.limit(options.limit);
    }

    return await query;
  }

  async createMessage(
    message: Partial<InsertMessage> & {
      leadId: string;
      userId: string;
      direction: "inbound" | "outbound";
      body: string;
    }
  ): Promise<Message> {
    checkDatabase();
    const result = await db
      .insert(messages)
      .values({
        userId: message.userId,
        leadId: message.leadId,
        direction: message.direction,
        body: message.body,
        provider: message.provider || 'system',
        trackingId: message.trackingId || null,
        openedAt: message.openedAt || null,
        clickedAt: message.clickedAt || null,
        repliedAt: message.repliedAt || null,
        createdAt: new Date(),
        metadata: message.metadata || {},
      })
      .returning();

    if (result[0]) {
      wsSync.notifyMessagesUpdated(message.userId, { event: 'INSERT', message: result[0] });
    }
    return result[0];
  }


  async getIntegrations(userId: string): Promise<Integration[]> {
    checkDatabase();
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegration(userId: string, provider: string): Promise<Integration | undefined> {
    checkDatabase();
    const result = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider as any)))
      .limit(1);
    return result[0];
  }

  async getIntegrationsByProvider(provider: string): Promise<Integration[]> {
    checkDatabase();
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.provider, provider as any));
  }

  async createIntegration(
    integration: Partial<InsertIntegration> & {
      userId: string;
      provider: string;
      encryptedMeta: string;
    }
  ): Promise<Integration> {
    checkDatabase();
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

  async updateIntegration(
    userId: string,
    provider: string,
    updates: Partial<Integration>
  ): Promise<Integration | undefined> {
    checkDatabase();
    const result = await db
      .update(integrations)
      .set({
        ...updates,
        provider: provider as any, // Preserve provider to avoid type issues
        updatedAt: new Date(),
      })
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider as any)))
      .returning();

    return result[0];
  }

  async disconnectIntegration(userId: string, provider: string): Promise<void> {
    checkDatabase();
    await db
      .delete(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider as any)));
  }

  async deleteIntegration(userId: string, provider: string): Promise<void> {
    return this.disconnectIntegration(userId, provider);
  }

  async getNotifications(userId: string): Promise<any[]> {
    checkDatabase();
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return result.map((n: any) => ({
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
    checkDatabase();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    checkDatabase();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async createNotification(data: any): Promise<any> {
    checkDatabase();
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

    if (result[0]) {
      wsSync.broadcastToUser(data.userId, { type: 'notification', payload: result[0] });
    }
    return result[0];
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    checkDatabase();
    const result = await db
      .insert(payments)
      .values(data)
      .returning();

    return result[0];
  }

  async getPayments(userId: string): Promise<Payment[]> {
    checkDatabase();
    return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    checkDatabase();
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    checkDatabase();
    const result = await db.update(payments).set({ ...updates, updatedAt: new Date() }).where(eq(payments.id, id)).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<void> {
    checkDatabase();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getLeadByUsername(username: string, channel: string): Promise<Lead | undefined> {
    checkDatabase();
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
    checkDatabase();
    try {
      const result = await db.execute(sql`
        SELECT * FROM video_monitors 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `);
      return result.rows as any[];
    } catch (error) {
      // Return empty array if table doesn't exist yet
      return [];
    }
  }

  async getActiveVideoMonitors(userId: string): Promise<any[]> {
    checkDatabase();
    try {
      const result = await db.execute(sql`
        SELECT * FROM video_monitors 
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY created_at DESC
      `);
      return result.rows as any[];
    } catch (error) {
      // Return empty array if table doesn't exist yet
      return [];
    }
  }

  async getVideoMonitor(id: string): Promise<any> {
    checkDatabase();
    try {
      const result = await db.execute(sql`
        SELECT * FROM video_monitors 
        WHERE id = ${id}
        LIMIT 1
      `);
      return result.rows[0];
    } catch (error) {
      return null;
    }
  }

  async createVideoMonitor(data: any): Promise<any> {
    checkDatabase();
    const result = await db.execute(sql`
      INSERT INTO video_monitors (user_id, video_id, video_url, product_link, cta_text, is_active, auto_reply_enabled, metadata)
      VALUES (${data.userId}, ${data.videoId}, ${data.videoUrl}, ${data.productLink}, ${data.ctaText || 'Check it out'}, ${data.isActive ?? true}, ${data.autoReplyEnabled ?? true}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `);
    return result.rows[0];
  }

  async updateVideoMonitor(id: string, userId: string, updates: any): Promise<any> {
    checkDatabase();
    const setClauses: ReturnType<typeof sql>[] = [];

    if (updates.isActive !== undefined) {
      setClauses.push(sql`is_active = ${updates.isActive}`);
    }
    if (updates.autoReplyEnabled !== undefined) {
      setClauses.push(sql`auto_reply_enabled = ${updates.autoReplyEnabled}`);
    }
    if (updates.productLink) {
      setClauses.push(sql`product_link = ${updates.productLink}`);
    }
    if (updates.ctaText) {
      setClauses.push(sql`cta_text = ${updates.ctaText}`);
    }

    if (setClauses.length === 0) return null;

    setClauses.push(sql`updated_at = NOW()`);

    const result = await db.execute(sql`
      UPDATE video_monitors 
      SET ${sql.join(setClauses, sql`, `)}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `);

    return result.rows[0];
  }

  async deleteVideoMonitor(id: string, userId: string): Promise<void> {
    checkDatabase();
    await db.execute(sql`
      DELETE FROM video_monitors 
      WHERE id = ${id} AND user_id = ${userId}
    `);
  }

  async isCommentProcessed(commentId: string): Promise<boolean> {
    checkDatabase();
    const result = await db.execute(sql`
      SELECT 1 FROM processed_comments WHERE comment_id = ${commentId} LIMIT 1
    `);
    return result.rows.length > 0;
  }

  async markCommentProcessed(commentId: string, status: string, intentType: string): Promise<void> {
    checkDatabase();
    await db.execute(sql`
      INSERT INTO processed_comments (comment_id, status, intent_type, commenter_username, comment_text)
      VALUES (${commentId}, ${status}, ${intentType}, 'unknown', '')
      ON CONFLICT (comment_id) DO NOTHING
    `);
  }

  async getBrandKnowledge(userId: string): Promise<string> {
    checkDatabase();
    const result = await db.execute(sql`
      SELECT content FROM brand_embeddings 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    return result.rows.map((r: any) => r.content).join('\n');
  }

  async getDeals(userId: string): Promise<any[]> {
    checkDatabase();
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
    checkDatabase();
    const result = await db.execute(sql`
      INSERT INTO deals (user_id, lead_id, title, amount, currency, status, source, metadata)
      VALUES (${data.userId}, ${data.leadId || null}, ${data.title}, ${data.amount}, ${data.currency || 'USD'}, ${data.status || 'open'}, ${data.source || 'manual'}, ${JSON.stringify(data.metadata || {})})
      RETURNING *
    `);
    return result.rows[0];
  }

  async updateDeal(id: string, userId: string, updates: any): Promise<any> {
    checkDatabase();
    const updateData: Record<string, any> = {};

    if (updates.status) {
      updateData.status = updates.status;
      if (updates.status === 'closed_won' || updates.status === 'closed_lost') {
        updateData.convertedAt = new Date();
      }
    }
    if (updates.amount !== undefined) {
      updateData.value = updates.amount;
    }

    if (Object.keys(updateData).length === 0) return null;

    const result = await db
      .update(deals)
      .set(updateData)
      .where(and(eq(deals.id, id), eq(deals.userId, userId)))
      .returning();

    return result[0];
  }

  async calculateRevenue(userId: string): Promise<{ total: number; thisMonth: number; deals: Deal[] }> {
    checkDatabase();
    const allDeals = await db.select().from(deals).where(eq(deals.userId, userId));
    const closedDeals = allDeals.filter((d: Deal) => d.status === 'closed_won');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = closedDeals.reduce((sum: number, d: Deal) => sum + (Number(d.value) || 0), 0);
    const thisMonth = closedDeals
      .filter((d: Deal) => d.convertedAt && new Date(d.convertedAt) >= thisMonthStart)
      .reduce((sum: number, d: Deal) => sum + (Number(d.value) || 0), 0);

    return { total, thisMonth, deals: closedDeals };
  }

  async createUsageTopup(data: any): Promise<any> {
    checkDatabase();
    const topup = {
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      metadata: data.metadata || {}
    };

    const result = await db.insert(usageTopups).values(topup).returning();
    return result[0];
  }

  async getUsageTopups(userId: string, type: 'voice' | 'leads'): Promise<any[]> {
    checkDatabase();
    const allTopups = await db
      .select()
      .from(usageTopups)
      .where(eq(usageTopups.userId, userId))
      .orderBy(desc(usageTopups.createdAt));

    // Filter by type in JavaScript since Drizzle has type constraints
    return allTopups.filter((topup: any) => topup.type === type);
  }

  async getUsageHistory(userId: string, type?: 'voice' | 'leads'): Promise<any[]> {
    checkDatabase();
    const allHistory = await db
      .select()
      .from(usageTopups)
      .where(eq(usageTopups.userId, userId))
      .orderBy(desc(usageTopups.createdAt));

    if (type) {
      return allHistory.filter((h: any) => h.type === type);
    }

    return allHistory;
  }

  async getVoiceMinutesBalance(userId: string): Promise<number> {
    checkDatabase();
    const user = await this.getUserById(userId);
    if (!user) return 0;

    const planMinutes = this.getVoiceMinutesForPlan(user.plan);
    const topupMinutes = user.voiceMinutesTopup || 0;
    const usedMinutes = user.voiceMinutesUsed || 0;

    return Math.max(0, planMinutes + topupMinutes - usedMinutes);
  }

  async deductVoiceMinutes(userId: string, minutes: number): Promise<boolean> {
    checkDatabase();
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
    checkDatabase();
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

  // Onboarding methods
  async createOnboardingProfile(data: any): Promise<any> {
    checkDatabase();
    const profile = {
      userId: data.userId,
      userRole: data.userRole,
      source: data.source || null,
      useCase: data.useCase || null,
      businessSize: data.businessSize || null,
      tags: data.tags || [],
      completed: data.completed || false,
      completedAt: data.completedAt || null,
    };

    const result = await db.insert(onboardingProfiles).values(profile).returning();
    return result[0];
  }

  async getOnboardingProfile(userId: string): Promise<any | undefined> {
    checkDatabase();
    const result = await db
      .select()
      .from(onboardingProfiles)
      .where(eq(onboardingProfiles.userId, userId))
      .limit(1);

    return result[0];
  }

  async updateOnboardingProfile(userId: string, updates: Partial<OnboardingProfile>): Promise<OnboardingProfile> {
    const [updated] = await db
      .update(onboardingProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingProfiles.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Onboarding profile not found');
    }

    return updated;
  }

  async createOtpCode(data: { email: string; code: string; expiresAt: Date; attempts: number; verified: boolean; passwordHash?: string; purpose?: string }): Promise<any> {
    const [otp] = await db.insert(otpCodes).values({
      ...data,
      purpose: data.purpose || 'login',
    }).returning();
    return otp;
  }

  async getLatestOtpCode(email: string, purpose?: string): Promise<OtpCode | null> {
    try {
      const normalizedEmail = email.toLowerCase();

      const conditions = [eq(otpCodes.email, normalizedEmail)];

      if (purpose) {
        conditions.push(eq(otpCodes.purpose, purpose));
      }

      const result = await db
        .select()
        .from(otpCodes)
        .where(and(...conditions))
        .orderBy(desc(otpCodes.createdAt))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error getting latest OTP code:', error);
      throw error;
    }
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(eq(otpCodes.id, id));
  }

  async markOtpVerified(id: string): Promise<void> {
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, id));
  }

  async cleanupDemoData(): Promise<{ deletedUsers: number }> {
    checkDatabase();
    // Delete all users with @demo.com email (used by seeder)
    const result = await db.delete(users)
      .where(like(users.email, '%@demo.com'))
      .returning();

    console.log(`🧹 Demo Data Cleanup: Deleted ${result.length} demo users`);
    return { deletedUsers: result.length };
  }

  // ========== Follow Up Queue ==========
  async createFollowUp(data: InsertFollowUpQueue): Promise<FollowUpQueue> {
    checkDatabase();
    const [result] = await db.insert(followUpQueue).values(data).returning();
    return result;
  }

  async getPendingFollowUp(leadId: string): Promise<FollowUpQueue | undefined> {
    checkDatabase();
    const [result] = await db
      .select()
      .from(followUpQueue)
      .where(and(eq(followUpQueue.leadId, leadId), eq(followUpQueue.status, 'pending')))
      .limit(1);
    return result;
  }

  async updateFollowUpStatus(id: string, status: string, errorMessage?: string | null): Promise<FollowUpQueue | undefined> {
    checkDatabase();
    const updateData: any = { status, processedAt: new Date() };
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;

    // Validate status against enum if enforcing strict types, or cast as any if dynamic
    const [updated] = await db
      .update(followUpQueue)
      .set(updateData)
      .where(eq(followUpQueue.id, id))
      .returning();
    return updated;
  }

  // ========== OAuth Accounts ==========
  async getOAuthAccount(userId: string, provider: string): Promise<OAuthAccount | undefined> {
    checkDatabase();
    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider as any)));
    return account;
  }

  async getSoonExpiringOAuthAccounts(provider: string, thresholdMinutes: number): Promise<OAuthAccount[]> {
    checkDatabase();
    const threshold = new Date(Date.now() + thresholdMinutes * 60 * 1000);
    const accounts = await db.select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, provider as any),
          lte(oauthAccounts.expiresAt, threshold)
        )
      );
    return accounts;
  }

  async saveOAuthAccount(data: InsertOAuthAccount): Promise<OAuthAccount> {
    checkDatabase();
    const existing = await this.getOAuthAccount(data.userId, data.provider);

    if (existing) {
      const [updated] = await db
        .update(oauthAccounts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(oauthAccounts.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(oauthAccounts)
        .values(data)
        .returning();
      return created;
    }
  }

  async deleteOAuthAccount(userId: string, provider: string): Promise<void> {
    checkDatabase();
    await db.delete(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider as any)));
  }

  // ========== Calendar Events ==========
  async createCalendarEvent(data: InsertCalendarEvent): Promise<CalendarEvent> {
    checkDatabase();
    const [result] = await db.insert(calendarEvents).values(data).returning();

    if (result) {
      wsSync.notifyCalendarUpdated(data.userId, { event: 'INSERT', eventData: result });
    }
    return result;
  }

  // ========== Audit Trail ==========
  async createAuditLog(data: InsertAuditTrail): Promise<AuditTrail> {
    checkDatabase();
    const [result] = await db.insert(auditTrail).values(data).returning();
    return result;
  }
}

export const drizzleStorage = new DrizzleStorage();