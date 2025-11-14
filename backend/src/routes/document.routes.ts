import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// TODO: Implement document routes
router.get('/', (req, res) => res.json({ documents: [] }));
router.post('/', (req, res) => res.json({ message: 'Not implemented' }));

export default router;
