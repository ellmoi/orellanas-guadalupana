import { AppError } from '../utils/app-error.js';
const content = new Set(['products', 'categories', 'recipes', 'publications', 'testimonials', 'faqs']);
const operations = new Set(['inventory', 'analytics', 'reports', 'wholesale-requests', 'contacts', 'reviews']);
export function adminPermission(req, _res, next) {
  const roles = req.user.roles.map((x) => x.role.slug);
  if (roles.includes('ADMIN')) return next();
  const resource = req.params.resource || req.path.split('/').filter(Boolean)[0];
  if (roles.includes('CONTENT_EDITOR') && content.has(resource)) return next();
  if (roles.includes('ORDER_MANAGER') && operations.has(resource)) return next();
  return next(new AppError('No tienes permisos para este módulo administrativo.', 403));
}
