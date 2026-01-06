import { Response } from 'express';
import { eq, and, or, ilike, desc, count, sql } from 'drizzle-orm';
import {
  db,
  cases,
  users,
  personCases,
  researchArtifacts,
  researchWaves,
  documents,
  comments,
  persons,
  relationships,
  contactInfos,
  strategyExecutions,
  strategies,
  generateId,
} from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class CaseController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        court,
        search,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const whereConditions = [];

      if (status) {
        whereConditions.push(eq(cases.status, status as any));
      }

      if (court) {
        whereConditions.push(ilike(cases.court, `%${court}%`));
      }

      if (search) {
        whereConditions.push(
          or(
            ilike(cases.caseNumber, `%${search}%`),
            ilike(cases.deceasedFirstName, `%${search}%`),
            ilike(cases.deceasedLastName, `%${search}%`)
          )
        );
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get cases with user information
      const casesList = await db
        .select({
          id: cases.id,
          caseNumber: cases.caseNumber,
          deceasedFirstName: cases.deceasedFirstName,
          deceasedLastName: cases.deceasedLastName,
          deceasedBirthDate: cases.deceasedBirthDate,
          deceasedDeathDate: cases.deceasedDeathDate,
          birthPlace: cases.birthPlace,
          deathPlace: cases.deathPlace,
          status: cases.status,
          court: cases.court,
          estateValue: cases.estateValue,
          threshold: cases.threshold,
          sourceType: cases.sourceType,
          sourceReference: cases.sourceReference,
          originalText: cases.originalText,
          budgetEur: cases.budgetEur,
          maxApiCallsPerSource: cases.maxApiCallsPerSource,
          currentSpentEur: cases.currentSpentEur,
          successProbability: cases.successProbability,
          researchWaveCount: cases.researchWaveCount,
          notes: cases.notes,
          resultSummary: cases.resultSummary,
          createdAt: cases.createdAt,
          updatedAt: cases.updatedAt,
          closedAt: cases.closedAt,
          createdById: cases.createdById,
          assignedToId: cases.assignedToId,
          createdBy: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(cases)
        .leftJoin(users, eq(cases.createdById, users.id))
        .where(whereClause)
        .orderBy(desc(cases.createdAt))
        .limit(limitNum)
        .offset(skip);

      // Get assignedTo users separately for cases that have them
      const caseIds = casesList.map(c => c.id);
      const assignedUsers = await db
        .select({
          caseId: cases.id,
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(cases)
        .innerJoin(users, eq(cases.assignedToId, users.id))
        .where(sql`${cases.id} IN ${caseIds}`);

      const assignedUsersMap = new Map(assignedUsers.map(u => [u.caseId, u]));

      // Get counts for each case
      const personCounts = await db
        .select({ caseId: personCases.caseId, count: count() })
        .from(personCases)
        .where(sql`${personCases.caseId} IN ${caseIds}`)
        .groupBy(personCases.caseId);

      const artifactCounts = await db
        .select({ caseId: researchArtifacts.caseId, count: count() })
        .from(researchArtifacts)
        .where(sql`${researchArtifacts.caseId} IN ${caseIds}`)
        .groupBy(researchArtifacts.caseId);

      const waveCounts = await db
        .select({ caseId: researchWaves.caseId, count: count() })
        .from(researchWaves)
        .where(sql`${researchWaves.caseId} IN ${caseIds}`)
        .groupBy(researchWaves.caseId);

      const personCountMap = new Map(personCounts.map(p => [p.caseId, Number(p.count)]));
      const artifactCountMap = new Map(artifactCounts.map(a => [a.caseId, Number(a.count)]));
      const waveCountMap = new Map(waveCounts.map(w => [w.caseId, Number(w.count)]));

      // Combine results
      const casesWithDetails = casesList.map(c => ({
        ...c,
        assignedTo: c.assignedToId ? assignedUsersMap.get(c.id) : null,
        _count: {
          persons: personCountMap.get(c.id) || 0,
          artifacts: artifactCountMap.get(c.id) || 0,
          researchWaves: waveCountMap.get(c.id) || 0,
        },
      }));

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(cases)
        .where(whereClause);
      const total = Number(totalResult.count);

      res.json({
        cases: casesWithDetails,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('List cases error:', error);
      res.status(500).json({ error: 'Failed to list cases' });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const [caseData] = await db
        .select({
          id: cases.id,
          caseNumber: cases.caseNumber,
          deceasedFirstName: cases.deceasedFirstName,
          deceasedLastName: cases.deceasedLastName,
          deceasedBirthDate: cases.deceasedBirthDate,
          deceasedDeathDate: cases.deceasedDeathDate,
          birthPlace: cases.birthPlace,
          deathPlace: cases.deathPlace,
          status: cases.status,
          court: cases.court,
          estateValue: cases.estateValue,
          threshold: cases.threshold,
          sourceType: cases.sourceType,
          sourceReference: cases.sourceReference,
          originalText: cases.originalText,
          budgetEur: cases.budgetEur,
          maxApiCallsPerSource: cases.maxApiCallsPerSource,
          currentSpentEur: cases.currentSpentEur,
          successProbability: cases.successProbability,
          researchWaveCount: cases.researchWaveCount,
          notes: cases.notes,
          resultSummary: cases.resultSummary,
          createdAt: cases.createdAt,
          updatedAt: cases.updatedAt,
          closedAt: cases.closedAt,
          createdById: cases.createdById,
          assignedToId: cases.assignedToId,
          createdBy: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(cases)
        .leftJoin(users, eq(cases.createdById, users.id))
        .where(eq(cases.id, id));

      if (!caseData) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      // Get assignedTo user if exists
      let assignedTo = null;
      if (caseData.assignedToId) {
        const [assignedUser] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, caseData.assignedToId));
        assignedTo = assignedUser;
      }

      // Get counts
      const [personCount] = await db
        .select({ count: count() })
        .from(personCases)
        .where(eq(personCases.caseId, id));

      const [artifactCount] = await db
        .select({ count: count() })
        .from(researchArtifacts)
        .where(eq(researchArtifacts.caseId, id));

      const [waveCount] = await db
        .select({ count: count() })
        .from(researchWaves)
        .where(eq(researchWaves.caseId, id));

      const [documentCount] = await db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.caseId, id));

      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.caseId, id));

      res.json({
        case: {
          ...caseData,
          assignedTo,
          _count: {
            persons: Number(personCount.count),
            artifacts: Number(artifactCount.count),
            researchWaves: Number(waveCount.count),
            documents: Number(documentCount.count),
            comments: Number(commentCount.count),
          },
        },
      });
    } catch (error) {
      logger.error('Get case error:', error);
      res.status(500).json({ error: 'Failed to get case' });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const [caseData] = await db.insert(cases).values({
        id: generateId(),
        ...req.body,
        deceasedBirthDate: req.body.deceasedBirthDate
          ? new Date(req.body.deceasedBirthDate)
          : null,
        deceasedDeathDate: req.body.deceasedDeathDate
          ? new Date(req.body.deceasedDeathDate)
          : null,
        createdById: req.user.id,
      }).returning();

      const [createdBy] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, req.user.id));

      logger.info(`Case created: ${caseData.caseNumber} by ${req.user.email}`);

      res.status(201).json({
        message: 'Case created successfully',
        case: {
          ...caseData,
          createdBy,
        },
      });
    } catch (error) {
      logger.error('Create case error:', error);
      res.status(500).json({ error: 'Failed to create case' });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const updateData: any = { ...req.body };
      if (req.body.deceasedBirthDate) {
        updateData.deceasedBirthDate = new Date(req.body.deceasedBirthDate);
      }
      if (req.body.deceasedDeathDate) {
        updateData.deceasedDeathDate = new Date(req.body.deceasedDeathDate);
      }

      const [caseData] = await db
        .update(cases)
        .set(updateData)
        .where(eq(cases.id, id))
        .returning();

      const [createdBy] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, caseData.createdById));

      let assignedTo = null;
      if (caseData.assignedToId) {
        const [assignedUser] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, caseData.assignedToId));
        assignedTo = assignedUser;
      }

      logger.info(`Case updated: ${caseData.caseNumber}`);

      res.json({
        message: 'Case updated successfully',
        case: {
          ...caseData,
          createdBy,
          assignedTo,
        },
      });
    } catch (error) {
      logger.error('Update case error:', error);
      res.status(500).json({ error: 'Failed to update case' });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await db.delete(cases).where(eq(cases.id, id));

      logger.info(`Case deleted: ${id}`);

      res.json({ message: 'Case deleted successfully' });
    } catch (error) {
      logger.error('Delete case error:', error);
      res.status(500).json({ error: 'Failed to delete case' });
    }
  }

  async startResearch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const [caseData] = await db
        .update(cases)
        .set({
          status: 'IN_RESEARCH',
        })
        .where(eq(cases.id, id))
        .returning();

      // TODO: Trigger first research wave via job queue

      logger.info(`Research started for case: ${caseData.caseNumber}`);

      res.json({
        message: 'Research started',
        case: caseData,
      });
    } catch (error) {
      logger.error('Start research error:', error);
      res.status(500).json({ error: 'Failed to start research' });
    }
  }

  async close(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { successful } = req.body;

      const [caseData] = await db
        .update(cases)
        .set({
          status: successful
            ? 'SUCCESSFULLY_SOLVED'
            : 'CLOSED_WITHOUT_SUCCESS',
          closedAt: new Date(),
        })
        .where(eq(cases.id, id))
        .returning();

      logger.info(`Case closed: ${caseData.caseNumber}`);

      res.json({
        message: 'Case closed',
        case: caseData,
      });
    } catch (error) {
      logger.error('Close case error:', error);
      res.status(500).json({ error: 'Failed to close case' });
    }
  }

  async getPersons(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const personsList = await db
        .select({
          id: personCases.id,
          personId: personCases.personId,
          caseId: personCases.caseId,
          role: personCases.role,
          heirProbability: personCases.heirProbability,
          reasoning: personCases.reasoning,
          createdAt: personCases.createdAt,
          updatedAt: personCases.updatedAt,
          person: {
            id: persons.id,
            firstName: persons.firstName,
            lastName: persons.lastName,
            birthDate: persons.birthDate,
            deathDate: persons.deathDate,
            birthPlace: persons.birthPlace,
            deathPlace: persons.deathPlace,
            gender: persons.gender,
            notes: persons.notes,
            createdAt: persons.createdAt,
            updatedAt: persons.updatedAt,
          },
        })
        .from(personCases)
        .innerJoin(persons, eq(personCases.personId, persons.id))
        .where(eq(personCases.caseId, id))
        .orderBy(desc(personCases.heirProbability));

      // Get contact infos for all persons
      const personIds = personsList.map(p => p.personId);
      const contactInfosList = personIds.length > 0 ? await db
        .select()
        .from(contactInfos)
        .where(sql`${contactInfos.personId} IN ${personIds}`) : [];

      // Get relationships for all persons
      const relationshipsFromList = personIds.length > 0 ? await db
        .select({
          id: relationships.id,
          type: relationships.type,
          description: relationships.description,
          fromPersonId: relationships.fromPersonId,
          toPersonId: relationships.toPersonId,
          trustScore: relationships.trustScore,
          createdAt: relationships.createdAt,
          updatedAt: relationships.updatedAt,
          toPerson: {
            id: persons.id,
            firstName: persons.firstName,
            lastName: persons.lastName,
            birthDate: persons.birthDate,
            deathDate: persons.deathDate,
            birthPlace: persons.birthPlace,
            deathPlace: persons.deathPlace,
            gender: persons.gender,
            notes: persons.notes,
            createdAt: persons.createdAt,
            updatedAt: persons.updatedAt,
          },
        })
        .from(relationships)
        .innerJoin(persons, eq(relationships.toPersonId, persons.id))
        .where(sql`${relationships.fromPersonId} IN ${personIds}`) : [];

      const relationshipsToList = personIds.length > 0 ? await db
        .select({
          id: relationships.id,
          type: relationships.type,
          description: relationships.description,
          fromPersonId: relationships.fromPersonId,
          toPersonId: relationships.toPersonId,
          trustScore: relationships.trustScore,
          createdAt: relationships.createdAt,
          updatedAt: relationships.updatedAt,
          fromPerson: {
            id: persons.id,
            firstName: persons.firstName,
            lastName: persons.lastName,
            birthDate: persons.birthDate,
            deathDate: persons.deathDate,
            birthPlace: persons.birthPlace,
            deathPlace: persons.deathPlace,
            gender: persons.gender,
            notes: persons.notes,
            createdAt: persons.createdAt,
            updatedAt: persons.updatedAt,
          },
        })
        .from(relationships)
        .innerJoin(persons, eq(relationships.fromPersonId, persons.id))
        .where(sql`${relationships.toPersonId} IN ${personIds}`) : [];

      // Group by person
      const contactInfosMap = new Map<string, any[]>();
      contactInfosList.forEach(ci => {
        if (!contactInfosMap.has(ci.personId)) {
          contactInfosMap.set(ci.personId, []);
        }
        contactInfosMap.get(ci.personId)!.push(ci);
      });

      const relationshipsFromMap = new Map<string, any[]>();
      relationshipsFromList.forEach(r => {
        if (!relationshipsFromMap.has(r.fromPersonId)) {
          relationshipsFromMap.set(r.fromPersonId, []);
        }
        relationshipsFromMap.get(r.fromPersonId)!.push(r);
      });

      const relationshipsToMap = new Map<string, any[]>();
      relationshipsToList.forEach(r => {
        if (!relationshipsToMap.has(r.toPersonId)) {
          relationshipsToMap.set(r.toPersonId, []);
        }
        relationshipsToMap.get(r.toPersonId)!.push(r);
      });

      const personsWithDetails = personsList.map(p => ({
        ...p,
        person: {
          ...p.person,
          contactInfos: contactInfosMap.get(p.personId) || [],
          relationshipsFrom: relationshipsFromMap.get(p.personId) || [],
          relationshipsTo: relationshipsToMap.get(p.personId) || [],
        },
      }));

      res.json({ persons: personsWithDetails });
    } catch (error) {
      logger.error('Get persons error:', error);
      res.status(500).json({ error: 'Failed to get persons' });
    }
  }

  async getArtifacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { type, source } = req.query;

      const whereConditions = [eq(researchArtifacts.caseId, id)];

      if (type) {
        whereConditions.push(eq(researchArtifacts.type, type as any));
      }

      if (source) {
        whereConditions.push(ilike(researchArtifacts.source, `%${source}%`));
      }

      const artifactsList = await db
        .select({
          id: researchArtifacts.id,
          type: researchArtifacts.type,
          source: researchArtifacts.source,
          sourceUrl: researchArtifacts.sourceUrl,
          rawText: researchArtifacts.rawText,
          structuredData: researchArtifacts.structuredData,
          embedding: researchArtifacts.embedding,
          relevanceScore: researchArtifacts.relevanceScore,
          trustScore: researchArtifacts.trustScore,
          apiCost: researchArtifacts.apiCost,
          caseId: researchArtifacts.caseId,
          researchWaveId: researchArtifacts.researchWaveId,
          strategyExecutionId: researchArtifacts.strategyExecutionId,
          createdAt: researchArtifacts.createdAt,
          updatedAt: researchArtifacts.updatedAt,
          researchWave: researchWaves,
        })
        .from(researchArtifacts)
        .leftJoin(researchWaves, eq(researchArtifacts.researchWaveId, researchWaves.id))
        .where(and(...whereConditions))
        .orderBy(desc(researchArtifacts.createdAt));

      // Get strategy executions with strategies
      const artifactIds = artifactsList.map(a => a.id);
      const strategyExecutionsList = artifactIds.length > 0 ? await db
        .select({
          id: strategyExecutions.id,
          strategyId: strategyExecutions.strategyId,
          caseId: strategyExecutions.caseId,
          researchWaveId: strategyExecutions.researchWaveId,
          status: strategyExecutions.status,
          executedQuery: strategyExecutions.executedQuery,
          artifactsCreated: strategyExecutions.artifactsCreated,
          costEur: strategyExecutions.costEur,
          wasSuccessful: strategyExecutions.wasSuccessful,
          errorMessage: strategyExecutions.errorMessage,
          startedAt: strategyExecutions.startedAt,
          completedAt: strategyExecutions.completedAt,
          createdAt: strategyExecutions.createdAt,
          updatedAt: strategyExecutions.updatedAt,
          strategy: strategies,
        })
        .from(strategyExecutions)
        .innerJoin(strategies, eq(strategyExecutions.strategyId, strategies.id))
        .where(sql`${strategyExecutions.id} IN ${artifactIds}`) : [];

      const strategyExecutionsMap = new Map(strategyExecutionsList.map(se => [se.id, se]));

      const artifactsWithDetails = artifactsList.map(a => ({
        ...a,
        strategyExecution: a.strategyExecutionId ? strategyExecutionsMap.get(a.strategyExecutionId) : null,
      }));

      res.json({ artifacts: artifactsWithDetails });
    } catch (error) {
      logger.error('Get artifacts error:', error);
      res.status(500).json({ error: 'Failed to get artifacts' });
    }
  }

  async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const documentsList = await db
        .select()
        .from(documents)
        .where(eq(documents.caseId, id))
        .orderBy(desc(documents.createdAt));

      res.json({ documents: documentsList });
    } catch (error) {
      logger.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to get documents' });
    }
  }

  async getResearchWaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const wavesList = await db
        .select()
        .from(researchWaves)
        .where(eq(researchWaves.caseId, id))
        .orderBy(researchWaves.waveNumber);

      // Get strategy executions with strategies for each wave
      const waveIds = wavesList.map(w => w.id);
      const strategyExecutionsList = waveIds.length > 0 ? await db
        .select({
          id: strategyExecutions.id,
          strategyId: strategyExecutions.strategyId,
          caseId: strategyExecutions.caseId,
          researchWaveId: strategyExecutions.researchWaveId,
          status: strategyExecutions.status,
          executedQuery: strategyExecutions.executedQuery,
          artifactsCreated: strategyExecutions.artifactsCreated,
          costEur: strategyExecutions.costEur,
          wasSuccessful: strategyExecutions.wasSuccessful,
          errorMessage: strategyExecutions.errorMessage,
          startedAt: strategyExecutions.startedAt,
          completedAt: strategyExecutions.completedAt,
          createdAt: strategyExecutions.createdAt,
          updatedAt: strategyExecutions.updatedAt,
          strategy: strategies,
        })
        .from(strategyExecutions)
        .innerJoin(strategies, eq(strategyExecutions.strategyId, strategies.id))
        .where(sql`${strategyExecutions.researchWaveId} IN ${waveIds}`) : [];

      // Get artifact counts for each wave
      const artifactCounts = waveIds.length > 0 ? await db
        .select({ researchWaveId: researchArtifacts.researchWaveId, count: count() })
        .from(researchArtifacts)
        .where(sql`${researchArtifacts.researchWaveId} IN ${waveIds}`)
        .groupBy(researchArtifacts.researchWaveId) : [];

      const strategyExecutionsMap = new Map<string, any[]>();
      strategyExecutionsList.forEach(se => {
        if (se.researchWaveId) {
          if (!strategyExecutionsMap.has(se.researchWaveId)) {
            strategyExecutionsMap.set(se.researchWaveId, []);
          }
          strategyExecutionsMap.get(se.researchWaveId)!.push(se);
        }
      });

      const artifactCountMap = new Map(artifactCounts.map(ac => [ac.researchWaveId, Number(ac.count)]));

      const wavesWithDetails = wavesList.map(w => ({
        ...w,
        strategyExecutions: strategyExecutionsMap.get(w.id) || [],
        _count: {
          artifacts: artifactCountMap.get(w.id) || 0,
        },
      }));

      res.json({ waves: wavesWithDetails });
    } catch (error) {
      logger.error('Get research waves error:', error);
      res.status(500).json({ error: 'Failed to get research waves' });
    }
  }
}

export const caseController = new CaseController();
