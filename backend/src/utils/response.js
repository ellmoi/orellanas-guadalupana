export function success(response, { status = 200, message = 'Operación realizada correctamente', data = {} } = {}) {
  return response.status(status).json({ success: true, message, data, errors: [] });
}

export function failure(response, { status = 500, message = 'Error interno del servidor', errors = [] } = {}) {
  return response.status(status).json({ success: false, message, data: null, errors });
}
