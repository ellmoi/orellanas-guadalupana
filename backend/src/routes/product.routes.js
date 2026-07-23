import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { success } from '../utils/response.js';
export const productRouter = Router();
productRouter.get(
  '/',
  asyncHandler(async (_req, res) =>
    success(res, {
      data: {
        items: await prisma.product.findMany({
          where: { status: 'ACTIVE', deletedAt: null },
          include: { images: true },
          orderBy: { name: 'asc' },
        }),
      },
    }),
  ),
);
