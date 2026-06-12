import { Router } from 'express';
import authRoutes from './auth.routes';
import siteRoutes from './site.routes';
import vehicleRoutes from './vehicle.routes';
import sensorRoutes from './sensor.routes';
import alertRoutes from './alert.routes';
import equipmentRoutes from './equipment.routes';
import maintenanceRoutes from './maintenance.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sites', siteRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/sensors', sensorRoutes);
router.use('/alerts', alertRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/users', userRoutes);

export default router;
