import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// TODO: Implement person routes
router.get('/', (req, res) => res.json({ persons: [] }));
router.get('/:id', (req, res) => res.json({ person: null }));

export default router;
