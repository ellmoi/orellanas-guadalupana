import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { createRandomToken, hashToken } from '../utils/crypto.js';
import { signAccessToken, signRefreshToken, verifyJwt } from '../utils/jwt.js';
import { serializeUser } from '../utils/user-serializer.js';
import { sendDevelopmentLink } from './email.service.js';

const userWithRoles = { roles: { include: { role: true } } };

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts.shift(), lastName: parts.join(' ') || 'Sin apellido' };
}

async function issueSession(user, request) {
  const placeholder = hashToken(createRandomToken());
  const session = await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: placeholder,
      expiresAt: new Date(Date.now() + env.refreshExpiresInDays * 86_400_000),
      userAgent: request.get('user-agent')?.slice(0, 500),
      ipAddress: request.ip,
    },
  });
  const refreshToken = signRefreshToken(user, session.id);
  await prisma.refreshSession.update({ where: { id: session.id }, data: { tokenHash: hashToken(refreshToken) } });
  return { accessToken: signAccessToken(user), refreshToken };
}

async function createVerification(user) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const token = createRandomToken();
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const link = `${env.frontendUrl}/verificar-correo?token=${encodeURIComponent(token)}`;
  await sendDevelopmentLink({ recipient: user.email, subject: 'Verifica tu cuenta de Setas La Guadalupana', link });
}

export async function register(payload) {
  const email = payload.email.toLowerCase();
  const username = payload.username.toLowerCase();
  const duplicate = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (duplicate)
    throw new AppError(
      duplicate.email === email ? 'Ya existe una cuenta con este correo.' : 'El nombre de usuario ya está en uso.',
      409,
    );

  const { firstName, lastName } = splitFullName(payload.fullName);
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const clientRole = await prisma.role.findUnique({ where: { slug: 'CLIENT' } });
  if (!clientRole) throw new AppError('No se encontró el rol de cliente. Ejecuta el seed.', 500);

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      birthDate: new Date(payload.birthDate),
      phone: payload.phone || null,
      city: payload.city || null,
      customerType: payload.customerType,
      status: 'PENDING',
      termsAcceptedAt: now,
      dataProcessingAcceptedAt: now,
      commercialConsent: Boolean(payload.commercialConsent),
      roles: { create: { roleId: clientRole.id } },
    },
    include: userWithRoles,
  });
  await createVerification(user);
  return serializeUser(user);
}

export async function login(payload, request) {
  const identifier = payload.identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    include: userWithRoles,
  });
  if (!user || !(await bcrypt.compare(payload.password, user.passwordHash)))
    throw new AppError('Correo, usuario o contraseña incorrectos.', 401);
  if (user.status === 'SUSPENDED' || user.status === 'DELETED') throw new AppError('Esta cuenta no está activa.', 403);
  if (!user.emailVerifiedAt) throw new AppError('Debes verificar tu correo antes de iniciar sesión.', 403);

  const activeUser = await prisma.user.update({
    where: { id: user.id },
    data: { status: 'ACTIVE', lastLoginAt: new Date() },
    include: userWithRoles,
  });
  return { user: serializeUser(activeUser), ...(await issueSession(activeUser, request)) };
}

export async function refresh(refreshToken, request) {
  let payload;
  try {
    payload = verifyJwt(refreshToken);
  } catch {
    throw new AppError('El token de renovación no es válido o expiró.', 401);
  }
  if (payload.type !== 'refresh' || !payload.sid) throw new AppError('El token de renovación no es válido.', 401);

  const session = await prisma.refreshSession.findUnique({
    where: { id: payload.sid },
    include: { user: { include: userWithRoles } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.tokenHash !== hashToken(refreshToken))
    throw new AppError('La sesión ya no está activa.', 401);
  if (session.user.status !== 'ACTIVE' || session.user.tokenVersion !== payload.version)
    throw new AppError('La cuenta o sesión ya no está activa.', 401);

  await prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  return { user: serializeUser(session.user), ...(await issueSession(session.user, request)) };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  try {
    const payload = verifyJwt(refreshToken);
    if (payload.sid)
      await prisma.refreshSession.updateMany({
        where: { id: payload.sid, tokenHash: hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      });
  } catch {
    /* Cerrar sesión debe ser idempotente incluso si el token expiró. */
  }
}

export async function verifyEmail(token) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date())
    throw new AppError('El enlace de verificación no es válido o expiró.', 400);
  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date(), status: 'ACTIVE' } }),
  ]);
}

export async function resendVerification(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user && !user.emailVerifiedAt && user.status !== 'DELETED') await createVerification(user);
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.status === 'DELETED') return;
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const token = createRandomToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  await sendDevelopmentLink({
    recipient: user.email,
    subject: 'Restablece tu contraseña',
    link: `${env.frontendUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`,
  });
}

export async function resetPassword(token, password) {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date())
    throw new AppError('El token de recuperación no es válido o expiró.', 400);
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } }),
    prisma.refreshSession.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new AppError('La contraseña actual no es correcta.', 400);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash, tokenVersion: { increment: 1 } } }),
    prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}
