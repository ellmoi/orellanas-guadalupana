import { PrismaClient } from '@prisma/client';

/** Una sola conexión compartida evita agotar conexiones durante el desarrollo. */
export const prisma = new PrismaClient();
