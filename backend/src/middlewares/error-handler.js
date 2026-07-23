// La firma de cuatro parámetros permite que Express reconozca este middleware de error.
import { failure } from '../utils/response.js';

export function errorHandler(error, _request, response, _next) {
  if (error.name === 'MulterError') {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño permitido.'
        : 'No fue posible procesar el archivo.';
    return failure(response, { status: error.code === 'LIMIT_FILE_SIZE' ? 413 : 422, message, errors: [] });
  }
  if (!error.isOperational) console.error('Error no controlado:', error);
  return failure(response, {
    status: error.status || 500,
    message: error.isOperational ? error.message : 'Error interno del servidor',
    errors: error.errors || [],
  });
}
