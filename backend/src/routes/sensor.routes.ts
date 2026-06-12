import { Router } from 'express';
import * as sensorController from '@controllers/sensor.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { createSensorSchema, updateSensorSchema, ingestReadingSchema } from '@validators/sensor.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', sensorController.getAll);
router.get('/:id', sensorController.getById);
router.get('/:id/readings', sensorController.getReadings);
router.post('/:id/readings', validate(ingestReadingSchema), sensorController.ingestReading);
router.post('/', authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER), validate(createSensorSchema), sensorController.create);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER), validate(updateSensorSchema), sensorController.update);
router.delete('/:id', authorize(UserRole.ADMIN), sensorController.remove);

export default router;
