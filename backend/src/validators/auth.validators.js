import { body } from 'express-validator';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
const usernameRule = /^[a-zA-Z0-9._-]{3,30}$/;

export const registerValidator = [
  body('fullName')
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('El nombre completo es obligatorio y debe tener entre 3 y 120 caracteres.'),
  body('email').isEmail().withMessage('Ingresa un correo electrónico válido.').normalizeEmail(),
  body('birthDate')
    .isISO8601({ strict: true })
    .withMessage('La fecha de nacimiento debe ser válida.')
    .custom((value) => {
      if (new Date(value) >= new Date()) throw new Error('La fecha de nacimiento debe ser anterior a hoy.');
      return true;
    }),
  body('username')
    .matches(usernameRule)
    .withMessage(
      'El usuario debe tener entre 3 y 30 caracteres y usar solo letras, números, punto, guion o guion bajo.',
    )
    .toLowerCase(),
  body('password')
    .matches(passwordRule)
    .withMessage('La contraseña debe tener 8 a 72 caracteres, mayúscula, minúscula, número y símbolo.'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden.'),
  body('customerType')
    .isIn(['RETAIL', 'WHOLESALE', 'RESTAURANT', 'DISTRIBUTOR'])
    .withMessage('Selecciona un tipo de cliente válido.'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage('El teléfono no es válido.'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('La ciudad es demasiado larga.'),
  body('acceptTerms')
    .custom((value) => value === true || value === 'true')
    .withMessage('Debes aceptar los términos y condiciones.'),
  body('acceptDataProcessing')
    .custom((value) => value === true || value === 'true')
    .withMessage('Debes autorizar el tratamiento de datos.'),
  body('commercialConsent')
    .optional()
    .isBoolean()
    .withMessage('El consentimiento comercial debe ser verdadero o falso.')
    .toBoolean(),
];

export const loginValidator = [
  body('identifier').trim().notEmpty().withMessage('Ingresa tu correo o nombre de usuario.'),
  body('password').isString().notEmpty().withMessage('Ingresa tu contraseña.'),
];

export const emailValidator = [
  body('email').isEmail().withMessage('Ingresa un correo electrónico válido.').normalizeEmail(),
];
export const tokenValidator = [body('token').isString().isLength({ min: 32 }).withMessage('El token no es válido.')];
export const refreshValidator = [
  body('refreshToken').isString().notEmpty().withMessage('Envía el token de renovación.'),
];

export const resetPasswordValidator = [
  ...tokenValidator,
  body('password')
    .matches(passwordRule)
    .withMessage('La contraseña debe tener 8 a 72 caracteres, mayúscula, minúscula, número y símbolo.'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden.'),
];

export const changePasswordValidator = [
  body('currentPassword').isString().notEmpty().withMessage('Ingresa tu contraseña actual.'),
  body('newPassword')
    .matches(passwordRule)
    .withMessage('La nueva contraseña debe tener 8 a 72 caracteres, mayúscula, minúscula, número y símbolo.'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Las contraseñas no coinciden.'),
];
