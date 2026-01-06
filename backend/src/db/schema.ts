import {
  pgTable,
  pgEnum,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  json,
  index,
  unique,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================

export const userRoleEnum = pgEnum('UserRole', ['DETECTIVE', 'ADMIN']);

export const caseStatusEnum = pgEnum('CaseStatus', [
  'NEW',
  'IN_RESEARCH',
  'WAITING_FOR_RESPONSE',
  'HEIRS_IDENTIFIED',
  'SUCCESSFULLY_SOLVED',
  'CLOSED_WITHOUT_SUCCESS',
  'ON_HOLD',
]);

export const personRoleEnum = pgEnum('PersonRole', [
  'DECEASED',
  'POTENTIAL_HEIR',
  'RELATIVE',
  'CONTACT_PERSON',
  'OTHER',
]);

export const contactTypeEnum = pgEnum('ContactType', [
  'ADDRESS',
  'PHONE',
  'EMAIL',
  'SOCIAL_MEDIA',
  'WEBSITE',
  'OTHER',
]);

export const relationshipTypeEnum = pgEnum('RelationshipType', [
  'PARENT',
  'CHILD',
  'SIBLING',
  'SPOUSE',
  'GRANDPARENT',
  'GRANDCHILD',
  'UNCLE_AUNT',
  'NEPHEW_NIECE',
  'COUSIN',
  'OTHER',
]);

export const artifactTypeEnum = pgEnum('ArtifactType', [
  'GENEALOGY_SEARCH',
  'SOCIAL_MEDIA_PROFILE',
  'PUBLIC_RECORD',
  'COURT_DOCUMENT',
  'PERPLEXITY_RESEARCH',
  'WEB_SEARCH',
  'MANUAL_NOTE',
  'OTHER',
]);

export const waveStatusEnum = pgEnum('WaveStatus', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const strategyStatusEnum = pgEnum('StrategyStatus', [
  'ACTIVE',
  'TESTED',
  'SUCCESSFUL',
  'FAILED',
  'DEPRECATED',
]);

export const documentTypeEnum = pgEnum('DocumentType', [
  'EMAIL',
  'LETTER',
  'INTERNAL_NOTE',
  'COURT_INQUIRY',
  'COURT_RESPONSE',
  'HEIR_CONTACT',
  'OTHER',
]);

// ============================================================================
// User Management
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  firstName: varchar('firstName', { length: 255 }).notNull(),
  lastName: varchar('lastName', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('DETECTIVE').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// ============================================================================
// Case Management
// ============================================================================

export const cases = pgTable('cases', {
  id: text('id').primaryKey().notNull(),
  caseNumber: varchar('caseNumber', { length: 255 }).unique().notNull(),

  // Deceased person data
  deceasedFirstName: varchar('deceasedFirstName', { length: 255 }).notNull(),
  deceasedLastName: varchar('deceasedLastName', { length: 255 }).notNull(),
  deceasedBirthDate: timestamp('deceasedBirthDate'),
  deceasedDeathDate: timestamp('deceasedDeathDate'),
  birthPlace: varchar('birthPlace', { length: 255 }),
  deathPlace: varchar('deathPlace', { length: 255 }),

  // Case metadata
  status: caseStatusEnum('status').default('NEW').notNull(),
  court: varchar('court', { length: 255 }),
  estateValue: decimal('estateValue', { precision: 12, scale: 2 }),
  threshold: decimal('threshold', { precision: 12, scale: 2 }),

  // Source & References
  sourceType: varchar('sourceType', { length: 255 }),
  sourceReference: text('sourceReference'),
  originalText: text('originalText'),

  // Budget & Limits
  budgetEur: decimal('budgetEur', { precision: 10, scale: 2 }).default('100').notNull(),
  maxApiCallsPerSource: integer('maxApiCallsPerSource').default(50).notNull(),
  currentSpentEur: decimal('currentSpentEur', { precision: 10, scale: 2 }).default('0').notNull(),

  // Metrics
  successProbability: decimal('successProbability', { precision: 5, scale: 2 }),
  researchWaveCount: integer('researchWaveCount').default(0).notNull(),

  // Notes & Results
  notes: text('notes'),
  resultSummary: text('resultSummary'),

  // Timestamps
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  closedAt: timestamp('closedAt'),

  // Foreign Keys
  createdById: text('createdById').notNull().references(() => users.id),
  assignedToId: text('assignedToId').references(() => users.id),
}, (table) => ({
  statusIdx: index('cases_status_idx').on(table.status),
  createdAtIdx: index('cases_createdAt_idx').on(table.createdAt),
  courtIdx: index('cases_court_idx').on(table.court),
}));

// ============================================================================
// Person & Relationship Management
// ============================================================================

export const persons = pgTable('persons', {
  id: text('id').primaryKey().notNull(),
  firstName: varchar('firstName', { length: 255 }).notNull(),
  lastName: varchar('lastName', { length: 255 }).notNull(),
  birthDate: timestamp('birthDate'),
  deathDate: timestamp('deathDate'),
  birthPlace: varchar('birthPlace', { length: 255 }),
  deathPlace: varchar('deathPlace', { length: 255 }),
  gender: varchar('gender', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('persons_name_idx').on(table.lastName, table.firstName),
}));

export const personCases = pgTable('person_cases', {
  id: text('id').primaryKey().notNull(),
  personId: text('personId').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  caseId: text('caseId').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  role: personRoleEnum('role').default('RELATIVE').notNull(),
  heirProbability: decimal('heirProbability', { precision: 5, scale: 2 }),
  reasoning: text('reasoning'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  uniquePersonCase: unique('person_case_unique').on(table.personId, table.caseId),
  caseRoleIdx: index('person_cases_case_role_idx').on(table.caseId, table.role),
}));

// ============================================================================
// Contact Information
// ============================================================================

export const contactInfos = pgTable('contact_infos', {
  id: text('id').primaryKey().notNull(),
  type: contactTypeEnum('type').notNull(),
  value: text('value').notNull(),
  label: varchar('label', { length: 255 }),
  isVerified: boolean('isVerified').default(false).notNull(),
  trustScore: decimal('trustScore', { precision: 5, scale: 2 }),
  notes: text('notes'),
  personId: text('personId').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  personTypeIdx: index('contact_infos_person_type_idx').on(table.personId, table.type),
}));

// ============================================================================
// Relationships
// ============================================================================

export const relationships = pgTable('relationships', {
  id: text('id').primaryKey().notNull(),
  type: relationshipTypeEnum('type').notNull(),
  description: text('description'),
  fromPersonId: text('fromPersonId').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  toPersonId: text('toPersonId').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  trustScore: decimal('trustScore', { precision: 5, scale: 2 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  uniqueRelationship: unique('relationship_unique').on(table.fromPersonId, table.toPersonId, table.type),
  fromPersonIdx: index('relationships_from_person_idx').on(table.fromPersonId),
  toPersonIdx: index('relationships_to_person_idx').on(table.toPersonId),
}));

// ============================================================================
// Research Artifacts
// ============================================================================

export const researchArtifacts = pgTable('research_artifacts', {
  id: text('id').primaryKey().notNull(),
  type: artifactTypeEnum('type').notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  sourceUrl: text('sourceUrl'),
  rawText: text('rawText').notNull(),
  structuredData: json('structuredData'),
  embedding: text('embedding'),
  relevanceScore: decimal('relevanceScore', { precision: 5, scale: 2 }),
  trustScore: decimal('trustScore', { precision: 5, scale: 2 }),
  apiCost: decimal('apiCost', { precision: 10, scale: 4 }),
  caseId: text('caseId').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  researchWaveId: text('researchWaveId').references(() => researchWaves.id, { onDelete: 'set null' }),
  strategyExecutionId: text('strategyExecutionId').references(() => strategyExecutions.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  caseTypeIdx: index('research_artifacts_case_type_idx').on(table.caseId, table.type),
  sourceIdx: index('research_artifacts_source_idx').on(table.source),
  createdAtIdx: index('research_artifacts_createdAt_idx').on(table.createdAt),
}));

// ============================================================================
// Research Waves
// ============================================================================

export const researchWaves = pgTable('research_waves', {
  id: text('id').primaryKey().notNull(),
  waveNumber: integer('waveNumber').notNull(),
  status: waveStatusEnum('status').default('PENDING').notNull(),
  maxBudgetEur: decimal('maxBudgetEur', { precision: 10, scale: 2 }).notNull(),
  actualCostEur: decimal('actualCostEur', { precision: 10, scale: 2 }).default('0').notNull(),
  artifactsFound: integer('artifactsFound').default(0).notNull(),
  personsFound: integer('personsFound').default(0).notNull(),
  notes: text('notes'),
  caseId: text('caseId').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  startedAt: timestamp('startedAt'),
  completedAt: timestamp('completedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  caseWaveIdx: index('research_waves_case_wave_idx').on(table.caseId, table.waveNumber),
}));

// ============================================================================
// Strategies
// ============================================================================

export const strategies = pgTable('strategies', {
  id: text('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  promptTemplate: text('promptTemplate').notNull(),
  targetIntegration: varchar('targetIntegration', { length: 255 }).notNull(),
  parameters: json('parameters'),
  status: strategyStatusEnum('status').default('ACTIVE').notNull(),
  timesExecuted: integer('timesExecuted').default(0).notNull(),
  timesSuccessful: integer('timesSuccessful').default(0).notNull(),
  successRate: decimal('successRate', { precision: 5, scale: 2 }),
  avgArtifactsFound: decimal('avgArtifactsFound', { precision: 10, scale: 2 }),
  avgCost: decimal('avgCost', { precision: 10, scale: 4 }),
  isAiGenerated: boolean('isAiGenerated').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  statusSuccessRateIdx: index('strategies_status_successRate_idx').on(table.status, table.successRate),
}));

export const strategyExecutions = pgTable('strategy_executions', {
  id: text('id').primaryKey().notNull(),
  strategyId: text('strategyId').notNull().references(() => strategies.id, { onDelete: 'cascade' }),
  caseId: text('caseId').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  researchWaveId: text('researchWaveId').references(() => researchWaves.id, { onDelete: 'set null' }),
  status: waveStatusEnum('status').default('PENDING').notNull(),
  executedQuery: text('executedQuery').notNull(),
  artifactsCreated: integer('artifactsCreated').default(0).notNull(),
  costEur: decimal('costEur', { precision: 10, scale: 4 }),
  wasSuccessful: boolean('wasSuccessful'),
  errorMessage: text('errorMessage'),
  startedAt: timestamp('startedAt'),
  completedAt: timestamp('completedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  caseIdx: index('strategy_executions_case_idx').on(table.caseId),
  strategyIdx: index('strategy_executions_strategy_idx').on(table.strategyId),
}));

// ============================================================================
// Documents
// ============================================================================

export const documents = pgTable('documents', {
  id: text('id').primaryKey().notNull(),
  type: documentTypeEnum('type').notNull(),
  direction: varchar('direction', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  content: text('content').notNull(),
  recipient: varchar('recipient', { length: 255 }),
  sender: varchar('sender', { length: 255 }),
  attachments: json('attachments'),
  embedding: text('embedding'),
  caseId: text('caseId').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  sentAt: timestamp('sentAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  caseTypeIdx: index('documents_case_type_idx').on(table.caseId, table.type),
}));

// ============================================================================
// Integrations
// ============================================================================

export const integrations = pgTable('integrations', {
  id: text('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  config: json('config').notNull(),
  dailyCallLimit: integer('dailyCallLimit'),
  monthlyCostLimit: decimal('monthlyCostLimit', { precision: 10, scale: 2 }),
  totalCalls: integer('totalCalls').default(0).notNull(),
  totalCost: decimal('totalCost', { precision: 12, scale: 2 }).default('0').notNull(),
  lastUsedAt: timestamp('lastUsedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// ============================================================================
// Budget Tracking
// ============================================================================

export const budgetTracking = pgTable('budget_tracking', {
  id: text('id').primaryKey().notNull(),
  caseId: text('caseId').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  integration: varchar('integration', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 4 }).notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  caseIdx: index('budget_tracking_case_idx').on(table.caseId),
  createdAtIdx: index('budget_tracking_createdAt_idx').on(table.createdAt),
}));

// ============================================================================
// Comments
// ============================================================================

export const comments = pgTable('comments', {
  id: text('id').primaryKey().notNull(),
  content: text('content').notNull(),
  caseId: text('caseId').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  authorId: text('authorId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  caseIdx: index('comments_case_idx').on(table.caseId),
}));

// ============================================================================
// Many-to-Many Relations (for artifacts)
// ============================================================================

export const contactInfoSourceArtifacts = pgTable('contact_info_source_artifacts', {
  contactInfoId: text('contactInfoId').notNull().references(() => contactInfos.id, { onDelete: 'cascade' }),
  artifactId: text('artifactId').notNull().references(() => researchArtifacts.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.contactInfoId, table.artifactId] }),
}));

export const relationshipProofArtifacts = pgTable('relationship_proof_artifacts', {
  relationshipId: text('relationshipId').notNull().references(() => relationships.id, { onDelete: 'cascade' }),
  artifactId: text('artifactId').notNull().references(() => researchArtifacts.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.relationshipId, table.artifactId] }),
}));

// ============================================================================
// Relations (for Drizzle ORM query builder)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  casesCreated: many(cases, { relationName: 'createdBy' }),
  casesAssigned: many(cases, { relationName: 'assignedTo' }),
  comments: many(comments),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [cases.createdById],
    references: [users.id],
    relationName: 'createdBy',
  }),
  assignedTo: one(users, {
    fields: [cases.assignedToId],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  persons: many(personCases),
  artifacts: many(researchArtifacts),
  researchWaves: many(researchWaves),
  documents: many(documents),
  budgetTracking: many(budgetTracking),
  strategyExecutions: many(strategyExecutions),
  comments: many(comments),
}));

export const personsRelations = relations(persons, ({ many }) => ({
  cases: many(personCases),
  contactInfos: many(contactInfos),
  relationshipsFrom: many(relationships, { relationName: 'fromPerson' }),
  relationshipsTo: many(relationships, { relationName: 'toPerson' }),
}));

export const personCasesRelations = relations(personCases, ({ one }) => ({
  person: one(persons, {
    fields: [personCases.personId],
    references: [persons.id],
  }),
  case: one(cases, {
    fields: [personCases.caseId],
    references: [cases.id],
  }),
}));

export const contactInfosRelations = relations(contactInfos, ({ one, many }) => ({
  person: one(persons, {
    fields: [contactInfos.personId],
    references: [persons.id],
  }),
  sourceArtifacts: many(contactInfoSourceArtifacts),
}));

export const relationshipsRelations = relations(relationships, ({ one, many }) => ({
  fromPerson: one(persons, {
    fields: [relationships.fromPersonId],
    references: [persons.id],
    relationName: 'fromPerson',
  }),
  toPerson: one(persons, {
    fields: [relationships.toPersonId],
    references: [persons.id],
    relationName: 'toPerson',
  }),
  proofArtifacts: many(relationshipProofArtifacts),
}));

export const researchArtifactsRelations = relations(researchArtifacts, ({ one, many }) => ({
  case: one(cases, {
    fields: [researchArtifacts.caseId],
    references: [cases.id],
  }),
  researchWave: one(researchWaves, {
    fields: [researchArtifacts.researchWaveId],
    references: [researchWaves.id],
  }),
  strategyExecution: one(strategyExecutions, {
    fields: [researchArtifacts.strategyExecutionId],
    references: [strategyExecutions.id],
  }),
  contactInfoSources: many(contactInfoSourceArtifacts),
  relationshipProofs: many(relationshipProofArtifacts),
}));

export const researchWavesRelations = relations(researchWaves, ({ one, many }) => ({
  case: one(cases, {
    fields: [researchWaves.caseId],
    references: [cases.id],
  }),
  artifacts: many(researchArtifacts),
  strategyExecutions: many(strategyExecutions),
}));

export const strategiesRelations = relations(strategies, ({ many }) => ({
  executions: many(strategyExecutions),
}));

export const strategyExecutionsRelations = relations(strategyExecutions, ({ one, many }) => ({
  strategy: one(strategies, {
    fields: [strategyExecutions.strategyId],
    references: [strategies.id],
  }),
  case: one(cases, {
    fields: [strategyExecutions.caseId],
    references: [cases.id],
  }),
  researchWave: one(researchWaves, {
    fields: [strategyExecutions.researchWaveId],
    references: [researchWaves.id],
  }),
  artifacts: many(researchArtifacts),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  case: one(cases, {
    fields: [comments.caseId],
    references: [cases.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const budgetTrackingRelations = relations(budgetTracking, ({ one }) => ({
  case: one(cases, {
    fields: [budgetTracking.caseId],
    references: [cases.id],
  }),
}));
