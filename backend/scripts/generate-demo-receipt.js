import { mkdir, writeFile } from 'node:fs/promises';
import { prisma } from '../src/config/prisma.js';
import { receiptPdf, receiptSettings } from '../src/services/order.service.js';

const order = await prisma.order.findUnique({
  where: { number: 'GLP-DEMO-0001' },
  include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
});
if (!order) throw new Error('Ejecuta npm run seed antes de generar el comprobante.');
const pdf = await receiptPdf(order, await receiptSettings());
await mkdir(new URL('../../output/pdf/', import.meta.url), { recursive: true });
await writeFile(new URL('../../output/pdf/comprobante-demostracion.pdf', import.meta.url), pdf);
await prisma.$disconnect();
console.log('Comprobante generado en output/pdf/comprobante-demostracion.pdf');
