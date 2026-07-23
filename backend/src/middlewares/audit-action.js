import { prisma } from '../config/prisma.js';

/** Registra acciones administrativas sin incluir contraseñas, tokens ni secretos. */
export async function auditAction(request, action, entity, entityId, changes = null) {
  const safeChanges = changes
    ? Object.fromEntries(Object.entries(changes).filter(([key]) => !/password|token|secret/i.test(key)))
    : null;
  await prisma.auditLog.create({
    data: {
      userId: request.user?.id,
      action,
      entity,
      entityId,
      changesJson: safeChanges ? JSON.stringify(safeChanges) : null,
      ipAddress: request.ip,
      userAgent: request.get('user-agent')?.slice(0, 500),
    },
  });
}
