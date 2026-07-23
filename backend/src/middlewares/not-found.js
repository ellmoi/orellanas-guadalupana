import { failure } from '../utils/response.js';

export function notFound(request, response) {
  return failure(response, { status: 404, message: `Ruta no encontrada: ${request.method} ${request.originalUrl}` });
}
