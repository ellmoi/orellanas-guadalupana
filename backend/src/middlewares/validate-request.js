import { validationResult } from 'express-validator';
import { failure } from '../utils/response.js';

export function validateRequest(request, response, next) {
  const result = validationResult(request);
  if (result.isEmpty()) return next();

  return failure(response, {
    status: 422,
    message: 'Revisa los datos enviados.',
    errors: result.array().map(({ path, msg, value }) => ({
      field: path,
      message: msg,
      value: path.toLowerCase().includes('password') ? undefined : value,
    })),
  });
}
