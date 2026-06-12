import { Router } from 'express';
import * as siteController from '@controllers/site.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { createSiteSchema, updateSiteSchema } from '@validators/site.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', siteController.getAll);
router.get('/:id', siteController.getById);
router.post('/', authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER), validate(createSiteSchema), siteController.create);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER), validate(updateSiteSchema), siteController.update);
router.delete('/:id', authorize(UserRole.ADMIN), siteController.remove);

export default router;
