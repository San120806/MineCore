import { Router } from 'express';
import * as maintenanceController from '@controllers/maintenance.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { createMaintenanceSchema, updateMaintenanceSchema, completeMaintenanceSchema } from '@validators/maintenance.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', maintenanceController.getAll);
router.get('/:id', maintenanceController.getById);
router.post('/', authorize(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER), validate(createMaintenanceSchema), maintenanceController.create);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER), validate(updateMaintenanceSchema), maintenanceController.update);
router.patch('/:id/complete', authorize(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER), validate(completeMaintenanceSchema), maintenanceController.complete);
router.delete('/:id', authorize(UserRole.ADMIN), maintenanceController.remove);

export default router;
