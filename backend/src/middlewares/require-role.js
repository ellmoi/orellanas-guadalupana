import { AppError } from '../utils/app-error.js';

export const requireRole =
  (...allowedRoles) =>
  (request, _response, next) => {
    const roles = request.user?.roles?.map(({ role }) => role.slug) || [];
    if (!allowedRoles.some((role) => roles.includes(role))) {
      return next(new AppError('No tienes permisos para realizar esta acción.', 403));
    }
    next();
  };
