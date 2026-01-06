import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// TODO: Implement strategy routes
router.get('/', (_req, res) => res.json({ strategies: [] }));
router.post('/', (_req, res) => res.json({ message: 'Not implemented' }));

export default router;
