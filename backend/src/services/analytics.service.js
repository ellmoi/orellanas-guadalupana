import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

const paidStatuses = ['PAID', 'PREPARING', 'READY', 'SHIPPED', 'DELIVERED'];
const movementTypes = new Set(['ENTRY', 'SALE', 'ADJUSTMENT', 'RETURN', 'LOSS', 'DAMAGE', 'EXPIRATION']);
const integer = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const dateRange = (query) => {
  const createdAt = {};
  if (query.from) createdAt.gte = new Date(`${query.from}T00:00:00`);
  if (query.to) createdAt.lte = new Date(`${query.to}T23:59:59.999`);
  if ([createdAt.gte, createdAt.lte].some((date) => date && Number.isNaN(date.getTime())))
    throw new AppError('El rango de fechas no es valido.', 422);
  return Object.keys(createdAt).length ? createdAt : undefined;
};
const orderWhere = (query) => ({
  ...(dateRange(query) && { createdAt: dateRange(query) }),
  ...(query.status && { status: query.status }),
  ...(query.customerType && { customerType: query.customerType }),
  ...(query.city && { shippingAddress: { contains: query.city } }),
  ...(query.paymentMethod && { paymentMethod: query.paymentMethod }),
  ...(query.customer && {
    OR: [{ customerName: { contains: query.customer } }, { customerEmail: { contains: query.customer } }],
  }),
  ...(query.customerId && { userId: query.customerId }),
  ...(query.productId && { items: { some: { productId: query.productId } } }),
  ...(query.categoryId && { items: { some: { product: { categories: { some: { categoryId: query.categoryId } } } } } }),
});

export async function reportOptions() {
  const [products, categories, customers] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, sku: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    }),
  ]);
  return { products, categories, customers };
}

export async function dashboard(query = {}) {
  const now = new Date();
  const salesWhere = { status: { in: paidStatuses } };
  const [
    day,
    month,
    totalOrders,
    users,
    newCustomers,
    pending,
    preparing,
    delivered,
    productCount,
    empty,
    restaurants,
    best,
    recipes,
    products,
    retail,
    wholesale,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { ...salesWhere, createdAt: { gte: startOfDay(now) } },
      _sum: { totalInCents: true },
    }),
    prisma.order.aggregate({
      where: { ...salesWhere, createdAt: { gte: startOfMonth(now) } },
      _sum: { totalInCents: true },
    }),
    prisma.order.count({ where: orderWhere(query) }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth(now) } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.order.count({ where: { status: 'PREPARING' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, stock: 0, status: { notIn: ['FUTURE', 'ARCHIVED'] } } }),
    prisma.user.count({ where: { deletedAt: null, customerType: 'RESTAURANT' } }),
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: salesWhere },
      _sum: { quantity: true, totalInCents: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.recipe.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, viewCount: true },
      orderBy: { viewCount: 'desc' },
      take: 5,
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, viewCount: true },
      orderBy: { viewCount: 'desc' },
      take: 5,
    }),
    prisma.order.aggregate({ where: { ...salesWhere, customerType: 'RETAIL' }, _sum: { totalInCents: true } }),
    prisma.order.aggregate({
      where: { ...salesWhere, customerType: { in: ['WHOLESALE', 'RESTAURANT', 'DISTRIBUTOR'] } },
      _sum: { totalInCents: true },
    }),
  ]);
  const actualLow =
    await prisma.$queryRaw`SELECT COUNT(*) AS count FROM Product WHERE deletedAt IS NULL AND stock > 0 AND stock <= minimumStock`;
  return {
    products: productCount,
    orders: totalOrders,
    users,
    indicators: {
      salesToday: day._sum.totalInCents || 0,
      salesMonth: month._sum.totalInCents || 0,
      totalOrders,
      users,
      newCustomers,
      pendingOrders: pending,
      preparingOrders: preparing,
      deliveredOrders: delivered,
      lowStock: Number(actualLow[0]?.count || 0),
      outOfStock: empty,
      retailSales: retail._sum.totalInCents || 0,
      wholesaleSales: wholesale._sum.totalInCents || 0,
      restaurants,
    },
    topProducts: best,
    topRecipes: recipes,
    mostVisitedProducts: products,
    charts: await charts(query),
  };
}

export async function charts(query = {}) {
  const where = orderWhere(query);
  const orders = await prisma.order.findMany({
    where,
    select: {
      createdAt: true,
      totalInCents: true,
      status: true,
      customerType: true,
      shippingAddress: true,
      userId: true,
      items: {
        select: {
          quantity: true,
          totalInCents: true,
          productName: true,
          product: { select: { categories: { select: { category: { select: { name: true } } } } } },
        },
      },
    },
  });
  const users = await prisma.user.findMany({
    where: dateRange(query) ? { createdAt: dateRange(query) } : {},
    select: { createdAt: true },
  });
  const inventory = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { name: true, stock: true, minimumStock: true },
  });
  const group = (rows, key, value = () => 1) =>
    Object.entries(
      rows.reduce((acc, row) => {
        const label = key(row) || 'Sin dato';
        acc[label] = (acc[label] || 0) + value(row);
        return acc;
      }, {}),
    ).map(([label, total]) => ({ label, total }));
  const soldOrders = orders.filter((order) => paidStatuses.includes(order.status));
  const items = soldOrders.flatMap((order) => order.items);
  const categories = items.flatMap((item) =>
    item.product?.categories.length
      ? item.product.categories.map((x) => ({ name: x.category.name, value: item.totalInCents }))
      : [{ name: 'Sin categoria', value: item.totalInCents }],
  );
  return {
    salesByDate: group(
      soldOrders,
      (x) => x.createdAt.toISOString().slice(0, 10),
      (x) => x.totalInCents,
    ),
    salesByProduct: group(
      items,
      (x) => x.productName,
      (x) => x.totalInCents,
    ),
    salesByCategory: group(
      categories,
      (x) => x.name,
      (x) => x.value,
    ),
    salesByCustomerType: group(
      soldOrders,
      (x) => x.customerType,
      (x) => x.totalInCents,
    ),
    ordersByStatus: group(orders, (x) => x.status),
    newUsers: group(users, (x) => x.createdAt.toISOString().slice(0, 10)),
    recurringCustomers: group(
      orders.filter((x) => x.userId),
      (x) => x.userId,
    ).filter((x) => x.total > 1),
    cities: group(orders, (x) => {
      try {
        return JSON.parse(x.shippingAddress || '{}').city;
      } catch {
        return 'Sin dato';
      }
    }),
    inventory,
  };
}

export async function inventory(query = {}) {
  const page = Math.max(1, integer(query.page, 1));
  const limit = Math.min(100, Math.max(1, integer(query.limit, 20)));
  const where = {
    ...(query.productId && { productId: query.productId }),
    ...(query.type && { type: query.type }),
    ...(dateRange(query) && { createdAt: dateRange(query) }),
  };
  const [items, total, products, unusualPositive, unusualNegative] = await prisma.$transaction([
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, stock: true, minimumStock: true } },
        actor: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryMovement.count({ where }),
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, sku: true, stock: true, minimumStock: true },
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryMovement.count({ where: { ...where, quantity: { gte: 50 } } }),
    prisma.inventoryMovement.count({ where: { ...where, quantity: { lte: -50 } } }),
  ]);
  return {
    items,
    products,
    alerts: {
      lowStock: products.filter((x) => x.stock > 0 && x.stock <= x.minimumStock),
      outOfStock: products.filter((x) => x.stock === 0),
      unusual: unusualPositive + unusualNegative,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function createMovement(actorId, payload) {
  const quantity = integer(payload.quantity, 0);
  if (!movementTypes.has(payload.type)) throw new AppError('Tipo de movimiento no valido.', 422);
  if (!quantity) throw new AppError('La cantidad debe ser diferente de cero.', 422);
  if (!payload.reason?.trim()) throw new AppError('El motivo es obligatorio.', 422);
  const delta = ['SALE', 'LOSS', 'DAMAGE', 'EXPIRATION'].includes(payload.type)
    ? -Math.abs(quantity)
    : payload.type === 'ADJUSTMENT'
      ? quantity
      : Math.abs(quantity);
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: payload.productId, deletedAt: null } });
    if (!product) throw new AppError('Producto no encontrado.', 404);
    if (product.stock + delta < 0) throw new AppError('El movimiento dejaria el stock negativo.', 409);
    const movement = await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        actorId,
        type: payload.type,
        quantity: delta,
        reason: payload.reason.trim(),
        reference: payload.reference || null,
      },
    });
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: { increment: delta },
        status:
          product.stock + delta === 0 ? 'OUT_OF_STOCK' : product.status === 'OUT_OF_STOCK' ? 'ACTIVE' : product.status,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'INVENTORY_MOVEMENT_CREATED',
        entity: 'InventoryMovement',
        entityId: movement.id,
        changesJson: JSON.stringify({
          productId: product.id,
          type: payload.type,
          quantity: delta,
          reference: payload.reference || null,
        }),
      },
    });
    return movement;
  });
}

export async function report(type, query = {}) {
  const allowed = new Set([
    'sales',
    'orders',
    'products',
    'inventory',
    'users',
    'frequent-customers',
    'wholesale',
    'retail',
    'best-sellers',
    'income',
  ]);
  if (!allowed.has(type)) throw new AppError('Tipo de reporte no válido.', 422);
  const where = orderWhere(query);
  let rows;
  if (type === 'inventory')
    rows = (await inventory({ ...query, limit: 100 })).items.map((x) => ({
      fecha: x.createdAt,
      producto: x.product.name,
      sku: x.product.sku,
      tipo: x.type,
      cantidad: x.quantity,
      motivo: x.reason || '',
      responsable: x.actor ? `${x.actor.firstName} ${x.actor.lastName}` : '',
      referencia: x.reference || '',
    }));
  else if (type === 'users')
    rows = (
      await prisma.user.findMany({
        where: {
          deletedAt: null,
          ...(dateRange(query) && { createdAt: dateRange(query) }),
          ...(query.customerId && { id: query.customerId }),
          ...(query.customer && {
            OR: [
              { firstName: { contains: query.customer } },
              { lastName: { contains: query.customer } },
              { email: { contains: query.customer } },
            ],
          }),
          ...(query.city && { city: { contains: query.city } }),
          ...(query.customerType && { customerType: query.customerType }),
          ...(query.status && { status: query.status }),
        },
        select: {
          createdAt: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          customerType: true,
          status: true,
        },
      })
    ).map((x) => ({
      fecha: x.createdAt,
      nombre: `${x.firstName} ${x.lastName}`,
      correo: x.email,
      ciudad: x.city || '',
      tipo: x.customerType,
      estado: x.status,
    }));
  else if (type === 'products') {
    rows = await prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(query.productId && { id: query.productId }),
        ...(query.categoryId && { categories: { some: { categoryId: query.categoryId } } }),
        ...(query.status && { status: query.status }),
      },
      select: {
        sku: true,
        name: true,
        stock: true,
        minimumStock: true,
        priceInCents: true,
        wholesalePriceInCents: true,
        status: true,
        viewCount: true,
      },
    });
    if (query.stockLevel === 'low') rows = rows.filter((x) => x.stock > 0 && x.stock <= x.minimumStock);
    if (query.stockLevel === 'out')
      rows = rows.filter((x) => x.stock === 0 && !['FUTURE', 'ARCHIVED'].includes(x.status));
  } else if (type === 'best-sellers')
    rows = (
      await prisma.orderItem.groupBy({
        by: ['productName', 'sku'],
        where: { order: { ...where, status: { in: paidStatuses } } },
        _sum: { quantity: true, totalInCents: true },
        orderBy: { _sum: { quantity: 'desc' } },
      })
    ).map((x) => ({
      producto: x.productName,
      sku: x.sku,
      unidades: x._sum.quantity || 0,
      ingresos: x._sum.totalInCents || 0,
    }));
  else if (type === 'frequent-customers') {
    const grouped = await prisma.order.groupBy({
      by: ['customerEmail', 'customerName'],
      where,
      _count: { id: true },
      _sum: { totalInCents: true },
      orderBy: { _count: { id: 'desc' } },
    });
    rows = grouped.map((x) => ({
      cliente: x.customerName,
      correo: x.customerEmail,
      pedidos: x._count.id,
      total: x._sum.totalInCents || 0,
    }));
  } else if (type === 'income') {
    const orders = await prisma.order.findMany({
      where: { ...where, status: { in: paidStatuses } },
      select: { createdAt: true, totalInCents: true },
    });
    rows = Object.entries(
      orders.reduce((acc, x) => {
        const date = x.createdAt.toISOString().slice(0, 10);
        acc[date] = (acc[date] || 0) + x.totalInCents;
        return acc;
      }, {}),
    ).map(([fecha, ingresos]) => ({ fecha, ingresos }));
  } else {
    const salesOnly = ['sales', 'wholesale', 'retail'].includes(type);
    const orders = await prisma.order.findMany({
      where: { ...where, ...(salesOnly && { status: { in: paidStatuses } }) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    rows = orders.map((x) => ({
      fecha: x.createdAt,
      pedido: x.number,
      cliente: x.customerName,
      ciudad: (() => {
        try {
          return JSON.parse(x.shippingAddress || '{}').city || '';
        } catch {
          return '';
        }
      })(),
      tipo: x.customerType,
      estado: x.status,
      metodo: x.paymentMethod || '',
      subtotal: x.subtotalInCents,
      descuento: x.discountInCents,
      envio: x.shippingInCents,
      total: x.totalInCents,
    }));
    if (type === 'wholesale') rows = rows.filter((x) => x.tipo !== 'RETAIL');
    if (type === 'retail') rows = rows.filter((x) => x.tipo === 'RETAIL');
  }
  return rows;
}
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
export function reportCsv(rows) {
  if (!rows.length) return '\ufeffSin resultados\r\n';
  const keys = Object.keys(rows[0]);
  return `\ufeff${keys.map(csvCell).join(',')}\r\n${rows.map((row) => keys.map((key) => csvCell(row[key] instanceof Date ? row[key].toISOString() : row[key])).join(',')).join('\r\n')}`;
}
export function reportPdf(type, rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      layout: rows[0] && Object.keys(rows[0]).length > 6 ? 'landscape' : 'portrait',
    });
    const chunks = [];
    doc.on('data', (x) => chunks.push(x));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(18).fillColor('#214c37').text(`Setas La Guadalupana - Reporte ${type}`);
    doc
      .fontSize(9)
      .fillColor('#243129')
      .text(`Generado: ${new Date().toLocaleString('es-CO')} | ${rows.length} registros`);
    doc.moveDown();
    rows.slice(0, 500).forEach((row, index) => {
      if (doc.y > doc.page.height - 60) doc.addPage();
      doc
        .fontSize(7)
        .fillColor('#243129')
        .text(
          `${index + 1}. ${Object.entries(row)
            .map(([key, value]) => `${key}: ${value instanceof Date ? value.toLocaleString('es-CO') : (value ?? '')}`)
            .join(' | ')}`,
          { width: doc.page.width - 80 },
        );
      doc.moveDown(0.35);
    });
    if (!rows.length) doc.text('No hay resultados para los filtros seleccionados.');
    doc.end();
  });
}
