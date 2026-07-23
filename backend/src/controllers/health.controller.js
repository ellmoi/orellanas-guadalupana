import { success } from '../utils/response.js';

export function getHealth(_request, response) {
  return success(response, {
    message: 'API de Setas La Guadalupana disponible',
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
}
