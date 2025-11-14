// User types
export enum UserRole {
  DETECTIVE = 'DETECTIVE',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Case types
export enum CaseStatus {
  NEW = 'NEW',
  IN_RESEARCH = 'IN_RESEARCH',
  WAITING_FOR_RESPONSE = 'WAITING_FOR_RESPONSE',
  HEIRS_IDENTIFIED = 'HEIRS_IDENTIFIED',
  SUCCESSFULLY_SOLVED = 'SUCCESSFULLY_SOLVED',
  CLOSED_WITHOUT_SUCCESS = 'CLOSED_WITHOUT_SUCCESS',
  ON_HOLD = 'ON_HOLD',
}

export interface Case {
  id: string;
  caseNumber: string;
  deceasedFirstName: string;
  deceasedLastName: string;
  deceasedBirthDate?: string;
  deceasedDeathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  status: CaseStatus;
  court?: string;
  estateValue?: number;
  threshold?: number;
  sourceType?: string;
  sourceReference?: string;
  originalText?: string;
  budgetEur: number;
  maxApiCallsPerSource: number;
  currentSpentEur: number;
  successProbability?: number;
  researchWaveCount: number;
  notes?: string;
  resultSummary?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  createdBy?: User;
  assignedTo?: User;
  _count?: {
    persons: number;
    artifacts: number;
    researchWaves: number;
    documents: number;
    comments: number;
  };
}

// Person types
export enum PersonRole {
  DECEASED = 'DECEASED',
  POTENTIAL_HEIR = 'POTENTIAL_HEIR',
  RELATIVE = 'RELATIVE',
  CONTACT_PERSON = 'CONTACT_PERSON',
  OTHER = 'OTHER',
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  gender?: string;
  notes?: string;
  contactInfos?: ContactInfo[];
}

export interface PersonCase {
  id: string;
  person: Person;
  role: PersonRole;
  heirProbability?: number;
  reasoning?: string;
}

// Contact types
export enum ContactType {
  ADDRESS = 'ADDRESS',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  WEBSITE = 'WEBSITE',
  OTHER = 'OTHER',
}

export interface ContactInfo {
  id: string;
  type: ContactType;
  value: string;
  label?: string;
  isVerified: boolean;
  trustScore?: number;
}

// Research types
export enum ArtifactType {
  GENEALOGY_SEARCH = 'GENEALOGY_SEARCH',
  SOCIAL_MEDIA_PROFILE = 'SOCIAL_MEDIA_PROFILE',
  PUBLIC_RECORD = 'PUBLIC_RECORD',
  COURT_DOCUMENT = 'COURT_DOCUMENT',
  PERPLEXITY_RESEARCH = 'PERPLEXITY_RESEARCH',
  WEB_SEARCH = 'WEB_SEARCH',
  MANUAL_NOTE = 'MANUAL_NOTE',
  OTHER = 'OTHER',
}

export interface ResearchArtifact {
  id: string;
  type: ArtifactType;
  source: string;
  sourceUrl?: string;
  rawText: string;
  structuredData?: any;
  relevanceScore?: number;
  trustScore?: number;
  apiCost?: number;
  createdAt: string;
}

export enum WaveStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ResearchWave {
  id: string;
  waveNumber: number;
  status: WaveStatus;
  maxBudgetEur: number;
  actualCostEur: number;
  artifactsFound: number;
  personsFound: number;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  solvedCases: number;
  totalArtifacts: number;
  totalPersons: number;
  successRate: number;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: any;
}
