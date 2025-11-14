import { z } from 'zod';
import { CaseStatus } from '@prisma/client';

export const createCaseSchema = z.object({
  body: z.object({
    caseNumber: z.string().min(1, 'Case number is required'),
    deceasedFirstName: z.string().min(1, 'First name is required'),
    deceasedLastName: z.string().min(1, 'Last name is required'),
    deceasedBirthDate: z.string().datetime().optional(),
    deceasedDeathDate: z.string().datetime().optional(),
    birthPlace: z.string().optional(),
    deathPlace: z.string().optional(),
    court: z.string().optional(),
    estateValue: z.number().optional(),
    threshold: z.number().optional(),
    sourceType: z.string().optional(),
    sourceReference: z.string().optional(),
    originalText: z.string().optional(),
    budgetEur: z.number().optional(),
    maxApiCallsPerSource: z.number().optional(),
    notes: z.string().optional(),
  }),
});

export const updateCaseSchema = z.object({
  body: z.object({
    deceasedFirstName: z.string().optional(),
    deceasedLastName: z.string().optional(),
    deceasedBirthDate: z.string().datetime().optional(),
    deceasedDeathDate: z.string().datetime().optional(),
    birthPlace: z.string().optional(),
    deathPlace: z.string().optional(),
    court: z.string().optional(),
    estateValue: z.number().optional(),
    threshold: z.number().optional(),
    status: z.nativeEnum(CaseStatus).optional(),
    sourceType: z.string().optional(),
    sourceReference: z.string().optional(),
    originalText: z.string().optional(),
    budgetEur: z.number().optional(),
    maxApiCallsPerSource: z.number().optional(),
    notes: z.string().optional(),
    resultSummary: z.string().optional(),
    assignedToId: z.string().optional(),
  }),
});
