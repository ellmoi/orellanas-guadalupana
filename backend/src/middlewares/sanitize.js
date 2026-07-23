const sensitiveKey = (key) => /password|token|secret/i.test(key || '');
const clean = (value, key = '') => {
  if (typeof value === 'string') {
    const withoutNullBytes = value.replaceAll('\0', '');
    return sensitiveKey(key) ? withoutNullBytes : withoutNullBytes.trim();
  }
  if (Array.isArray(value)) return value.map((item) => clean(item, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([entryKey]) => !['__proto__', 'constructor', 'prototype'].includes(entryKey))
        .map(([entryKey, item]) => [entryKey, clean(item, entryKey)]),
    );
  }
  return value;
};

/** Elimina bytes nulos y claves peligrosas sin recortar contraseñas o tokens. */
export function sanitizeRequest(request, _response, next) {
  if (request.body) request.body = clean(request.body);
  next();
}
