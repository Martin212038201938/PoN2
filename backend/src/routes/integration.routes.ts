import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// TODO: Implement integration routes (admin only)
router.get('/', requireAdmin, (req, res) => res.json({ integrations: [] }));
router.put('/:id', requireAdmin, (req, res) => res.json({ message: 'Not implemented' }));

export default router;
