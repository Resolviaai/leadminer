import {
  pgTable,
  bigserial,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const keywordStatusEnum = pgEnum('keyword_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETRY',
  'SKIPPED',
]);

export const leadQualificationStatusEnum = pgEnum('lead_qualification_status', [
  'UNQUALIFIED',
  'QUALIFIED',
  'DISQUALIFIED',
]);

export const leadOutreachStatusEnum = pgEnum('lead_outreach_status', [
  'UNPROCESSED',
  'QUEUED',
  'CONTACTED',
  'REPLIED',
  'BOUNCED',
  'UNSUBSCRIBED',
]);

export const emailVerificationStatusEnum = pgEnum('email_verification_status', [
  'UNKNOWN',
  'VALID',
  'DOMAIN_VALID',
  'MAILBOX_VERIFIED',
  'INVALID',
  'RISKY',
  'DISPOSABLE',
  'FAILED',
]);

export const contactTypeEnum = pgEnum('contact_type', [
  'EMAIL',
  'WEBSITE',
  'INSTAGRAM',
  'TWITTER_X',
  'TIKTOK',
  'DISCORD',
  'LINKEDIN',
  'LINKTREE',
  'BEACONS',
  'OTHER',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'STOPPED',
]);

export const messageSendStatusEnum = pgEnum('message_send_status', [
  'PENDING',
  'GENERATING',
  'READY',
  'SENDING',
  'SENT',
  'FAILED',
  'CANCELLED',
]);

export const personalizationStatusEnum = pgEnum('personalization_status', [
  'NONE',
  'PENDING',
  'CUSTOMIZED',
  'FALLBACK',
  'FAILED',
]);

export const accountStatusEnum = pgEnum('account_status', [
  'ACTIVE',
  'PAUSED',
  'QUOTA_EXCEEDED',
  'AUTH_ERROR',
  'DISABLED',
]);

export const jobStatusEnum = pgEnum('job_status', [
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'STOPPED_QUOTA',
]);

export const logLevelEnum = pgEnum('log_level', [
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'FATAL',
]);

// Tables

// 1. keywords
export const keywords = pgTable(
  'keywords',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    keyword: varchar('keyword', { length: 500 }).notNull(),
    normalizedKeyword: varchar('normalized_keyword', { length: 500 }).notNull(),
    category: varchar('category', { length: 255 }).notNull(),
    entity: varchar('entity', { length: 255 }).notNull(),
    modifier: varchar('modifier', { length: 255 }).notNull(),
    status: keywordStatusEnum('status').notNull().default('PENDING'),
    attemptCount: integer('attempt_count').notNull().default(0),
    channelsFound: integer('channels_found').notNull().default(0),
    newChannelsFound: integer('new_channels_found').notNull().default(0),
    qualifiedLeadsFound: integer('qualified_leads_found').notNull().default(0),
    emailsFound: integer('emails_found').notNull().default(0),
    verifiedEmails: integer('verified_emails').notNull().default(0),
    priorityScore: integer('priority_score').notNull().default(50),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_keywords_normalized').on(table.normalizedKeyword),
    index('idx_keywords_status_attempts').on(table.status, table.attemptCount),
    index('idx_keywords_priority_status').on(table.priorityScore, table.status, table.attemptCount),
    index('idx_keywords_category').on(table.category),
    index('idx_keywords_last_attempt').on(table.lastAttemptAt),
  ]
);

// 2. leads
export const leads = pgTable(
  'leads',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    channelId: varchar('channel_id', { length: 100 }).notNull(),
    channelUrl: varchar('channel_url', { length: 500 }).notNull(),
    channelTitle: varchar('channel_title', { length: 500 }).notNull(),
    customUrl: varchar('custom_url', { length: 255 }),
    description: text('description'),
    website: varchar('website', { length: 500 }),
    thumbnailUrl: varchar('thumbnail_url', { length: 1000 }),
    subscriberCount: bigint('subscriber_count', { mode: 'number' }).default(0),
    videoCount: integer('video_count').default(0),
    viewCount: bigint('view_count', { mode: 'number' }).default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    sourceKeywordId: bigint('source_keyword_id', { mode: 'number' }).references(() => keywords.id, { onDelete: 'set null' }),
    qualificationStatus: leadQualificationStatusEnum('qualification_status').notNull().default('UNQUALIFIED'),
    outreachStatus: leadOutreachStatusEnum('outreach_status').notNull().default('UNPROCESSED'),
    suppressionStatus: boolean('suppression_status').notNull().default(false),
    discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    country: varchar('country', { length: 10 }),
    rawPayload: jsonb('raw_payload'),
  },
  (table) => [
    uniqueIndex('uq_leads_channel_id').on(table.channelId),
    index('idx_leads_qualification').on(table.qualificationStatus, table.outreachStatus),
    index('idx_leads_subscriber_count').on(table.subscriberCount),
    index('idx_leads_source_keyword').on(table.sourceKeywordId),
    index('idx_leads_country').on(table.country),
  ]
);

// 2b. lead_keyword_sources (Provenance Tracking)
export const leadKeywordSources = pgTable(
  'lead_keyword_sources',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull().references(() => leads.id, { onDelete: 'cascade' }),
    keywordId: bigint('keyword_id', { mode: 'number' }).notNull().references(() => keywords.id, { onDelete: 'cascade' }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_lead_keyword_source').on(table.leadId, table.keywordId),
    index('idx_lead_keyword_lead_id').on(table.leadId),
    index('idx_lead_keyword_keyword_id').on(table.keywordId),
  ]
);

// 3. contacts (Supports 1:N contacts per lead: all emails, social handles, Linktree, etc.)
export const contacts = pgTable(
  'contacts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull().references(() => leads.id, { onDelete: 'cascade' }),
    contactType: contactTypeEnum('contact_type').notNull().default('EMAIL'),
    value: text('value'),
    normalizedValue: text('normalized_value'),
    source: varchar('source', { length: 100 }).default('description'),
    isPrimary: boolean('is_primary').notNull().default(true),
    email: varchar('email', { length: 255 }),
    emailStatus: emailVerificationStatusEnum('email_status').notNull().default('UNKNOWN'),
    verificationProvider: varchar('verification_provider', { length: 100 }),
    verificationTimestamp: timestamp('verification_timestamp', { withTimezone: true }),
    verificationReason: text('verification_reason'),
    instagram: varchar('instagram', { length: 255 }),
    twitter: varchar('twitter', { length: 255 }),
    discord: varchar('discord', { length: 255 }),
    tiktok: varchar('tiktok', { length: 255 }),
    linkedin: varchar('linkedin', { length: 255 }),
    otherSocial: jsonb('other_social'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_contacts_lead_type_value').on(table.leadId, table.contactType, table.normalizedValue),
    index('idx_contacts_lead_type').on(table.leadId, table.contactType),
    index('idx_contacts_email_status').on(table.emailStatus),
    index('idx_contacts_email').on(table.email),
  ]
);

// 4. templates
export const templates = pgTable('templates', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  variables: jsonb('variables').default(['first_name', 'channel_name', 'channel_url', 'subscriber_count', 'custom_line']),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5. campaigns
export const campaigns = pgTable(
  'campaigns',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    status: campaignStatusEnum('status').notNull().default('DRAFT'),
    templateId: bigint('template_id', { mode: 'number' }).references(() => templates.id, { onDelete: 'restrict' }),
    dailyLimit: integer('daily_limit').notNull().default(50),
    minSubscribers: bigint('min_subscribers', { mode: 'number' }).default(10),
    maxSubscribers: bigint('max_subscribers', { mode: 'number' }),
    targetCountry: varchar('target_country', { length: 10 }).default('US'),
    targetCategories: jsonb('target_categories').default([]),
    enableGeminiPersonalization: boolean('enable_gemini_personalization').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_campaigns_status').on(table.status)]
);

// 6. gmail_accounts
export const gmailAccounts = pgTable(
  'gmail_accounts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    status: accountStatusEnum('status').notNull().default('ACTIVE'),
    dailyLimit: integer('daily_limit').notNull().default(25),
    sentToday: integer('sent_today').notNull().default(0),
    lastSendAt: timestamp('last_send_at', { withTimezone: true }),
    credentialReference: varchar('credential_reference', { length: 500 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_gmail_accounts_email').on(table.email),
    index('idx_gmail_accounts_status_limit').on(table.status, table.sentToday, table.dailyLimit),
  ]
);

// 7. messages
export const messages = pgTable(
  'messages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull().references(() => leads.id, { onDelete: 'restrict' }),
    campaignId: bigint('campaign_id', { mode: 'number' }).notNull().references(() => campaigns.id, { onDelete: 'restrict' }),
    gmailAccountId: bigint('gmail_account_id', { mode: 'number' }).references(() => gmailAccounts.id, { onDelete: 'set null' }),
    templateId: bigint('template_id', { mode: 'number' }).references(() => templates.id, { onDelete: 'restrict' }),
    recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    body: text('body').notNull(),
    personalizationStatus: personalizationStatusEnum('personalization_status').notNull().default('NONE'),
    personalizationModel: varchar('personalization_model', { length: 100 }),
    personalizationError: text('personalization_error'),
    sendStatus: messageSendStatusEnum('send_status').notNull().default('PENDING'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    messageId: varchar('message_id', { length: 255 }),
    threadId: varchar('thread_id', { length: 255 }),
    error: text('error'),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_messages_lead_campaign').on(table.leadId, table.campaignId),
    uniqueIndex('uq_messages_idempotency').on(table.idempotencyKey),
    index('idx_messages_send_status').on(table.sendStatus),
    index('idx_messages_thread_id').on(table.threadId),
  ]
);

// 8. replies
export const replies = pgTable(
  'replies',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull().references(() => leads.id, { onDelete: 'cascade' }),
    gmailAccountId: bigint('gmail_account_id', { mode: 'number' }).notNull().references(() => gmailAccounts.id, { onDelete: 'cascade' }),
    threadId: varchar('thread_id', { length: 255 }).notNull(),
    messageId: varchar('message_id', { length: 255 }).notNull(),
    senderEmail: varchar('sender_email', { length: 255 }).notNull(),
    snippet: text('snippet'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    processed: boolean('processed').notNull().default(false),
    telegramNotified: boolean('telegram_notified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_replies_message_id').on(table.messageId),
    index('idx_replies_thread_id').on(table.threadId),
    index('idx_replies_unprocessed').on(table.processed),
  ]
);

// 9. jobs
export const jobs = pgTable(
  'jobs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    jobType: varchar('job_type', { length: 100 }).notNull(),
    status: jobStatusEnum('status').notNull().default('QUEUED'),
    parameters: jsonb('parameters').default({}),
    itemsTotal: integer('items_total').default(0),
    itemsProcessed: integer('items_processed').default(0),
    itemsFailed: integer('items_failed').default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_jobs_status').on(table.status)]
);

// 10. logs
export const logs = pgTable(
  'logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    jobId: bigint('job_id', { mode: 'number' }).references(() => jobs.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    level: logLevelEnum('level').notNull().default('INFO'),
    message: text('message').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_logs_created_at').on(table.createdAt),
    index('idx_logs_event_level').on(table.eventType, table.level),
  ]
);

// 11. suppressions
export const suppressions = pgTable(
  'suppressions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    email: varchar('email', { length: 255 }),
    channelId: varchar('channel_id', { length: 100 }),
    reason: varchar('reason', { length: 255 }).notNull().default('UNSUBSCRIBED'),
    source: varchar('source', { length: 100 }).notNull().default('OPT_OUT_LINK'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_suppressions_email').on(table.email),
    index('idx_suppressions_channel').on(table.channelId),
  ]
);

// 12. system_settings
export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const keywordsRelations = relations(keywords, ({ many }) => ({
  leads: many(leads),
  keywordSources: many(leadKeywordSources),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  sourceKeyword: one(keywords, {
    fields: [leads.sourceKeywordId],
    references: [keywords.id],
  }),
  contacts: many(contacts),
  keywordSources: many(leadKeywordSources),
  messages: many(messages),
  replies: many(replies),
}));

export const leadKeywordSourcesRelations = relations(leadKeywordSources, ({ one }) => ({
  lead: one(leads, {
    fields: [leadKeywordSources.leadId],
    references: [leads.id],
  }),
  keyword: one(keywords, {
    fields: [leadKeywordSources.keywordId],
    references: [keywords.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  lead: one(leads, {
    fields: [contacts.leadId],
    references: [leads.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  template: one(templates, {
    fields: [campaigns.templateId],
    references: [templates.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  lead: one(leads, {
    fields: [messages.leadId],
    references: [leads.id],
  }),
  campaign: one(campaigns, {
    fields: [messages.campaignId],
    references: [campaigns.id],
  }),
  gmailAccount: one(gmailAccounts, {
    fields: [messages.gmailAccountId],
    references: [gmailAccounts.id],
  }),
  template: one(templates, {
    fields: [messages.templateId],
    references: [templates.id],
  }),
}));
