import { Router } from 'express';
import { caseController } from '../controllers/case.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createCaseSchema, updateCaseSchema } from '../types/case.schemas';

const router = Router();

// All case routes require authentication
router.use(authenticate);

router.get('/', caseController.list);
router.get('/:id', caseController.getById);
router.post('/', validate(createCaseSchema), caseController.create);
router.put('/:id', validate(updateCaseSchema), caseController.update);
router.delete('/:id', caseController.delete);

// Status transitions
router.post('/:id/start-research', caseController.startResearch);
router.post('/:id/close', caseController.close);

// Case-specific data
router.get('/:id/persons', caseController.getPersons);
router.get('/:id/artifacts', caseController.getArtifacts);
router.get('/:id/documents', caseController.getDocuments);
router.get('/:id/research-waves', caseController.getResearchWaves);

export default router;
