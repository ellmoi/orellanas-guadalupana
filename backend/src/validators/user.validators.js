import { body, param, query } from 'express-validator';

export const updateProfileValidator = [
  body('firstName').optional().trim().isLength({ min: 1, max: 60 }).withMessage('El nombre no es válido.'),
  body('lastName').optional().trim().isLength({ min: 1, max: 80 }).withMessage('El apellido no es válido.'),
  body('username')
    .optional()
    .trim()
    .toLowerCase()
    .matches(/^[a-zA-Z0-9._-]{3,30}$/)
    .withMessage('El usuario no es válido.'),
  body('birthDate').optional().isISO8601({ strict: true }).withMessage('La fecha de nacimiento no es válida.'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage('El teléfono no es válido.'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('La ciudad es demasiado larga.'),
  body('commercialConsent')
    .optional()
    .isBoolean()
    .withMessage('El consentimiento debe ser verdadero o falso.')
    .toBoolean(),
];

export const addressValidator = [
  body('label')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('La etiqueta es demasiado larga.'),
  body('recipient').trim().isLength({ min: 3, max: 120 }).withMessage('El destinatario es obligatorio.'),
  body('phone').trim().isLength({ min: 7, max: 30 }).withMessage('El teléfono es obligatorio.'),
  body('line1').trim().isLength({ min: 5, max: 180 }).withMessage('La dirección es obligatoria.'),
  body('line2')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 180 })
    .withMessage('El complemento es demasiado largo.'),
  body('city').trim().isLength({ min: 2, max: 100 }).withMessage('La ciudad es obligatoria.'),
  body('department').trim().isLength({ min: 2, max: 100 }).withMessage('El departamento es obligatorio.'),
  body('postalCode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El código postal no es válido.'),
  body('instructions')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las indicaciones son demasiado largas.'),
  body('isDefault').optional().isBoolean().withMessage('El valor predeterminado debe ser booleano.').toBoolean(),
];

export const idValidator = [param('id').isString().notEmpty().withMessage('El identificador es obligatorio.')];
export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero positivo.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100.').toInt(),
];

export const adminListValidator = [
  ...paginationValidator,
  query('search').optional().trim().isLength({ max: 100 }).withMessage('La búsqueda es demasiado larga.'),
  query('status').optional().isIn(['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED']).withMessage('El estado no es válido.'),
  query('role')
    .optional()
    .isIn(['CLIENT', 'ADMIN', 'CONTENT_EDITOR', 'ORDER_MANAGER'])
    .withMessage('El rol no es válido.'),
  query('customerType')
    .optional()
    .isIn(['RETAIL', 'WHOLESALE', 'RESTAURANT', 'DISTRIBUTOR'])
    .withMessage('El tipo de cliente no es válido.'),
];

export const roleValidator = [
  body('role').isIn(['CLIENT', 'ADMIN', 'CONTENT_EDITOR', 'ORDER_MANAGER']).withMessage('El rol no es válido.'),
];
