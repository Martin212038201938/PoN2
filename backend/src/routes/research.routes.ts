import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// TODO: Implement research routes
router.post('/start-wave', (req, res) => res.json({ message: 'Not implemented' }));
router.get('/artifacts/:id', (req, res) => res.json({ artifact: null }));

export default router;
