import path from 'node:path';
import { readFileSync, unlinkSync } from 'node:fs';
import { AppError } from '../utils/app-error.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function hasValidSignature(filePath, mimetype) {
  const bytes = readFileSync(filePath).subarray(0, 12);
  if (mimetype === 'image/png')
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimetype === 'image/jpeg')
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimetype === 'image/webp')
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  return false;
}

export function validateUploadedImage(request, _response, next) {
  if (!request.file) return next();
  const validType = allowedTypes.has(request.file.mimetype);
  const validExtension = allowedExtensions.has(path.extname(request.file.originalname).toLowerCase());
  let validSignature = false;
  try {
    validSignature = validType && hasValidSignature(request.file.path, request.file.mimetype);
  } catch {
    validSignature = false;
  }
  if (!validType || !validExtension || !validSignature) {
    try {
      unlinkSync(request.file.path);
    } catch {
      // El error principal de validación es más útil que un fallo de limpieza.
    }
    return next(new AppError('El archivo debe ser una imagen JPG, PNG o WebP válida.', 422));
  }
  next();
}
