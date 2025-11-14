import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();
router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const [
      totalCases,
      activeCases,
      solvedCases,
      totalArtifacts,
      totalPersons,
    ] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { status: 'IN_RESEARCH' } }),
      prisma.case.count({ where: { status: 'SUCCESSFULLY_SOLVED' } }),
      prisma.researchArtifact.count(),
      prisma.person.count(),
    ]);

    res.json({
      stats: {
        totalCases,
        activeCases,
        solvedCases,
        totalArtifacts,
        totalPersons,
        successRate: totalCases > 0 ? (solvedCases / totalCases) * 100 : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
