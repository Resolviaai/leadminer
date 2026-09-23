import {
  pgTable,
  bigserial,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const sequenceStatusEnum = pgEnum('sequence_status', [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'ARCHIVED',
]);

export const leadSequenceStatusEnum = pgEnum('lead_sequence_status', [
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED_REPLY',
  'CANCELLED_OPT_OUT',
  'CANCELLED_BOUNCED',
]);

export const keywordStatusEnum = pgEnum('keyword_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETRY',
  'SKIPPED',
  'PAUSED',
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
  'PHONE',
  'WHATSAPP',
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
  'SIMULATED',
  'UNCONFIRMED',
]);

export const scheduledEmailStatusEnum = pgEnum('scheduled_email_status', [
  'PENDING',
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
  'DISCONNECTED',
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
    phone: varchar('phone', { length: 50 }),
    contactPageUrl: varchar('contact_page_url', { length: 500 }),
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
    linkScrapeStatus: varchar('link_scrape_status', { length: 20 }),
    emailCategory: varchar('email_category', { length: 30 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_contacts_lead_type_value').on(table.leadId, table.contactType, table.normalizedValue),
    index('idx_contacts_lead_type').on(table.leadId, table.contactType),
    index('idx_contacts_email_status').on(table.emailStatus),
    index('idx_contacts_email').on(table.email),
    index('idx_contacts_link_scrape_status').on(table.linkScrapeStatus),
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
    targetCountry: varchar('target_country', { length: 10 }).default('TIER_1'),
    targetCategories: jsonb('target_categories').default([]),
    enableGeminiPersonalization: boolean('enable_gemini_personalization').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_campaigns_status').on(table.status)]
);

// 5b. sequences
export const sequences = pgTable(
  'sequences',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    campaignId: bigint('campaign_id', { mode: 'number' }).notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    weekendPolicy: varchar('weekend_policy', { length: 30 }).notNull().default('SKIP_WEEKENDS'),
    capacityBias: numeric('capacity_bias', { precision: 5, scale: 2 }).notNull().default('0.00'),
    priorityWeights: jsonb('priority_weights').default({ overdue: 10, step: 1, subs: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_sequences_campaign_id').on(table.campaignId),
    index('idx_sequences_is_active').on(table.isActive),
  ]
);

// 5c. sequence_steps
export const sequenceSteps = pgTable(
  'sequence_steps',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    sequenceId: bigint('sequence_id', { mode: 'number' }).notNull().references(() => sequences.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull(),
    templateId: bigint('template_id', { mode: 'number' }).notNull().references(() => templates.id, { onDelete: 'restrict' }),
    delayDays: integer('delay_days').notNull().default(2),
    delayHours: integer('delay_hours').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_sequence_steps_seq_num').on(table.sequenceId, table.stepNumber),
    index('idx_sequence_steps_template_id').on(table.templateId),
  ]
);

// 5d. lead_sequence_progress (State Machine)
export const leadSequenceProgress = pgTable(
  'lead_sequence_progress',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    leadId: bigint('lead_id', { mode: 'number' }).notNull().references(() => leads.id, { onDelete: 'cascade' }),
    campaignId: bigint('campaign_id', { mode: 'number' }).notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
    contactId: bigint('contact_id', { mode: 'number' }).notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    sequenceId: bigint('sequence_id', { mode: 'number' }).notNull().references(() => sequences.id, { onDelete: 'cascade' }),
    currentStep: integer('current_step').notNull().default(1),
    status: leadSequenceStatusEnum('status').notNull().default('ACTIVE'),
    pinnedGmailAccountId: bigint('pinned_gmail_account_id', { mode: 'number' }).references(() => gmailAccounts.id, { onDelete: 'set null' }),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    nextStepDueAt: timestamp('next_step_due_at', { withTimezone: true }),
    threadId: varchar('thread_id', { length: 255 }),
    lastRfc822MessageId: varchar('last_rfc822_message_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_lead_seq_progress_contact_seq').on(table.contactId, table.sequenceId),
    index('idx_lead_seq_progress_status_due').on(table.status, table.nextStepDueAt),
    index('idx_lead_seq_progress_lead_status').on(table.leadId, table.status),
    index('idx_lead_seq_progress_account_due').on(table.pinnedGmailAccountId, table.status, table.nextStepDueAt),
  ]
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
    tokenGrantedAt: timestamp('token_granted_at', { withTimezone: true }),
    googleAccountId: varchar('google_account_id', { length: 255 }),
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
    contactId: bigint('contact_id', { mode: 'number' }).references(() => contacts.id, { onDelete: 'set null' }),
    recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    body: text('body').notNull(),
    stepNumber: integer('step_number').notNull().default(1),
    rfc822MessageId: varchar('rfc822_message_id', { length: 255 }),
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
    uniqueIndex('uq_messages_lead_campaign_contact_step').on(table.leadId, table.campaignId, table.contactId, table.stepNumber),
    uniqueIndex('uq_messages_idempotency').on(table.idempotencyKey),
    index('idx_messages_send_status').on(table.sendStatus),
    index('idx_messages_thread_id').on(table.threadId),
    index('idx_messages_contact_id').on(table.contactId),
    index('idx_messages_rfc822_id').on(table.rfc822MessageId),
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

// 8b. scheduled_emails
export const scheduledEmails = pgTable(
  'scheduled_emails',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    campaignId: bigint('campaign_id', { mode: 'number' }).notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
    leadId: bigint('lead_id', { mode: 'number' }).notNull().references(() => leads.id, { onDelete: 'cascade' }),
    contactId: bigint('contact_id', { mode: 'number' }).notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    gmailAccountId: bigint('gmail_account_id', { mode: 'number' }).notNull().references(() => gmailAccounts.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull().default(1),
    inReplyToRfcId: varchar('in_reply_to_rfc_id', { length: 255 }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    scheduledDate: date('scheduled_date').notNull(),
    status: scheduledEmailStatusEnum('status').notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    sentMessageId: varchar('sent_message_id', { length: 255 }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_scheduled_emails_dispatch').on(table.scheduledAt, table.status),
    index('idx_scheduled_emails_lead_status').on(table.leadId, table.status),
    index('idx_scheduled_emails_account').on(table.gmailAccountId, table.scheduledAt),
    uniqueIndex('uq_scheduled_emails_contact_step').on(table.contactId, table.campaignId, table.stepNumber),
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
  scheduledEmails: many(scheduledEmails),
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
  scheduledEmails: many(scheduledEmails),
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

export const scheduledEmailsRelations = relations(scheduledEmails, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [scheduledEmails.campaignId],
    references: [campaigns.id],
  }),
  lead: one(leads, {
    fields: [scheduledEmails.leadId],
    references: [leads.id],
  }),
  contact: one(contacts, {
    fields: [scheduledEmails.contactId],
    references: [contacts.id],
  }),
  gmailAccount: one(gmailAccounts, {
    fields: [scheduledEmails.gmailAccountId],
    references: [gmailAccounts.id],
  }),
}));
