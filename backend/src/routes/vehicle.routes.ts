import { Router } from 'express';
import * as vehicleController from '@controllers/vehicle.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { createVehicleSchema, updateVehicleSchema, updateVehicleStatusSchema } from '@validators/vehicle.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);
router.post('/', authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER), validate(createVehicleSchema), vehicleController.create);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER), validate(updateVehicleSchema), vehicleController.update);
router.patch('/:id/status', authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER), validate(updateVehicleStatusSchema), vehicleController.updateStatus);
router.delete('/:id', authorize(UserRole.ADMIN), vehicleController.remove);

export default router;
