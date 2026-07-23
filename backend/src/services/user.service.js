import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { serializeUser } from '../utils/user-serializer.js';

const includeRoles = { roles: { include: { role: true } } };

export async function updateProfile(userId, payload) {
  if (payload.username) {
    const duplicate = await prisma.user.findFirst({ where: { username: payload.username, NOT: { id: userId } } });
    if (duplicate) throw new AppError('El nombre de usuario ya está en uso.', 409);
  }
  const allowed = ['firstName', 'lastName', 'username', 'phone', 'city', 'commercialConsent'];
  const data = Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)));
  if (payload.birthDate) data.birthDate = new Date(payload.birthDate);
  const user = await prisma.user.update({ where: { id: userId }, data, include: includeRoles });
  return serializeUser(user);
}

export async function addAddress(userId, payload) {
  if (payload.isDefault)
    await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } });
  return prisma.address.create({ data: { ...payload, userId } });
}

async function ownedAddress(userId, id) {
  const address = await prisma.address.findFirst({ where: { id, userId, deletedAt: null } });
  if (!address) throw new AppError('La dirección no existe.', 404);
  return address;
}

export async function updateAddress(userId, id, payload) {
  await ownedAddress(userId, id);
  if (payload.isDefault)
    await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } });
  return prisma.address.update({ where: { id }, data: payload });
}

export async function deleteAddress(userId, id) {
  await ownedAddress(userId, id);
  await prisma.address.update({ where: { id }, data: { deletedAt: new Date(), isDefault: false } });
}

export const listAddresses = (userId) =>
  prisma.address.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
export const listOrders = (userId) =>
  prisma.order.findMany({
    where: { userId },
    include: { items: true, payments: true, statusHistory: true },
    orderBy: { createdAt: 'desc' },
  });

export async function listFavorites(userId) {
  const [products, recipes] = await Promise.all([
    prisma.favoriteProduct.findMany({ where: { userId }, include: { product: true }, orderBy: { createdAt: 'desc' } }),
    prisma.favoriteRecipe.findMany({ where: { userId }, include: { recipe: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { products, recipes };
}

export async function dashboard(userId) {
  const [lastOrder, pending, completed, favorites] = await Promise.all([
    prisma.order.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { items: true } }),
    prisma.order.count({ where: { userId, status: { in: ['PENDING', 'CONFIRMED', 'PAID', 'PREPARING', 'SHIPPED'] } } }),
    prisma.order.count({ where: { userId, status: 'DELIVERED' } }),
    listFavorites(userId),
  ]);
  return {
    lastOrder,
    pendingOrders: pending,
    completedOrders: completed,
    favoriteProducts: favorites.products.length,
    favoriteRecipes: favorites.recipes.length,
  };
}
export async function setFavorite(userId, type, id) {
  if (type === 'products') {
    if (!(await prisma.product.findFirst({ where: { id, deletedAt: null } })))
      throw new AppError('El producto no existe.', 404);
    await prisma.favoriteProduct.upsert({
      where: { userId_productId: { userId, productId: id } },
      update: {},
      create: { userId, productId: id },
    });
  } else {
    if (!(await prisma.recipe.findFirst({ where: { id, deletedAt: null } })))
      throw new AppError('La receta no existe.', 404);
    await prisma.favoriteRecipe.upsert({
      where: { userId_recipeId: { userId, recipeId: id } },
      update: {},
      create: { userId, recipeId: id },
    });
  }
  await prisma.auditLog.create({
    data: { userId, action: 'FAVORITE_ADDED', entity: type === 'products' ? 'Product' : 'Recipe', entityId: id },
  });
  return listFavorites(userId);
}
export async function removeFavorite(userId, type, id) {
  if (type === 'products') await prisma.favoriteProduct.deleteMany({ where: { userId, productId: id } });
  else await prisma.favoriteRecipe.deleteMany({ where: { userId, recipeId: id } });
  return listFavorites(userId);
}
export const listWholesaleRequests = (userId) =>
  prisma.wholesaleRequest.findMany({ where: { applicantId: userId }, orderBy: { createdAt: 'desc' } });
export async function createWholesaleRequest(userId, payload) {
  const item = await prisma.wholesaleRequest.create({ data: { ...payload, applicantId: userId } });
  await prisma.auditLog.create({
    data: { userId, action: 'WHOLESALE_REQUEST_CREATED', entity: 'WholesaleRequest', entityId: item.id },
  });
  return item;
}
export async function createSupportRequest(user, payload) {
  const item = await prisma.contactMessage.create({
    data: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: payload.phone || user.phone,
      subject: payload.subject,
      message: payload.message,
      consent: true,
    },
  });
  await prisma.auditLog.create({
    data: { userId: user.id, action: 'SUPPORT_REQUEST_CREATED', entity: 'ContactMessage', entityId: item.id },
  });
  return item;
}

export async function listUsers(filters) {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const where = {
    ...(filters.status && { status: filters.status }),
    ...(filters.customerType && { customerType: filters.customerType }),
    ...(filters.role && { roles: { some: { role: { slug: filters.role } } } }),
    ...(filters.search && {
      OR: [
        { email: { contains: filters.search } },
        { username: { contains: filters.search } },
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: includeRoles,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { items: items.map(serializeUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getUserDetail(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      ...includeRoles,
      addresses: { where: { deletedAt: null } },
      orders: {
        select: { id: true, number: true, status: true, totalInCents: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!user) throw new AppError('El usuario no existe.', 404);
  return serializeUser(user);
}

export async function setUserStatus(id, status) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('El usuario no existe.', 404);
  return prisma.user.update({
    where: { id },
    data: { status, tokenVersion: status === 'SUSPENDED' ? { increment: 1 } : undefined },
    include: includeRoles,
  });
}

export async function verifyUser(id) {
  await getUserDetail(id);
  return prisma.user.update({
    where: { id },
    data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
    include: includeRoles,
  });
}

export async function changeRole(id, roleSlug) {
  await getUserDetail(id);
  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) throw new AppError('El rol solicitado no existe.', 404);
  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId: id } }),
    prisma.userRole.create({ data: { userId: id, roleId: role.id } }),
  ]);
  return getUserDetail(id);
}

export const getUserHistory = (id) =>
  prisma.auditLog.findMany({
    where: { OR: [{ userId: id }, { entity: 'User', entityId: id }] },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
