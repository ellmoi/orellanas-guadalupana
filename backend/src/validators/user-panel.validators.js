import { body, param } from 'express-validator';
export const favoriteValidator = [param('type').isIn(['products', 'recipes']), param('id').isString().notEmpty()];
export const wholesaleValidator = [
  body('businessName').trim().isLength({ min: 2, max: 120 }),
  body('contactName').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().isLength({ min: 7, max: 30 }),
  body('businessType').isIn(['WHOLESALE', 'RESTAURANT', 'DISTRIBUTOR']),
  body('city').trim().isLength({ min: 2, max: 100 }),
  body('estimatedVolumeKg').optional({ values: 'falsy' }).isInt({ min: 1, max: 100000 }).toInt(),
  body('message').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
];
export const supportValidator = [
  body('subject').trim().isLength({ min: 3, max: 120 }),
  body('message').trim().isLength({ min: 10, max: 2000 }),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ min: 7, max: 30 }),
];
