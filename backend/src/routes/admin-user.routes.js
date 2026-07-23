import { Router } from 'express';
import * as controller from '../controllers/admin-user.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import { adminListValidator, idValidator, roleValidator } from '../validators/user.validators.js';

export const adminUserRouter = Router();
adminUserRouter.use(authenticate, requireRole('ADMIN'));
adminUserRouter.get('/', adminListValidator, validateRequest, asyncHandler(controller.listUsers));
adminUserRouter.get('/:id', idValidator, validateRequest, asyncHandler(controller.getUser));
adminUserRouter.patch('/:id/activate', idValidator, validateRequest, asyncHandler(controller.activateUser));
adminUserRouter.patch('/:id/deactivate', idValidator, validateRequest, asyncHandler(controller.deactivateUser));
adminUserRouter.patch('/:id/verify', idValidator, validateRequest, asyncHandler(controller.verifyUser));
adminUserRouter.patch('/:id/role', idValidator, roleValidator, validateRequest, asyncHandler(controller.changeRole));
adminUserRouter.get('/:id/history', idValidator, validateRequest, asyncHandler(controller.getHistory));
