import { Router } from 'express';
import * as userController from '@controllers/user.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { updateUserSchema, updateUserStatusSchema, changePasswordSchema } from '@validators/user.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN), userController.getAll);
router.get('/:id', authorize(UserRole.ADMIN), userController.getById);
router.put('/:id', authorize(UserRole.ADMIN), validate(updateUserSchema), userController.update);
router.patch('/:id/status', authorize(UserRole.ADMIN), validate(updateUserStatusSchema), userController.updateStatus);
router.patch('/:id/password', validate(changePasswordSchema), userController.changePassword);
router.delete('/:id', authorize(UserRole.ADMIN), userController.remove);

export default router;
