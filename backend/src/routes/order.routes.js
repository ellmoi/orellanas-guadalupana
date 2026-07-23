import { Router } from 'express';
import * as controller from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  cartItemValidator,
  cartSyncValidator,
  checkoutValidator,
  internalNoteValidator,
  manualPaymentValidator,
  orderIdValidator,
  orderListValidator,
  orderStatusValidator,
} from '../validators/order.validators.js';

export const cartRouter = Router();
cartRouter.use(authenticate);
cartRouter.get('/', asyncHandler(controller.cart));
cartRouter.put('/items', cartItemValidator, validateRequest, asyncHandler(controller.setItem));
cartRouter.post('/sync', cartSyncValidator, validateRequest, asyncHandler(controller.sync));
cartRouter.delete('/items/:productId', asyncHandler(controller.removeItem));
cartRouter.delete('/', asyncHandler(controller.clear));
export const orderRouter = Router();
orderRouter.use(authenticate);
orderRouter.post('/checkout', checkoutValidator, validateRequest, asyncHandler(controller.checkout));
orderRouter.get('/', orderListValidator, validateRequest, asyncHandler(controller.listOwn));
orderRouter.get('/:id', orderIdValidator, validateRequest, asyncHandler(controller.detail));
orderRouter.post('/:id/cancel', orderIdValidator, validateRequest, asyncHandler(controller.cancel));
orderRouter.post('/:id/repeat', orderIdValidator, validateRequest, asyncHandler(controller.repeat));
orderRouter.get('/:id/receipt.pdf', orderIdValidator, validateRequest, asyncHandler(controller.receipt));
export const adminOrderRouter = Router();
adminOrderRouter.use(authenticate, requireRole('ADMIN', 'ORDER_MANAGER'));
adminOrderRouter.get('/', orderListValidator, validateRequest, asyncHandler(controller.adminList));
adminOrderRouter.patch('/:id/status', orderStatusValidator, validateRequest, asyncHandler(controller.adminStatus));
adminOrderRouter.get('/:id/receipt.pdf', orderIdValidator, validateRequest, asyncHandler(controller.adminReceipt));
adminOrderRouter.post('/:id/payment', manualPaymentValidator, validateRequest, asyncHandler(controller.adminPayment));
adminOrderRouter.patch('/:id/note', internalNoteValidator, validateRequest, asyncHandler(controller.adminNote));
