import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

const orderInclude = { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'asc' } } };
const cancellable = ['PENDING', 'CONFIRMED'];
const money = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value / 100);

function unitPrice(product, customerType, quantity) {
  const wholesale = customerType !== 'RETAIL' || product.wholesaleOnly;
  if (wholesale) {
    if (quantity < product.minimumWholesaleQuantity)
      throw new AppError(
        `La cantidad mínima mayorista para ${product.name} es ${product.minimumWholesaleQuantity}.`,
        422,
      );
    return product.wholesalePriceInCents ?? product.priceInCents;
  }
  return product.priceInCents;
}

async function activeCart(userId, tx = prisma) {
  let cart = await tx.cart.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { items: { include: { product: true } } },
  });
  if (!cart) cart = await tx.cart.create({ data: { userId }, include: { items: { include: { product: true } } } });
  return cart;
}

export async function getCart(userId) {
  return activeCart(userId);
}

export async function setCartItem(userId, productId, quantity) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: productId, deletedAt: null, status: 'ACTIVE' } });
    if (!product) throw new AppError('El producto no está disponible.', 404);
    if (quantity > product.stock) throw new AppError(`Stock insuficiente para ${product.name}.`, 409);
    const cart = await activeCart(userId, tx);
    await tx.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity },
      create: { cartId: cart.id, productId, quantity },
    });
    return activeCart(userId, tx);
  });
}

export async function syncCart(userId, items) {
  return prisma.$transaction(async (tx) => {
    const cart = await activeCart(userId, tx);
    for (const item of items) {
      const product = await tx.product.findFirst({ where: { id: item.productId, deletedAt: null, status: 'ACTIVE' } });
      if (!product || item.quantity > product.stock) continue;
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
        update: { quantity: item.quantity },
        create: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
      });
    }
    return activeCart(userId, tx);
  });
}

export async function removeCartItem(userId, productId) {
  const cart = await activeCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return activeCart(userId);
}
export async function clearCart(userId) {
  const cart = await activeCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return activeCart(userId);
}

export async function checkout(user, payload, requestMeta = {}) {
  return prisma.$transaction(async (tx) => {
    const cart = await activeCart(user.id, tx);
    if (!cart.items.length) throw new AppError('El carrito está vacío.', 422);
    const customerType = user.customerType;
    const lines = [];
    for (const item of cart.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status !== 'ACTIVE' || product.deletedAt)
        throw new AppError('Uno de los productos ya no está disponible.', 409);
      if (product.stock < item.quantity) throw new AppError(`Stock insuficiente para ${product.name}.`, 409);
      const price = unitPrice(product, customerType, item.quantity);
      lines.push({ product, quantity: item.quantity, price, total: price * item.quantity });
    }
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const discount = 0;
    const shipping = payload.deliveryType === 'PICKUP' ? 0 : subtotal >= 10000000 ? 0 : 1200000;
    const total = subtotal - discount + shipping;
    const number = `GLP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const order = await tx.order.create({
      data: {
        number,
        userId: user.id,
        customerType,
        status: 'CONFIRMED',
        customerName: payload.name,
        customerEmail: payload.email,
        customerPhone: payload.phone,
        shippingAddress: JSON.stringify({
          address: payload.address,
          city: payload.city,
          neighborhood: payload.neighborhood,
          reference: payload.reference || '',
        }),
        deliveryType: payload.deliveryType,
        paymentMethod: payload.paymentMethod,
        billingData: payload.billing ? JSON.stringify(payload.billing) : null,
        subtotalInCents: subtotal,
        discountInCents: discount,
        shippingInCents: shipping,
        totalInCents: total,
        notes: payload.notes,
        items: {
          create: lines.map(({ product, quantity, price, total: lineTotal }) => ({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            presentation: product.presentation,
            quantity,
            unitPriceInCents: price,
            totalInCents: lineTotal,
          })),
        },
        payments: {
          create: { provider: 'MANUAL', method: payload.paymentMethod, status: 'PENDING', amountInCents: total },
        },
        statusHistory: {
          create: { actorId: user.id, toStatus: 'CONFIRMED', comment: 'Pedido confirmado por el cliente.' },
        },
      },
      include: orderInclude,
    });
    for (const line of lines) {
      const changed = await tx.product.updateMany({
        where: { id: line.product.id, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (changed.count !== 1) throw new AppError(`Stock insuficiente para ${line.product.name}.`, 409);
      await tx.inventoryMovement.create({
        data: {
          productId: line.product.id,
          actorId: user.id,
          type: 'SALE',
          quantity: -line.quantity,
          reason: 'Pedido confirmado',
          reference: order.number,
        },
      });
    }
    await tx.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'ORDER_CREATED',
        entity: 'Order',
        entityId: order.id,
        changesJson: JSON.stringify({ number, total }),
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      },
    });
    return order;
  });
}

export async function listOwn(userId, query = {}) {
  const page = query.page || 1,
    limit = query.limit || 20;
  const where = { userId, ...(query.status && { status: query.status }) };
  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
export async function getOwn(userId, id) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!order) throw new AppError('El pedido no existe.', 404);
  return order;
}
export async function cancelOwn(userId, id) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id, userId }, include: { items: true } });
    if (!order) throw new AppError('El pedido no existe.', 404);
    if (!cancellable.includes(order.status)) throw new AppError('Este pedido ya no puede cancelarse.', 409);
    await tx.order.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            actorId: userId,
            type: 'RELEASE',
            quantity: item.quantity,
            reason: 'Cancelación de pedido',
            reference: order.number,
          },
        });
      }
    }
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        actorId: userId,
        fromStatus: order.status,
        toStatus: 'CANCELLED',
        comment: 'Cancelado por el cliente.',
      },
    });
    await tx.auditLog.create({ data: { userId, action: 'ORDER_CANCELLED', entity: 'Order', entityId: id } });
    return tx.order.findUnique({ where: { id }, include: orderInclude });
  });
}
export async function repeatOwn(userId, id) {
  const order = await getOwn(userId, id);
  return syncCart(
    userId,
    order.items.filter((i) => i.productId).map((i) => ({ productId: i.productId, quantity: i.quantity })),
  );
}
export async function listAdmin(query = {}) {
  const page = query.page || 1,
    limit = query.limit || 20,
    where = query.status ? { status: query.status } : {};
  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
export async function getAdmin(id) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new AppError('El pedido no existe.', 404);
  return order;
}
export async function registerManualPayment(actor, id, payload) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw new AppError('El pedido no existe.', 404);
    if (['CANCELLED', 'REFUNDED'].includes(order.status))
      throw new AppError('No se puede registrar pago para este pedido.', 409);
    await tx.payment.create({
      data: {
        orderId: id,
        provider: 'MANUAL',
        method: payload.method || 'TRANSFER',
        status: 'APPROVED',
        amountInCents: order.totalInCents,
        externalReference: payload.reference || null,
        paidAt: new Date(),
      },
    });
    const updated = await tx.order.update({ where: { id }, data: { status: 'PAID' } });
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        actorId: actor,
        fromStatus: order.status,
        toStatus: 'PAID',
        comment: 'Pago manual registrado.',
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor,
        action: 'MANUAL_PAYMENT_REGISTERED',
        entity: 'Order',
        entityId: id,
        changesJson: JSON.stringify({ method: payload.method, reference: payload.reference }),
      },
    });
    return updated;
  });
}
export async function setInternalNote(actor, id, note) {
  const order = await prisma.order.update({ where: { id }, data: { internalNotes: note } });
  await prisma.auditLog.create({
    data: {
      userId: actor,
      action: 'ORDER_INTERNAL_NOTE_UPDATED',
      entity: 'Order',
      entityId: id,
      changesJson: JSON.stringify({ hasNote: Boolean(note) }),
    },
  });
  return order;
}
export async function updateStatus(actor, id, status, comment) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw new AppError('El pedido no existe.', 404);
    if (order.status === 'DELIVERED' && !['REFUNDED'].includes(status))
      throw new AppError('Un pedido entregado no puede editarse arbitrariamente.', 409);
    const updated = await tx.order.update({ where: { id }, data: { status } });
    await tx.orderStatusHistory.create({
      data: { orderId: id, actorId: actor, fromStatus: order.status, toStatus: status, comment },
    });
    await tx.auditLog.create({
      data: {
        userId: actor,
        action: 'ORDER_STATUS_UPDATED',
        entity: 'Order',
        entityId: id,
        changesJson: JSON.stringify({ from: order.status, to: status }),
      },
    });
    return updated;
  });
}

export async function receiptSettings() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['site_name', 'nit', 'address', 'phone', 'email', 'frontend_url'] } },
  });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
export async function receiptPdf(order, settings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    const logo = fileURLToPath(
      new URL('../../../frontend/public/images/logo-setas-la-guadalupana.png', import.meta.url),
    );
    doc.image(logo, (doc.page.width - 64) / 2, 36, { width: 64, height: 64 });
    doc.y = 108;
    doc
      .fontSize(22)
      .fillColor('#214c37')
      .text(settings.site_name || 'Setas La Guadalupana', { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#243129')
      .text(
        `NIT: ${settings.nit || 'TODO CONFIGURAR'} | ${settings.address || 'Dirección por configurar'} | ${settings.phone || 'Teléfono por configurar'} | ${settings.email || 'Correo por configurar'}`,
        { align: 'center' },
      );
    doc.moveDown().fontSize(16).text(`Comprobante ${order.number}`);
    doc
      .fontSize(10)
      .text(
        `Fecha: ${new Date(order.createdAt).toLocaleString('es-CO')}\nCliente: ${order.customerName} - ${order.customerEmail}\nMétodo: ${order.paymentMethod || order.payments[0]?.method || 'Pendiente'} | Estado: ${order.status}`,
      );
    doc.moveDown();
    for (const item of order.items)
      doc.text(
        `${item.quantity} x ${item.productName} (${item.presentation})  ${money(item.unitPriceInCents)}  ${money(item.totalInCents)}`,
      );
    doc
      .moveDown()
      .fontSize(11)
      .text(
        `Subtotal: ${money(order.subtotalInCents)}\nDescuento: ${money(order.discountInCents)}\nEnvío: ${money(order.shippingInCents)}\nTotal: ${money(order.totalInCents)}`,
        { align: 'right' },
      );
    doc.moveDown(2).fontSize(10).text('Gracias por apoyar el trabajo de nuestra familia.');
    doc
      .moveDown()
      .rect(doc.x, doc.y, 90, 90)
      .stroke('#214c37')
      .fontSize(8)
      .text(
        `QR preparado\nConsultar pedido:\n${settings.frontend_url || 'http://localhost:5173'}/pedidos/${order.id}`,
        doc.x + 5,
        doc.y + 8,
        { width: 80, align: 'center' },
      );
    doc
      .moveDown(8)
      .fontSize(9)
      .fillColor('#8a6846')
      .text('Este documento es un comprobante de pedido y no constituye una factura electrónica.', { align: 'center' });
    doc.end();
  });
}
