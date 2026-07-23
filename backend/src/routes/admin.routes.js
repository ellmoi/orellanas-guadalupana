import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { Router } from 'express';
import * as controller from '../controllers/admin.controller.js';
import * as analytics from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/require-role.js';
import { adminPermission } from '../middlewares/admin-permission.js';
import { validateUploadedImage } from '../middlewares/upload-validation.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/async-handler.js';
const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (_req, file, done) => done(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({ storage, limits: { fileSize: env.uploadMaxSize } });
export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('ADMIN', 'CONTENT_EDITOR', 'ORDER_MANAGER'));
adminRouter.get('/dashboard', asyncHandler(analytics.dashboard));
adminRouter.get('/analytics/charts', adminPermission, asyncHandler(analytics.charts));
adminRouter.get('/inventory', adminPermission, asyncHandler(analytics.inventory));
adminRouter.post('/inventory/movements', adminPermission, asyncHandler(analytics.movement));
adminRouter.get('/reports/options', adminPermission, asyncHandler(analytics.reportOptions));
adminRouter.get('/reports/:type', adminPermission, asyncHandler(analytics.report));
adminRouter.get('/reports/:type/export/:format', adminPermission, asyncHandler(analytics.exportReport));
adminRouter.get('/products', adminPermission, asyncHandler(controller.products));
adminRouter.post('/products', adminPermission, asyncHandler(controller.saveProduct));
adminRouter.put('/products/:id', adminPermission, asyncHandler(controller.saveProduct));
adminRouter.delete('/products/:id', adminPermission, asyncHandler(controller.deleteProduct));
adminRouter.post(
  '/products/:id/images',
  adminPermission,
  upload.single('image'),
  validateUploadedImage,
  asyncHandler(controller.uploadProductImage),
);
adminRouter.get('/recipes', adminPermission, asyncHandler(controller.recipes));
adminRouter.post('/recipes', adminPermission, asyncHandler(controller.saveRecipe));
adminRouter.put('/recipes/:id', adminPermission, asyncHandler(controller.saveRecipe));
adminRouter.delete('/recipes/:id', adminPermission, asyncHandler(controller.deleteRecipe));
adminRouter.get('/files/:name', adminPermission, controller.file);
adminRouter.get('/:resource', adminPermission, asyncHandler(controller.list));
adminRouter.post('/:resource', adminPermission, asyncHandler(controller.create));
adminRouter.put('/:resource/:id', adminPermission, asyncHandler(controller.update));
adminRouter.delete('/:resource/:id', adminPermission, asyncHandler(controller.remove));
