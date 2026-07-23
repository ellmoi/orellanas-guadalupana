const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest(path, { method = 'GET', body, token, signal } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({ message: 'La API devolvió una respuesta no válida.' }));
  if (!response.ok) {
    if (response.status === 401 && token && typeof window !== 'undefined')
      window.dispatchEvent(new CustomEvent('guadalupana:session-expired'));
    throw new ApiError(
      payload.message || `La API respondió con estado ${response.status}.`,
      response.status,
      payload.errors || [],
    );
  }
  return payload;
}

/**
 * Centraliza las solicitudes para que autenticación, errores y URL base puedan
 * evolucionar sin acoplar los componentes a detalles del transporte.
 */
export async function getApiHealth({ signal } = {}) {
  return apiRequest('/health', { signal });
}
