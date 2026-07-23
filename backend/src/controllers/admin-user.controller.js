import * as userService from '../services/user.service.js';
import { auditAction } from '../middlewares/audit-action.js';
import { success } from '../utils/response.js';
import { serializeUser } from '../utils/user-serializer.js';

export async function listUsers(request, response) {
  return success(response, { data: await userService.listUsers(request.query) });
}

export async function getUser(request, response) {
  return success(response, { data: { user: await userService.getUserDetail(request.params.id) } });
}

async function changeStatus(request, response, status, message) {
  if (request.user.id === request.params.id && status === 'SUSPENDED') {
    const error = new Error('No puedes desactivar tu propia cuenta administrativa.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  const user = await userService.setUserStatus(request.params.id, status);
  await auditAction(request, `USER_${status}`, 'User', user.id, { status });
  return success(response, { message, data: { user: serializeUser(user) } });
}

export const activateUser = (request, response) =>
  changeStatus(request, response, 'ACTIVE', 'Usuario activado correctamente.');
export const deactivateUser = (request, response) =>
  changeStatus(request, response, 'SUSPENDED', 'Usuario desactivado correctamente.');

export async function verifyUser(request, response) {
  const user = await userService.verifyUser(request.params.id);
  await auditAction(request, 'USER_MANUAL_VERIFICATION', 'User', user.id);
  return success(response, { message: 'Usuario verificado manualmente.', data: { user: serializeUser(user) } });
}

export async function changeRole(request, response) {
  if (request.user.id === request.params.id && request.body.role !== 'ADMIN') {
    const error = new Error('No puedes retirar tu propio rol de administrador.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  const user = await userService.changeRole(request.params.id, request.body.role);
  await auditAction(request, 'USER_ROLE_CHANGED', 'User', request.params.id, { role: request.body.role });
  return success(response, { message: 'Rol actualizado correctamente.', data: { user } });
}

export async function getHistory(request, response) {
  await userService.getUserDetail(request.params.id);
  return success(response, { data: { history: await userService.getUserHistory(request.params.id) } });
}
