import { z } from "zod";
import { pgTable, text, uuid, timestamp, boolean, integer, jsonb, varchar, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ========== DRIZZLE DATABASE TABLES ==========

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supabaseId: text("supabase_id"),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  username: text("username"),
  avatar: text("avatar"),
  company: text("company"),
  timezone: text("timezone").notNull().default("America/New_York"),
  plan: text("plan", { enum: ["trial", "starter", "pro", "enterprise"] }).notNull().default("trial"),
  trialExpiresAt: timestamp("trial_expires_at"),
  replyTone: text("reply_tone", { enum: ["friendly", "professional", "short"] }).notNull().default("professional"),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  voiceCloneId: text("voice_clone_id"),
  voiceMinutesUsed: real("voice_minutes_used").notNull().default(0),
  voiceMinutesTopup: real("voice_minutes_topup").notNull().default(0),
  businessName: text("business_name"),
  voiceRules: text("voice_rules"),
  lastInsightGeneratedAt: timestamp("last_insight_generated_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalId: text("external_id"),
  name: text("name").notNull(),
  channel: text("channel", { enum: ["instagram", "whatsapp", "email"] }).notNull(),
  email: text("email"),
  phone: text("phone"),
  status: text("status", { enum: ["new", "open", "replied", "converted", "not_interested", "cold"] }).notNull().default("new"),
  score: integer("score").notNull().default(0),
  warm: boolean("warm").notNull().default(false),
  lastMessageAt: timestamp("last_message_at"),
  aiPaused: boolean("ai_paused").notNull().default(false),
  pdfConfidence: real("pdf_confidence"),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["instagram", "whatsapp", "gmail", "email", "system"] }).notNull(),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  body: text("body").notNull(),
  audioUrl: text("audio_url"),
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["instagram", "whatsapp", "gmail", "outlook", "manychat", "custom_email", "google_calendar", "calendly"] }).notNull(),
  encryptedMeta: text("encrypted_meta").notNull(),
  connected: boolean("connected").notNull().default(false),
  accountType: text("account_type", { enum: ["personal", "creator", "business"] }),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  brand: text("brand").notNull(),
  channel: text("channel", { enum: ["instagram", "whatsapp", "email", "gmail", "manual"] }).notNull(),
  value: real("value").notNull(),
  status: text("status", { enum: ["open", "closed_won", "closed_lost", "pending"] }).notNull().default("open"),
  notes: text("notes"),
  convertedAt: timestamp("converted_at"),
  meetingScheduled: boolean("meeting_scheduled").notNull().default(false),
  meetingUrl: text("meeting_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const voiceSettings = pgTable("voice_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(false),
  voiceSampleUrl: text("voice_sample_url"),
  voiceCloneId: text("voice_clone_id"),
  consentGiven: boolean("consent_given").notNull().default(false),
  minutesUsed: integer("minutes_used").notNull().default(0),
  minutesAllowed: integer("minutes_allowed").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const automations = pgTable("automations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  tone: text("tone", { enum: ["friendly", "professional", "short"] }).notNull().default("professional"),
  schedule: jsonb("schedule").$type<Array<{
    delay: string;
    action: string;
    channel: "instagram" | "whatsapp" | "email" | null;
    randomizationWindow: number;
  }>>().notNull().default(sql`'[]'::jsonb`),
  triggers: jsonb("triggers").$type<Array<{ condition: string; value: string }>>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetingUrl: text("meeting_url"),
  provider: text("provider", { enum: ["google", "outlook"] }).notNull(),
  externalId: text("external_id").notNull(),
  attendees: jsonb("attendees").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isAiBooked: boolean("is_ai_booked").notNull().default(false),
  preCallNote: text("pre_call_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videoMonitors = pgTable("video_monitors", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: text("video_id").notNull(),
  videoUrl: text("video_url").notNull(),
  productLink: text("product_link").notNull(),
  ctaText: text("cta_text").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  autoReplyEnabled: boolean("auto_reply_enabled").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const processedComments = pgTable("processed_comments", {
  id: text("id").primaryKey(),
  commentId: text("comment_id").notNull().unique(),
  action: text("action").notNull(),
  intentType: text("intent_type").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow()
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["webhook_error", "billing_issue", "conversion", "lead_reply", "system", "insight"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid("organization_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  invitedBy: uuid("invited_by"),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: jsonb("events").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  secret: text("secret").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const followUpQueue = pgTable("follow_up_queue", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["instagram", "whatsapp", "email"] }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  processedAt: timestamp("processed_at"),
  context: jsonb("context").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailWarmupSchedules = pgTable("email_warmup_schedules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day: integer("day").notNull(), // 1-30
  dailyLimit: integer("daily_limit").notNull(), // emails to send today
  randomDelay: boolean("random_delay").notNull().default(true), // 2-12s delays
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bounceTracker = pgTable("bounce_tracker", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  bounceType: text("bounce_type", { enum: ["hard", "soft", "spam"] }).notNull(),
  email: text("email").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  period: jsonb("period").$type<{ start: Date; end: Date }>().notNull(),
  summary: text("summary").notNull(),
  metrics: jsonb("metrics").$type<{
    totalLeads: number;
    conversions: number;
    conversionRate: number;
    topChannel: string;
    topPerformingTime: string;
    avgResponseTime: string;
  }>().notNull(),
  channelBreakdown: jsonb("channel_breakdown").$type<Array<{
    channel: string;
    count: number;
    percentage: number;
  }>>().notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const usageTopups = pgTable("usage_topups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["leads", "voice"] }).notNull(),
  amount: real("amount").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const brandEmbeddings = pgTable("brand_embeddings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  embedding: text("embedding"), // Vector stored as text in Neon
  snippet: text("snippet").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const onboardingProfiles = pgTable("onboarding_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  userRole: text("user_role", { enum: ["creator", "founder", "developer", "agency", "freelancer", "other"] }),
  source: text("source"),
  useCase: text("use_case"),
  businessSize: text("business_size", { enum: ["solo", "small_team", "medium", "enterprise"] }),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["github", "google", "linkedin", "whatsapp", "instagram", "facebook"] }).notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  tokenType: text("token_type"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditTrail = pgTable("audit_trail", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "ai_message_sent", "opt_out_toggled", "pdf_processed", "upload_rate_limited"
  messageId: uuid("message_id"),
  details: jsonb("details").$type<Record<string, any>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pdfAnalytics = pgTable("pdf_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  confidence: real("confidence").notNull(),
  missingFields: jsonb("missing_fields").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  leadsExtracted: integer("leads_extracted").notNull().default(0),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const uploadRateLimit = pgTable("upload_rate_limit", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  uploads: integer("uploads").notNull().default(0),
  lastResetAt: timestamp("last_reset_at").notNull().defaultNow(),
  windowSizeMinutes: integer("window_size_minutes").notNull().default(60),
});

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ========== ZOD VALIDATION SCHEMAS ==========

// Generate insert schemas from Drizzle tables
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true });
export const insertVoiceSettingSchema = createInsertSchema(voiceSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAutomationSchema = createInsertSchema(automations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertWebhookSchema = createInsertSchema(webhooks).omit({ id: true, createdAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });
export const insertInsightSchema = createInsertSchema(insights).omit({ id: true, generatedAt: true });
export const insertBrandEmbeddingSchema = createInsertSchema(brandEmbeddings).omit({ id: true, createdAt: true });
export const insertOnboardingProfileSchema = createInsertSchema(onboardingProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOAuthAccountSchema = createInsertSchema(oauthAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true });
export const insertEmailWarmupScheduleSchema = createInsertSchema(emailWarmupSchedules).omit({ id: true, createdAt: true });
export const insertBounceTrackerSchema = createInsertSchema(bounceTracker).omit({ id: true, createdAt: true });

// Types from Drizzle
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BrandEmbedding = typeof brandEmbeddings.$inferSelect;
export type InsertBrandEmbedding = typeof brandEmbeddings.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;
export type VoiceSetting = typeof voiceSettings.$inferSelect;
export type InsertVoiceSetting = typeof voiceSettings.$inferInsert;
export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = typeof automations.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;
export type OnboardingProfile = typeof onboardingProfiles.$inferSelect;
export type InsertOnboardingProfile = typeof onboardingProfiles.$inferInsert;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type InsertOAuthAccount = typeof oauthAccounts.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;
export type EmailWarmupSchedule = typeof emailWarmupSchedules.$inferSelect;
export type InsertEmailWarmupSchedule = typeof emailWarmupSchedules.$inferInsert;
export type BounceTracker = typeof bounceTracker.$inferSelect;
export type InsertBounceTracker = typeof bounceTracker.$inferInsert;

// LEGACY - Keep old Zod schemas for backward compatibility (deprecated)
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

// ========== INTEGRATIONS ==========
export const integrationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.enum(["instagram", "whatsapp", "gmail", "outlook", "manychat", "custom_email"]),
  encryptedMeta: z.string(), // Encrypted credentials as string (iv:tag:ciphertext)
  connected: z.boolean().default(false),
  accountType: z.enum(["personal", "creator", "business"]).nullable(),
  lastSync: z.date().nullable(),
  createdAt: z.date(),
});

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

// ========== NOTIFICATIONS ==========
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["webhook_error", "billing_issue", "conversion", "lead_reply", "system", "insight"]),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  actionUrl: z.string().url().nullable(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
});

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
