import { Router } from 'express';
import * as equipmentController from '@controllers/equipment.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { createEquipmentSchema, updateEquipmentSchema, updateHealthScoreSchema } from '@validators/equipment.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', equipmentController.getAll);
router.get('/:id', equipmentController.getById);
router.post('/', authorize(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER), validate(createEquipmentSchema), equipmentController.create);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER), validate(updateEquipmentSchema), equipmentController.update);
router.patch('/:id/health', authorize(UserRole.ADMIN, UserRole.MAINTENANCE_ENGINEER), validate(updateHealthScoreSchema), equipmentController.updateHealth);
router.delete('/:id', authorize(UserRole.ADMIN), equipmentController.remove);

export default router;
