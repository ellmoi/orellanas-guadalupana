import { body, param, query } from 'express-validator';

const methods = ['CASH_ON_DELIVERY', 'TRANSFER', 'PENDING'];
export const cartItemValidator = [
  body('productId').isString().notEmpty(),
  body('quantity').isInt({ min: 1, max: 999 }).toInt(),
];
export const cartSyncValidator = [
  body('items').isArray({ max: 100 }),
  body('items.*.productId').isString(),
  body('items.*.quantity').isInt({ min: 1, max: 999 }).toInt(),
];
export const checkoutValidator = [
  body('name').trim().isLength({ min: 3, max: 120 }),
  body('phone').trim().isLength({ min: 7, max: 30 }),
  body('email').isEmail().normalizeEmail(),
  body('address').trim().isLength({ min: 5, max: 180 }),
  body('city').trim().isLength({ min: 2, max: 80 }),
  body('neighborhood').trim().isLength({ min: 2, max: 80 }),
  body('reference').optional({ checkFalsy: true }).trim().isLength({ max: 180 }),
  body('deliveryType').isIn(['DELIVERY', 'PICKUP']),
  body('paymentMethod').isIn(methods),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('billing').optional().isObject(),
];
export const orderIdValidator = [param('id').isString().notEmpty()];
export const orderListValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
];
export const orderStatusValidator = [
  ...orderIdValidator,
  body('status').isIn(['PENDING', 'CONFIRMED', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  body('comment').optional().trim().isLength({ max: 300 }),
];
export const manualPaymentValidator = [
  ...orderIdValidator,
  body('method').isIn(['CASH_ON_DELIVERY', 'TRANSFER', 'PENDING']),
  body('reference').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
];
export const internalNoteValidator = [...orderIdValidator, body('note').trim().isLength({ min: 1, max: 1000 })];
