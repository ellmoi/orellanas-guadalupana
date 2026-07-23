import * as userService from '../services/user.service.js';
import { success } from '../utils/response.js';

export async function updateProfile(request, response) {
  const user = await userService.updateProfile(request.user.id, request.body);
  return success(response, { message: 'Perfil actualizado correctamente.', data: { user } });
}

export async function addAddress(request, response) {
  const address = await userService.addAddress(request.user.id, request.body);
  return success(response, { status: 201, message: 'Dirección agregada correctamente.', data: { address } });
}

export async function updateAddress(request, response) {
  const address = await userService.updateAddress(request.user.id, request.params.id, request.body);
  return success(response, { message: 'Dirección actualizada correctamente.', data: { address } });
}

export async function deleteAddress(request, response) {
  await userService.deleteAddress(request.user.id, request.params.id);
  return success(response, { message: 'Dirección eliminada correctamente.' });
}

export async function listAddresses(request, response) {
  return success(response, { data: { addresses: await userService.listAddresses(request.user.id) } });
}

export async function listOrders(request, response) {
  return success(response, { data: { orders: await userService.listOrders(request.user.id) } });
}

export async function listFavorites(request, response) {
  return success(response, { data: await userService.listFavorites(request.user.id) });
}
export async function dashboard(request, response) {
  return success(response, { data: await userService.dashboard(request.user.id) });
}
export async function addFavorite(request, response) {
  return success(response, {
    data: await userService.setFavorite(request.user.id, request.params.type, request.params.id),
  });
}
export async function removeFavorite(request, response) {
  return success(response, {
    data: await userService.removeFavorite(request.user.id, request.params.type, request.params.id),
  });
}
export async function listWholesale(request, response) {
  return success(response, { data: { requests: await userService.listWholesaleRequests(request.user.id) } });
}
export async function createWholesale(request, response) {
  return success(response, {
    status: 201,
    data: { request: await userService.createWholesaleRequest(request.user.id, request.body) },
  });
}
export async function createSupport(request, response) {
  return success(response, {
    status: 201,
    message: 'Solicitud de soporte creada.',
    data: { request: await userService.createSupportRequest(request.user, request.body) },
  });
}
