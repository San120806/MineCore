import { Router } from 'express';
import * as alertController from '@controllers/alert.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { createAlertSchema } from '@validators/alert.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', alertController.getAll);
router.get('/:id', alertController.getById);
router.post('/', authorize(UserRole.ADMIN, UserRole.SAFETY_OFFICER, UserRole.OPERATIONS_MANAGER), validate(createAlertSchema), alertController.create);
router.patch('/:id/acknowledge', alertController.acknowledge);
router.patch('/:id/resolve', authorize(UserRole.ADMIN, UserRole.SAFETY_OFFICER), alertController.resolve);
router.delete('/:id', authorize(UserRole.ADMIN), alertController.remove);

export default router;
