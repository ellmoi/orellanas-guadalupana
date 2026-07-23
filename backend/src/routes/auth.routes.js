import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as controller from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  changePasswordValidator,
  emailValidator,
  loginValidator,
  refreshValidator,
  registerValidator,
  resetPasswordValidator,
  tokenValidator,
} from '../validators/auth.validators.js';

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Espera unos minutos.', data: null, errors: [] },
});

export const authRouter = Router();
authRouter.post('/register', registerValidator, validateRequest, asyncHandler(controller.register));
authRouter.post('/login', sensitiveLimiter, loginValidator, validateRequest, asyncHandler(controller.login));
authRouter.post('/logout', refreshValidator, validateRequest, asyncHandler(controller.logout));
authRouter.post('/refresh', sensitiveLimiter, refreshValidator, validateRequest, asyncHandler(controller.refresh));
authRouter.get('/me', authenticate, asyncHandler(controller.me));
authRouter.post('/verify-email', tokenValidator, validateRequest, asyncHandler(controller.verifyEmail));
authRouter.post(
  '/resend-verification',
  sensitiveLimiter,
  emailValidator,
  validateRequest,
  asyncHandler(controller.resendVerification),
);
authRouter.post(
  '/forgot-password',
  sensitiveLimiter,
  emailValidator,
  validateRequest,
  asyncHandler(controller.forgotPassword),
);
authRouter.post(
  '/reset-password',
  sensitiveLimiter,
  resetPasswordValidator,
  validateRequest,
  asyncHandler(controller.resetPassword),
);
authRouter.post(
  '/change-password',
  authenticate,
  changePasswordValidator,
  validateRequest,
  asyncHandler(controller.changePassword),
);
