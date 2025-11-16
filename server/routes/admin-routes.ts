import { Router, type Request, type Response } from "express";
import { requireAdmin } from "../middleware/auth";
import { db } from "../db";
import { users, leads, messages, integrations } from "../../shared/schema";
import { eq, desc, sql, and, gte, count, sum } from "drizzle-orm";

const router = Router();

// All routes require admin authentication
router.use(requireAdmin);

// ============ ANALYTICS ENDPOINTS ============

// Get dashboard overview
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    // Get total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get active users (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastLogin, thirtyDaysAgo));
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Get new users (last 30 days)
    const newUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));
    const newUsers = newUsersResult[0]?.count || 0;

    // Calculate MRR
    const planPrices: Record<string, number> = {
      starter: 49,
      pro: 199,
      enterprise: 499,
    };

    const paidUsers = await db
      .select({ plan: users.plan })
      .from(users)
      .where(and(
        sql`${users.stripeSubscriptionId} IS NOT NULL`,
        sql`${users.plan} != 'trial'`
      ));

    const mrr = paidUsers.reduce((total, user) => {
      return total + (planPrices[user.plan] || 0);
    }, 0);

    // Get total leads
    const totalLeadsResult = await db.select({ count: count() }).from(leads);
    const totalLeads = totalLeadsResult[0]?.count || 0;

    // Get total messages
    const totalMessagesResult = await db.select({ count: count() }).from(messages);
    const totalMessages = totalMessagesResult[0]?.count || 0;

    res.json({
      totalUsers,
      activeUsers,
      newUsers,
      mrr,
      totalLeads,
      totalMessages,
      period: "last_30_days",
    });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    res.status(500).json({ error: "Failed to fetch overview data" });
  }
});

// Get user growth data
router.get("/analytics/user-growth", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Get daily user registrations
    const userGrowth = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({ growth: userGrowth.rows });
  } catch (error) {
    console.error("Error fetching user growth:", error);
    res.status(500).json({ error: "Failed to fetch user growth data" });
  }
});

// Get revenue analytics
router.get("/analytics/revenue", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Calculate daily revenue based on subscriptions
    const planPrices: Record<string, number> = {
      starter: 49,
      pro: 199,
      enterprise: 499,
    };

    const subscriptionsByDate = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        plan,
        COUNT(*) as subscriptions
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
        AND stripe_subscription_id IS NOT NULL
        AND plan != 'trial'
      GROUP BY DATE(created_at), plan
      ORDER BY date DESC
    `);

    // Calculate revenue per day
    const revenueData = (subscriptionsByDate.rows as any[]).reduce((acc: any[], row: any) => {
      const existingDay = acc.find(d => d.date === row.date);
      const revenue = (planPrices[row.plan] || 0) * parseInt(row.subscriptions);
      
      if (existingDay) {
        existingDay.revenue += revenue;
      } else {
        acc.push({ date: row.date, revenue });
      }
      return acc;
    }, []);

    res.json({ revenue: revenueData });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
});

// Get channel performance
router.get("/analytics/channels", async (req: Request, res: Response) => {
  try {
    const channelStats = await db.execute(sql`
      SELECT 
        channel,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions,
        ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as conversion_rate
      FROM leads
      GROUP BY channel
      ORDER BY total_leads DESC
    `);

    res.json({ channels: channelStats.rows });
  } catch (error) {
    console.error("Error fetching channel analytics:", error);
    res.status(500).json({ error: "Failed to fetch channel data" });
  }
});

// ============ USER MANAGEMENT ENDPOINTS ============

// Search and list users
router.get("/users", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let query = db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));

    if (search) {
      query = query.where(
        sql`${users.email} ILIKE ${'%' + search + '%'} 
            OR ${users.name} ILIKE ${'%' + search + '%'}
            OR ${users.username} ILIKE ${'%' + search + '%'}`
      ) as any;
    }

    const usersList = await query;

    // Get total count
    const totalResult = await db.select({ count: count() }).from(users);
    const total = totalResult[0]?.count || 0;

    res.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get specific user details
router.get("/users/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's leads
    const userLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.userId, userId))
      .orderBy(desc(leads.createdAt))
      .limit(10);

    // Get user's integrations
    const userIntegrations = await db
      .select({
        id: integrations.id,
        provider: integrations.provider,
        connected: integrations.connected,
        lastSync: integrations.lastSync,
      })
      .from(integrations)
      .where(eq(integrations.userId, userId));

    // Get lead stats
    const leadStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open
      FROM leads
      WHERE user_id = ${userId}
    `);

    // Get message stats
    const messageStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as received,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as sent
      FROM messages
      WHERE user_id = ${userId}
    `);

    res.json({
      user,
      leads: userLeads,
      integrations: userIntegrations,
      stats: {
        leads: leadStats.rows[0],
        messages: messageStats.rows[0],
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

// Get user activity timeline
router.get("/users/:userId/activity", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Get recent leads
    const recentLeads = await db
      .select({
        id: leads.id,
        type: sql<string>`'lead_created'`,
        description: sql<string>`'New lead: ' || ${leads.name} || ' from ' || ${leads.channel}`,
        timestamp: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.userId, userId))
      .orderBy(desc(leads.createdAt))
      .limit(limit);

    // Get recent messages
    const recentMessages = await db
      .select({
        id: messages.id,
        type: sql<string>`CASE WHEN ${messages.direction} = 'inbound' THEN 'message_received' ELSE 'message_sent' END`,
        description: sql<string>`${messages.direction} || ' message via ' || ${messages.provider}`,
        timestamp: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    // Combine and sort by timestamp
    const activity = [...recentLeads, ...recentMessages]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    res.json({ activity });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

// ============ LEAD MANAGEMENT ============

// Get all leads (read-only view)
router.get("/leads", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const channel = req.query.channel as string;

    let query = db
      .select({
        lead: leads,
        user: {
          email: users.email,
          name: users.name,
        },
      })
      .from(leads)
      .leftJoin(users, eq(leads.userId, users.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(leads.createdAt));

    const conditions = [];
    if (status) conditions.push(eq(leads.status, status as any));
    if (channel) conditions.push(eq(leads.channel, channel as any));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const leadsList = await query;

    // Get total count
    const totalResult = await db.select({ count: count() }).from(leads);
    const total = totalResult[0]?.count || 0;

    res.json({
      leads: leadsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// ============ ADMIN WHITELIST MANAGEMENT ============

// Get admin whitelist
router.get("/whitelist", async (req: Request, res: Response) => {
  try {
    const whitelist = await db.execute(sql`
      SELECT * FROM admin_whitelist 
      ORDER BY created_at DESC
    `);

    res.json({ whitelist: whitelist.rows });
  } catch (error) {
    console.error("Error fetching admin whitelist:", error);
    res.status(500).json({ error: "Failed to fetch whitelist" });
  }
});

// Add email to whitelist
router.post("/whitelist", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const adminId = (req as any).user?.id;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const result = await db.execute(sql`
      INSERT INTO admin_whitelist (email, invited_by, status)
      VALUES (${email.toLowerCase()}, ${adminId}, 'active')
      ON CONFLICT (email) DO UPDATE SET status = 'active', updated_at = NOW()
      RETURNING *
    `);

    res.json({ success: true, admin: result.rows[0] });
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    res.status(500).json({ error: "Failed to add email to whitelist" });
  }
});

// Remove email from whitelist
router.delete("/whitelist/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    await db.execute(sql`
      UPDATE admin_whitelist 
      SET status = 'revoked', updated_at = NOW()
      WHERE email = ${email.toLowerCase()}
    `);

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    res.status(500).json({ error: "Failed to remove email from whitelist" });
  }
});

export default router;
