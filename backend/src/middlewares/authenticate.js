import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { verifyJwt } from '../utils/jwt.js';
import { asyncHandler } from '../utils/async-handler.js';

export const authenticate = asyncHandler(async (request, _response, next) => {
  const [scheme, token] = request.headers.authorization?.split(' ') || [];
  if (scheme !== 'Bearer' || !token) throw new AppError('Debes iniciar sesión para continuar.', 401);

  let payload;
  try {
    payload = verifyJwt(token);
  } catch {
    throw new AppError('La sesión no es válida o expiró.', 401);
  }
  if (payload.type !== 'access') throw new AppError('El token enviado no es válido.', 401);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { roles: { include: { role: true } } },
  });
  if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== payload.version) {
    throw new AppError('La sesión ya no está activa.', 401);
  }
  request.user = user;
  next();
});
