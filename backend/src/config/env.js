import 'dotenv/config';

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/** Expone configuración validada y evita leer process.env por toda la aplicación. */
export const env = Object.freeze({
  port: toPositiveInteger(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  uploadMaxSize: toPositiveInteger(process.env.UPLOAD_MAX_SIZE, 5_242_880),
  jwtSecret: process.env.JWT_SECRET || 'solo-desarrollo-reemplazar-antes-de-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshExpiresInDays: toPositiveInteger(process.env.REFRESH_EXPIRES_IN_DAYS, 7),
  emailMode: process.env.EMAIL_MODE || 'console',
  emailFrom: process.env.EMAIL_FROM || 'Setas La Guadalupana <no-responder@guadalupana.local>',
});

if (env.nodeEnv === 'production' && env.jwtSecret.includes('solo-desarrollo')) {
  throw new Error('JWT_SECRET debe configurarse con un secreto seguro en producción.');
}
