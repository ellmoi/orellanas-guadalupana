import * as authService from '../services/auth.service.js';
import { success } from '../utils/response.js';
import { serializeUser } from '../utils/user-serializer.js';

export async function register(request, response) {
  const user = await authService.register(request.body);
  return success(response, {
    status: 201,
    message: 'Registro exitoso. Revisa la consola del backend para verificar tu correo.',
    data: { user },
  });
}

export async function login(request, response) {
  const data = await authService.login(request.body, request);
  return success(response, { message: 'Inicio de sesión exitoso.', data });
}

export async function logout(request, response) {
  await authService.logout(request.body.refreshToken);
  return success(response, { message: 'Sesión cerrada correctamente.' });
}

export async function refresh(request, response) {
  const data = await authService.refresh(request.body.refreshToken, request);
  return success(response, { message: 'Sesión renovada correctamente.', data });
}

export async function me(request, response) {
  return success(response, {
    message: 'Perfil consultado correctamente.',
    data: { user: serializeUser(request.user) },
  });
}

export async function verifyEmail(request, response) {
  await authService.verifyEmail(request.body.token);
  return success(response, { message: 'Correo verificado correctamente. Ya puedes iniciar sesión.' });
}

export async function resendVerification(request, response) {
  await authService.resendVerification(request.body.email);
  return success(response, {
    message: 'Si la cuenta existe y está pendiente, se generó un nuevo enlace de verificación.',
  });
}

export async function forgotPassword(request, response) {
  await authService.requestPasswordReset(request.body.email);
  return success(response, { message: 'Si el correo está registrado, se generó un enlace de recuperación.' });
}

export async function resetPassword(request, response) {
  await authService.resetPassword(request.body.token, request.body.password);
  return success(response, { message: 'Contraseña restablecida correctamente. Inicia sesión de nuevo.' });
}

export async function changePassword(request, response) {
  await authService.changePassword(request.user.id, request.body.currentPassword, request.body.newPassword);
  return success(response, { message: 'Contraseña actualizada. Debes iniciar sesión nuevamente.' });
}
