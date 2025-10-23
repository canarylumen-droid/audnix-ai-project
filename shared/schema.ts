import { z } from "zod";

// ========== USERS & AUTH ==========
export const userSchema = z.object({
  id: z.string().uuid(),
  supabaseId: z.string().nullable(),
  email: z.string().email(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  avatar: z.string().url().nullable(),
  company: z.string().nullable(),
  timezone: z.string().default("America/New_York"),
  plan: z.enum(["trial", "starter", "pro", "enterprise"]).default("trial"),
  trialExpiresAt: z.date().nullable(),
  replyTone: z.enum(["friendly", "professional", "short"]).default("professional"),
  role: z.enum(["admin", "member"]).default("member"),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  createdAt: z.date(),
  lastLogin: z.date().nullable(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id" | "createdAt">;

// ========== LEADS ==========
export const leadSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  externalId: z.string().nullable(),
  name: z.string(),
  channel: z.enum(["instagram", "whatsapp", "email"]),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  status: z.enum(["new", "open", "replied", "converted", "not_interested", "cold"]).default("new"),
  score: z.number().min(0).max(100).default(0),
  warm: z.boolean().default(false),
  lastMessageAt: z.date().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Lead = z.infer<typeof leadSchema>;
export type InsertLead = Omit<Lead, "id" | "createdAt" | "updatedAt">;

// ========== MESSAGES ==========
export const messageSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.enum(["instagram", "whatsapp", "gmail"]),
  direction: z.enum(["inbound", "outbound"]),
  body: z.string(),
  audioUrl: z.string().url().nullable(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
});

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = Omit<Message, "id" | "createdAt">;

// ========== DEALS ==========
export const dealSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  userId: z.string().uuid(),
  brand: z.string(),
  channel: z.enum(["instagram", "whatsapp", "email"]),
  value: z.number(),
  status: z.enum(["converted", "lost", "pending"]).default("pending"),
  notes: z.string().nullable(),
  convertedAt: z.date().nullable(),
  meetingScheduled: z.boolean().default(false),
  meetingUrl: z.string().url().nullable(),
  createdAt: z.date(),
});

export type Deal = z.infer<typeof dealSchema>;
export type InsertDeal = Omit<Deal, "id" | "createdAt">;

// ========== INTEGRATIONS ==========
export const integrationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.enum(["instagram", "whatsapp", "gmail", "outlook", "manychat"]),
  encryptedMeta: z.string(), // Encrypted credentials as string (iv:tag:ciphertext)
  connected: z.boolean().default(false),
  accountType: z.enum(["personal", "creator", "business"]).nullable(),
  lastSync: z.date().nullable(),
  createdAt: z.date(),
});

export type Integration = z.infer<typeof integrationSchema>;
export type InsertIntegration = Omit<Integration, "id" | "createdAt">;

// ========== VOICE SETTINGS ==========
export const voiceSettingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isActive: z.boolean().default(false),
  voiceSampleUrl: z.string().url().nullable(),
  voiceCloneId: z.string().nullable(),
  consentGiven: z.boolean().default(false),
  minutesUsed: z.number().default(0),
  minutesAllowed: z.number().default(100),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VoiceSetting = z.infer<typeof voiceSettingSchema>;
export type InsertVoiceSetting = Omit<VoiceSetting, "id" | "createdAt" | "updatedAt">;

// ========== AUTOMATIONS ==========
export const automationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean().default(true),
  tone: z.enum(["friendly", "professional", "short"]).default("professional"),
  schedule: z.array(z.object({
    delay: z.string(), // "12h", "24h", "48h", "72h", "7d"
    action: z.string(), // "send_message", "escalate_channel", "send_voice"
    channel: z.enum(["instagram", "whatsapp", "email"]).nullable(),
    randomizationWindow: z.number().default(0), // Minutes of variance
  })).default([]),
  triggers: z.array(z.object({
    condition: z.string(),
    value: z.string(),
  })).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Automation = z.infer<typeof automationSchema>;
export type InsertAutomation = Omit<Automation, "id" | "createdAt" | "updatedAt">;

// ========== CALENDAR EVENTS ==========
export const calendarEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  leadId: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.date(),
  endTime: z.date(),
  meetingUrl: z.string().url().nullable(),
  provider: z.enum(["google", "outlook"]),
  externalId: z.string(),
  attendees: z.array(z.string().email()).default([]),
  isAiBooked: z.boolean().default(false),
  preCallNote: z.string().nullable(),
  createdAt: z.date(),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type InsertCalendarEvent = Omit<CalendarEvent, "id" | "createdAt">;

// ========== NOTIFICATIONS ==========
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["webhook_error", "billing_issue", "conversion", "lead_reply", "system"]),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  actionUrl: z.string().url().nullable(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = Omit<Notification, "id" | "createdAt">;

// ========== TEAM MEMBERS ==========
export const teamMemberSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["admin", "member"]).default("member"),
  invitedBy: z.string().uuid().nullable(),
  invitedAt: z.date(),
  acceptedAt: z.date().nullable(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;
export type InsertTeamMember = Omit<TeamMember, "id">;

// ========== WEBHOOKS ==========
export const webhookSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  url: z.string().url(),
  events: z.array(z.string()).default([]),
  secret: z.string(),
  isActive: z.boolean().default(true),
  lastTriggeredAt: z.date().nullable(),
  failureCount: z.number().default(0),
  createdAt: z.date(),
});

export type Webhook = z.infer<typeof webhookSchema>;
export type InsertWebhook = Omit<Webhook, "id" | "createdAt">;

// ========== ADMIN METRICS ==========
export const adminMetricsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  trialUsers: z.number(),
  paidUsers: z.number(),
  mrr: z.number(),
  apiBurn: z.number(),
  failedJobs: z.number(),
  storageUsed: z.number(),
  timestamp: z.date(),
});

export type AdminMetrics = z.infer<typeof adminMetricsSchema>;

// ========== USAGE STATS ==========
export const usageStatsSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["trial", "starter", "pro", "enterprise"]),
  leadsCount: z.number(),
  leadsLimit: z.number(),
  voiceMinutesUsed: z.number(),
  voiceMinutesLimit: z.number(),
  messagesThisMonth: z.number(),
  storageUsed: z.number(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
});

export type UsageStats = z.infer<typeof usageStatsSchema>;

// ========== INSIGHTS ==========
export const insightSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  summary: z.string(),
  metrics: z.object({
    totalLeads: z.number(),
    conversions: z.number(),
    conversionRate: z.number(),
    topChannel: z.string(),
    topPerformingTime: z.string(),
    avgResponseTime: z.string(),
  }),
  channelBreakdown: z.array(z.object({
    channel: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  generatedAt: z.date(),
});

export type Insight = z.infer<typeof insightSchema>;
export type InsertInsight = Omit<Insight, "id" | "generatedAt">;

// ========== API KEYS ==========
export const apiKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  key: z.string(),
  lastUsedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;
export type InsertApiKey = Omit<ApiKey, "id" | "createdAt">;
