import { Router } from 'express';
import * as controller from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import { addressValidator, idValidator, updateProfileValidator } from '../validators/user.validators.js';
import { favoriteValidator, supportValidator, wholesaleValidator } from '../validators/user-panel.validators.js';

export const userRouter = Router();
userRouter.use(authenticate);
userRouter.patch('/profile', updateProfileValidator, validateRequest, asyncHandler(controller.updateProfile));
userRouter.get('/addresses', asyncHandler(controller.listAddresses));
userRouter.post('/addresses', addressValidator, validateRequest, asyncHandler(controller.addAddress));
userRouter.put(
  '/addresses/:id',
  idValidator,
  addressValidator,
  validateRequest,
  asyncHandler(controller.updateAddress),
);
userRouter.delete('/addresses/:id', idValidator, validateRequest, asyncHandler(controller.deleteAddress));
userRouter.get('/orders', asyncHandler(controller.listOrders));
userRouter.get('/favorites', asyncHandler(controller.listFavorites));
userRouter.get('/dashboard', asyncHandler(controller.dashboard));
userRouter.put('/favorites/:type/:id', favoriteValidator, validateRequest, asyncHandler(controller.addFavorite));
userRouter.delete('/favorites/:type/:id', favoriteValidator, validateRequest, asyncHandler(controller.removeFavorite));
userRouter.get('/wholesale-requests', asyncHandler(controller.listWholesale));
userRouter.post('/wholesale-requests', wholesaleValidator, validateRequest, asyncHandler(controller.createWholesale));
userRouter.post('/support', supportValidator, validateRequest, asyncHandler(controller.createSupport));
