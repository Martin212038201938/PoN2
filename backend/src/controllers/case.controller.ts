import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { CaseStatus, Prisma } from '@prisma/client';

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

      const where: Prisma.CaseWhereInput = {};

      if (status) {
        where.status = status as CaseStatus;
      }

      if (court) {
        where.court = { contains: court as string, mode: 'insensitive' };
      }

      if (search) {
        where.OR = [
          { caseNumber: { contains: search as string, mode: 'insensitive' } },
          { deceasedFirstName: { contains: search as string, mode: 'insensitive' } },
          { deceasedLastName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [cases, total] = await Promise.all([
        prisma.case.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                persons: true,
                artifacts: true,
                researchWaves: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.case.count({ where }),
      ]);

      res.json({
        cases,
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

      const caseData = await prisma.case.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              persons: true,
              artifacts: true,
              researchWaves: true,
              documents: true,
              comments: true,
            },
          },
        },
      });

      if (!caseData) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      res.json({ case: caseData });
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

      const caseData = await prisma.case.create({
        data: {
          ...req.body,
          deceasedBirthDate: req.body.deceasedBirthDate
            ? new Date(req.body.deceasedBirthDate)
            : null,
          deceasedDeathDate: req.body.deceasedDeathDate
            ? new Date(req.body.deceasedDeathDate)
            : null,
          createdById: req.user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Case created: ${caseData.caseNumber} by ${req.user.email}`);

      res.status(201).json({
        message: 'Case created successfully',
        case: caseData,
      });
    } catch (error) {
      logger.error('Create case error:', error);
      res.status(500).json({ error: 'Failed to create case' });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const caseData = await prisma.case.update({
        where: { id },
        data: {
          ...req.body,
          deceasedBirthDate: req.body.deceasedBirthDate
            ? new Date(req.body.deceasedBirthDate)
            : undefined,
          deceasedDeathDate: req.body.deceasedDeathDate
            ? new Date(req.body.deceasedDeathDate)
            : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Case updated: ${caseData.caseNumber}`);

      res.json({
        message: 'Case updated successfully',
        case: caseData,
      });
    } catch (error) {
      logger.error('Update case error:', error);
      res.status(500).json({ error: 'Failed to update case' });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.case.delete({
        where: { id },
      });

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

      const caseData = await prisma.case.update({
        where: { id },
        data: {
          status: CaseStatus.IN_RESEARCH,
        },
      });

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

      const caseData = await prisma.case.update({
        where: { id },
        data: {
          status: successful
            ? CaseStatus.SUCCESSFULLY_SOLVED
            : CaseStatus.CLOSED_WITHOUT_SUCCESS,
          closedAt: new Date(),
        },
      });

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

      const persons = await prisma.personCase.findMany({
        where: { caseId: id },
        include: {
          person: {
            include: {
              contactInfos: true,
              relationshipsFrom: {
                include: {
                  toPerson: true,
                },
              },
              relationshipsTo: {
                include: {
                  fromPerson: true,
                },
              },
            },
          },
        },
        orderBy: {
          heirProbability: 'desc',
        },
      });

      res.json({ persons });
    } catch (error) {
      logger.error('Get persons error:', error);
      res.status(500).json({ error: 'Failed to get persons' });
    }
  }

  async getArtifacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { type, source } = req.query;

      const where: Prisma.ResearchArtifactWhereInput = { caseId: id };

      if (type) {
        where.type = type as any;
      }

      if (source) {
        where.source = { contains: source as string, mode: 'insensitive' };
      }

      const artifacts = await prisma.researchArtifact.findMany({
        where,
        include: {
          researchWave: true,
          strategyExecution: {
            include: {
              strategy: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ artifacts });
    } catch (error) {
      logger.error('Get artifacts error:', error);
      res.status(500).json({ error: 'Failed to get artifacts' });
    }
  }

  async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const documents = await prisma.document.findMany({
        where: { caseId: id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ documents });
    } catch (error) {
      logger.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to get documents' });
    }
  }

  async getResearchWaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const waves = await prisma.researchWave.findMany({
        where: { caseId: id },
        include: {
          strategyExecutions: {
            include: {
              strategy: true,
            },
          },
          _count: {
            select: {
              artifacts: true,
            },
          },
        },
        orderBy: { waveNumber: 'asc' },
      });

      res.json({ waves });
    } catch (error) {
      logger.error('Get research waves error:', error);
      res.status(500).json({ error: 'Failed to get research waves' });
    }
  }
}

export const caseController = new CaseController();
