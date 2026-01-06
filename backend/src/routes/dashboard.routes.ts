import { Router } from 'express';
import { eq, count } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.middleware';
import { db, cases, researchArtifacts, persons } from '../db';

const router = Router();
router.use(authenticate);

router.get('/stats', async (_req, res) => {
  try {
    const [totalCasesResult] = await db.select({ count: count() }).from(cases);
    const [activeCasesResult] = await db.select({ count: count() }).from(cases).where(eq(cases.status, 'IN_RESEARCH'));
    const [solvedCasesResult] = await db.select({ count: count() }).from(cases).where(eq(cases.status, 'SUCCESSFULLY_SOLVED'));
    const [totalArtifactsResult] = await db.select({ count: count() }).from(researchArtifacts);
    const [totalPersonsResult] = await db.select({ count: count() }).from(persons);

    const totalCases = Number(totalCasesResult.count);
    const activeCases = Number(activeCasesResult.count);
    const solvedCases = Number(solvedCasesResult.count);
    const totalArtifacts = Number(totalArtifactsResult.count);
    const totalPersons = Number(totalPersonsResult.count);

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
