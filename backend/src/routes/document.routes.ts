import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { documentController } from '../controllers/document.controller';

const router = Router();
router.use(authenticate);

// Get all documents (global list - limited use)
router.get('/', (_req, res) => res.json({ documents: [] }));

// Get documents for a specific case
router.get('/case/:caseId', documentController.listByCaseId);

// Upload document to a case
router.post('/case/:caseId/upload', upload.single('file'), documentController.upload);

// Get single document
router.get('/:id', documentController.getById);

// Download document file
router.get('/:id/download', documentController.download);

// Delete document
router.delete('/:id', documentController.delete);

export default router;
