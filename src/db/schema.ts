import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';

// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Concepts table - Core research concepts being tracked
export const concepts = sqliteTable('concepts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  originalConcept: text('original_concept').notNull(),
  refinedConcept: text('refined_concept'),
  status: text('status').notNull().default('pending'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  slugIdx: index('concepts_slug_idx').on(table.slug),
  statusIdx: index('concepts_status_idx').on(table.status),
  userIdIdx: index('concepts_user_id_idx').on(table.userId),
}));

// Veritus Jobs table - Tracks Veritus API job executions
export const veritusJobs = sqliteTable('veritus_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conceptId: integer('concept_id').notNull().references(() => concepts.id),
  jobId: text('job_id').notNull().unique(),
  searchPhrase: text('search_phrase').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  conceptIdIdx: index('veritus_jobs_concept_id_idx').on(table.conceptId),
  jobIdIdx: index('veritus_jobs_job_id_idx').on(table.jobId),
  statusIdx: index('veritus_jobs_status_idx').on(table.status),
}));

// Papers table - Academic papers collected from research
export const papers = sqliteTable('papers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  veritusJobId: integer('veritus_job_id').notNull().references(() => veritusJobs.id),
  title: text('title').notNull(),
  authors: text('authors', { mode: 'json' }),
  abstract: text('abstract'),
  publicationDate: text('publication_date'),
  doi: text('doi'),
  arxivId: text('arxiv_id'),
  citations: integer('citations'),
  sourceUrl: text('source_url'),
  relevanceScore: real('relevance_score'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  veritusJobIdIdx: index('papers_veritus_job_id_idx').on(table.veritusJobId),
  doiIdx: index('papers_doi_idx').on(table.doi),
  arxivIdIdx: index('papers_arxiv_id_idx').on(table.arxivId),
}));

// Lineage table - Tracks provenance and evolution of research concepts
export const lineage = sqliteTable('lineage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conceptId: integer('concept_id').notNull().references(() => concepts.id),
  paperId: integer('paper_id').notNull().references(() => papers.id),
  ancestorPaperId: integer('ancestor_paper_id').references(() => papers.id),
  mutationType: text('mutation_type').notNull(),
  mutationDescription: text('mutation_description'),
  era: text('era'),
  influenceScore: real('influence_score'),
  positionX: real('position_x'),
  positionY: real('position_y'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  conceptIdIdx: index('lineage_concept_id_idx').on(table.conceptId),
  paperIdIdx: index('lineage_paper_id_idx').on(table.paperId),
  ancestorPaperIdIdx: index('lineage_ancestor_paper_id_idx').on(table.ancestorPaperId),
}));

// Narratives table - Generated narratives and insights about research concepts
export const narratives = sqliteTable('narratives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conceptId: integer('concept_id').notNull().references(() => concepts.id),
  fullNarrative: text('full_narrative').notNull(),
  summary: text('summary'),
  keyInsights: text('key_insights', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  conceptIdIdx: index('narratives_concept_id_idx').on(table.conceptId),
}));

// Subscriptions table - Manages user subscription plans and billing
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  dodoCustomerId: text('dodo_customer_id'),
  dodoSubscriptionId: text('dodo_subscription_id').unique(),
  planType: text('plan_type').notNull().default('free'),
  status: text('status').notNull().default('active'),
  currentPeriodStart: text('current_period_start'),
  currentPeriodEnd: text('current_period_end'),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
}));

// Usage Tracking table - Tracks monthly usage limits per user
export const usageTracking = sqliteTable('usage_tracking', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  month: text('month').notNull(),
  conceptTracesUsed: integer('concept_traces_used').notNull().default(0),
  conceptTracesLimit: integer('concept_traces_limit').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  userIdIdx: index('usage_tracking_user_id_idx').on(table.userId),
  monthIdx: index('usage_tracking_month_idx').on(table.month),
  userMonthIdx: index('usage_tracking_user_month_idx').on(table.userId, table.month),
}));

// Payment Events table - Logs payment-related webhook events
export const paymentEvents = sqliteTable('payment_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  dodoEventId: text('dodo_event_id').unique(),
  eventData: text('event_data', { mode: 'json' }).notNull(),
  processedAt: text('processed_at').notNull(),
}, (table) => ({
  userIdIdx: index('payment_events_user_id_idx').on(table.userId),
  eventTypeIdx: index('payment_events_event_type_idx').on(table.eventType),
}));