import path from 'node:path';
import * as service from '../services/admin.service.js';
import { auditAction } from '../middlewares/audit-action.js';
import { success } from '../utils/response.js';
export async function dashboard(req, res) {
  return success(res, { data: await service.dashboard() });
}
export async function list(req, res) {
  return success(res, { data: await service.list(req.params.resource, req.query) });
}
export async function create(req, res) {
  const item = await service.create(req.params.resource, req.body);
  await auditAction(req, 'ADMIN_CREATE', req.params.resource, item.id, req.body);
  return success(res, { status: 201, data: { item } });
}
export async function update(req, res) {
  const item = await service.update(req.params.resource, req.params.id, req.body);
  await auditAction(req, 'ADMIN_UPDATE', req.params.resource, item.id, req.body);
  return success(res, { data: { item } });
}
export async function remove(req, res) {
  const item = await service.remove(req.params.resource, req.params.id);
  await auditAction(req, 'ADMIN_SOFT_DELETE', req.params.resource, item.id);
  return success(res, { data: { item } });
}
export async function products(req, res) {
  return success(res, { data: await service.listProducts(req.query) });
}
export async function saveProduct(req, res) {
  const item = await service.saveProduct(req.params.id, req.body);
  await auditAction(req, req.params.id ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED', 'Product', item.id, req.body);
  return success(res, { status: req.params.id ? 200 : 201, data: { item } });
}
export async function deleteProduct(req, res) {
  const item = await service.deleteProduct(req.params.id);
  await auditAction(req, 'PRODUCT_ARCHIVED', 'Product', item.id);
  return success(res, { data: { item } });
}
export async function uploadProductImage(req, res) {
  const image = await service.addProductImage(req.params.id, req.file);
  await auditAction(req, 'PRODUCT_IMAGE_UPLOADED', 'Product', req.params.id, { filename: req.file.filename });
  return success(res, { status: 201, data: { image } });
}
export function file(req, res) {
  return res.sendFile(path.resolve('uploads', path.basename(req.params.name)));
}
export async function recipes(req, res) {
  return success(res, { data: await service.listRecipes(req.query) });
}
export async function saveRecipe(req, res) {
  const item = await service.saveRecipe(req.params.id, req.body, req.user.id);
  await auditAction(req, req.params.id ? 'RECIPE_UPDATED' : 'RECIPE_CREATED', 'Recipe', item.id, req.body);
  return success(res, { status: req.params.id ? 200 : 201, data: { item } });
}
export async function deleteRecipe(req, res) {
  const item = await service.deleteRecipe(req.params.id);
  await auditAction(req, 'RECIPE_ARCHIVED', 'Recipe', item.id);
  return success(res, { data: { item } });
}
