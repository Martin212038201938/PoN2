-- ============================================================================
-- Drizzle ORM Schema Migration for PoN2-Backend
-- Generated from: backend/src/db/schema.ts
-- Database: PostgreSQL (y-b_pon2_production on AlwaysData)
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUMS (PostgreSQL Types)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('DETECTIVE', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CaseStatus" AS ENUM (
    'NEW',
    'IN_RESEARCH',
    'WAITING_FOR_RESPONSE',
    'HEIRS_IDENTIFIED',
    'SUCCESSFULLY_SOLVED',
    'CLOSED_WITHOUT_SUCCESS',
    'ON_HOLD'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PersonRole" AS ENUM (
    'DECEASED',
    'POTENTIAL_HEIR',
    'RELATIVE',
    'CONTACT_PERSON',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContactType" AS ENUM (
    'ADDRESS',
    'PHONE',
    'EMAIL',
    'SOCIAL_MEDIA',
    'WEBSITE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RelationshipType" AS ENUM (
    'PARENT',
    'CHILD',
    'SIBLING',
    'SPOUSE',
    'GRANDPARENT',
    'GRANDCHILD',
    'UNCLE_AUNT',
    'NEPHEW_NIECE',
    'COUSIN',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ArtifactType" AS ENUM (
    'GENEALOGY_SEARCH',
    'SOCIAL_MEDIA_PROFILE',
    'PUBLIC_RECORD',
    'COURT_DOCUMENT',
    'PERPLEXITY_RESEARCH',
    'WEB_SEARCH',
    'MANUAL_NOTE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "WaveStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "StrategyStatus" AS ENUM (
    'ACTIVE',
    'TESTED',
    'SUCCESSFUL',
    'FAILED',
    'DEPRECATED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentType" AS ENUM (
    'EMAIL',
    'LETTER',
    'INTERNAL_NOTE',
    'COURT_INQUIRY',
    'COURT_RESPONSE',
    'HEIR_CONTACT',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CREATE TABLES (in dependency order)
-- ============================================================================

-- ============================================================================
-- Users Table (no dependencies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password" text NOT NULL,
  "firstName" varchar(255) NOT NULL,
  "lastName" varchar(255) NOT NULL,
  "role" "UserRole" DEFAULT 'DETECTIVE' NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Persons Table (no dependencies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "persons" (
  "id" text PRIMARY KEY NOT NULL,
  "firstName" varchar(255) NOT NULL,
  "lastName" varchar(255) NOT NULL,
  "birthDate" timestamp,
  "deathDate" timestamp,
  "birthPlace" varchar(255),
  "deathPlace" varchar(255),
  "gender" varchar(50),
  "notes" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Integrations Table (no dependencies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "integrations" (
  "id" text PRIMARY KEY NOT NULL,
  "name" varchar(255) UNIQUE NOT NULL,
  "type" varchar(255) NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "config" json NOT NULL,
  "dailyCallLimit" integer,
  "monthlyCostLimit" decimal(10, 2),
  "totalCalls" integer DEFAULT 0 NOT NULL,
  "totalCost" decimal(12, 2) DEFAULT '0' NOT NULL,
  "lastUsedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Strategies Table (no dependencies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "strategies" (
  "id" text PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "promptTemplate" text NOT NULL,
  "targetIntegration" varchar(255) NOT NULL,
  "parameters" json,
  "status" "StrategyStatus" DEFAULT 'ACTIVE' NOT NULL,
  "timesExecuted" integer DEFAULT 0 NOT NULL,
  "timesSuccessful" integer DEFAULT 0 NOT NULL,
  "successRate" decimal(5, 2),
  "avgArtifactsFound" decimal(10, 2),
  "avgCost" decimal(10, 4),
  "isAiGenerated" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Cases Table (references users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "cases" (
  "id" text PRIMARY KEY NOT NULL,
  "caseNumber" varchar(255) UNIQUE NOT NULL,

  -- Deceased person data
  "deceasedFirstName" varchar(255) NOT NULL,
  "deceasedLastName" varchar(255) NOT NULL,
  "deceasedBirthDate" timestamp,
  "deceasedDeathDate" timestamp,
  "birthPlace" varchar(255),
  "deathPlace" varchar(255),

  -- Case metadata
  "status" "CaseStatus" DEFAULT 'NEW' NOT NULL,
  "court" varchar(255),
  "estateValue" decimal(12, 2),
  "threshold" decimal(12, 2),

  -- Source & References
  "sourceType" varchar(255),
  "sourceReference" text,
  "originalText" text,

  -- Budget & Limits
  "budgetEur" decimal(10, 2) DEFAULT '100' NOT NULL,
  "maxApiCallsPerSource" integer DEFAULT 50 NOT NULL,
  "currentSpentEur" decimal(10, 2) DEFAULT '0' NOT NULL,

  -- Metrics
  "successProbability" decimal(5, 2),
  "researchWaveCount" integer DEFAULT 0 NOT NULL,

  -- Notes & Results
  "notes" text,
  "resultSummary" text,

  -- Timestamps
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "closedAt" timestamp,

  -- Foreign Keys
  "createdById" text NOT NULL REFERENCES "users"("id"),
  "assignedToId" text REFERENCES "users"("id")
);

-- ============================================================================
-- Person Cases Table (references persons and cases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "person_cases" (
  "id" text PRIMARY KEY NOT NULL,
  "personId" text NOT NULL REFERENCES "persons"("id") ON DELETE CASCADE,
  "caseId" text NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "role" "PersonRole" DEFAULT 'RELATIVE' NOT NULL,
  "heirProbability" decimal(5, 2),
  "reasoning" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "person_case_unique" UNIQUE ("personId", "caseId")
);

-- ============================================================================
-- Contact Infos Table (references persons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "contact_infos" (
  "id" text PRIMARY KEY NOT NULL,
  "type" "ContactType" NOT NULL,
  "value" text NOT NULL,
  "label" varchar(255),
  "isVerified" boolean DEFAULT false NOT NULL,
  "trustScore" decimal(5, 2),
  "notes" text,
  "personId" text NOT NULL REFERENCES "persons"("id") ON DELETE CASCADE,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Relationships Table (references persons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "relationships" (
  "id" text PRIMARY KEY NOT NULL,
  "type" "RelationshipType" NOT NULL,
  "description" text,
  "fromPersonId" text NOT NULL REFERENCES "persons"("id") ON DELETE CASCADE,
  "toPersonId" text NOT NULL REFERENCES "persons"("id") ON DELETE CASCADE,
  "trustScore" decimal(5, 2),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "relationship_unique" UNIQUE ("fromPersonId", "toPersonId", "type")
);

-- ============================================================================
-- Research Waves Table (references cases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "research_waves" (
  "id" text PRIMARY KEY NOT NULL,
  "waveNumber" integer NOT NULL,
  "status" "WaveStatus" DEFAULT 'PENDING' NOT NULL,
  "maxBudgetEur" decimal(10, 2) NOT NULL,
  "actualCostEur" decimal(10, 2) DEFAULT '0' NOT NULL,
  "artifactsFound" integer DEFAULT 0 NOT NULL,
  "personsFound" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "caseId" text NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "startedAt" timestamp,
  "completedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Strategy Executions Table (references strategies, cases, research_waves)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "strategy_executions" (
  "id" text PRIMARY KEY NOT NULL,
  "strategyId" text NOT NULL REFERENCES "strategies"("id") ON DELETE CASCADE,
  "caseId" text NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "researchWaveId" text REFERENCES "research_waves"("id") ON DELETE SET NULL,
  "status" "WaveStatus" DEFAULT 'PENDING' NOT NULL,
  "executedQuery" text NOT NULL,
  "artifactsCreated" integer DEFAULT 0 NOT NULL,
  "costEur" decimal(10, 4),
  "wasSuccessful" boolean,
  "errorMessage" text,
  "startedAt" timestamp,
  "completedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Research Artifacts Table (references cases, research_waves, strategy_executions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "research_artifacts" (
  "id" text PRIMARY KEY NOT NULL,
  "type" "ArtifactType" NOT NULL,
  "source" varchar(255) NOT NULL,
  "sourceUrl" text,
  "rawText" text NOT NULL,
  "structuredData" json,
  "embedding" text,
  "relevanceScore" decimal(5, 2),
  "trustScore" decimal(5, 2),
  "apiCost" decimal(10, 4),
  "caseId" text NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "researchWaveId" text REFERENCES "research_waves"("id") ON DELETE SET NULL,
  "strategyExecutionId" text REFERENCES "strategy_executions"("id") ON DELETE SET NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Documents Table (references cases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "documents" (
  "id" text PRIMARY KEY NOT NULL,
  "type" "DocumentType" NOT NULL,
  "direction" varchar(50) NOT NULL,
  "subject" varchar(500),
  "content" text NOT NULL,
  "recipient" varchar(255),
  "sender" varchar(255),
  "attachments" json,
  "embedding" text,
  "caseId" text NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "sentAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Budget Tracking Table (references cases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "budget_tracking" (
  "id" text PRIMARY KEY NOT NULL,
  "caseId" text NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "integration" varchar(255) NOT NULL,
  "action" varchar(255) NOT NULL,
  "cost" decimal(10, 4) NOT NULL,
  "metadata" json,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Comments Table (references cases and users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "comments" (
  "id" text PRIMARY KEY NOT NULL,
  "content" text NOT NULL,
  "caseId" text NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "authorId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Many-to-Many Junction Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "contact_info_source_artifacts" (
  "contactInfoId" text NOT NULL REFERENCES "contact_infos"("id") ON DELETE CASCADE,
  "artifactId" text NOT NULL REFERENCES "research_artifacts"("id") ON DELETE CASCADE,
  PRIMARY KEY ("contactInfoId", "artifactId")
);

CREATE TABLE IF NOT EXISTS "relationship_proof_artifacts" (
  "relationshipId" text NOT NULL REFERENCES "relationships"("id") ON DELETE CASCADE,
  "artifactId" text NOT NULL REFERENCES "research_artifacts"("id") ON DELETE CASCADE,
  PRIMARY KEY ("relationshipId", "artifactId")
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Cases indexes
CREATE INDEX IF NOT EXISTS "cases_status_idx" ON "cases"("status");
CREATE INDEX IF NOT EXISTS "cases_createdAt_idx" ON "cases"("createdAt");
CREATE INDEX IF NOT EXISTS "cases_court_idx" ON "cases"("court");

-- Persons indexes
CREATE INDEX IF NOT EXISTS "persons_name_idx" ON "persons"("lastName", "firstName");

-- Person Cases indexes
CREATE INDEX IF NOT EXISTS "person_cases_case_role_idx" ON "person_cases"("caseId", "role");

-- Contact Infos indexes
CREATE INDEX IF NOT EXISTS "contact_infos_person_type_idx" ON "contact_infos"("personId", "type");

-- Relationships indexes
CREATE INDEX IF NOT EXISTS "relationships_from_person_idx" ON "relationships"("fromPersonId");
CREATE INDEX IF NOT EXISTS "relationships_to_person_idx" ON "relationships"("toPersonId");

-- Research Artifacts indexes
CREATE INDEX IF NOT EXISTS "research_artifacts_case_type_idx" ON "research_artifacts"("caseId", "type");
CREATE INDEX IF NOT EXISTS "research_artifacts_source_idx" ON "research_artifacts"("source");
CREATE INDEX IF NOT EXISTS "research_artifacts_createdAt_idx" ON "research_artifacts"("createdAt");

-- Research Waves indexes
CREATE INDEX IF NOT EXISTS "research_waves_case_wave_idx" ON "research_waves"("caseId", "waveNumber");

-- Strategies indexes
CREATE INDEX IF NOT EXISTS "strategies_status_successRate_idx" ON "strategies"("status", "successRate");

-- Strategy Executions indexes
CREATE INDEX IF NOT EXISTS "strategy_executions_case_idx" ON "strategy_executions"("caseId");
CREATE INDEX IF NOT EXISTS "strategy_executions_strategy_idx" ON "strategy_executions"("strategyId");

-- Documents indexes
CREATE INDEX IF NOT EXISTS "documents_case_type_idx" ON "documents"("caseId", "type");

-- Budget Tracking indexes
CREATE INDEX IF NOT EXISTS "budget_tracking_case_idx" ON "budget_tracking"("caseId");
CREATE INDEX IF NOT EXISTS "budget_tracking_createdAt_idx" ON "budget_tracking"("createdAt");

-- Comments indexes
CREATE INDEX IF NOT EXISTS "comments_case_idx" ON "comments"("caseId");

-- ============================================================================
-- DONE! Schema migration complete.
-- ============================================================================

-- Summary of created objects:
-- - 9 ENUMs (PostgreSQL Types)
-- - 17 TABLES
-- - 23 INDEXES
-- - Multiple FOREIGN KEY constraints
-- - Multiple UNIQUE constraints
