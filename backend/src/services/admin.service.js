import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
const resources = {
  categories: 'category',
  publications: 'publication',
  testimonials: 'testimonial',
  faqs: 'faq',
  settings: 'siteSetting',
  discounts: 'discount',
  coupons: 'coupon',
  reviews: 'productReview',
  'wholesale-requests': 'wholesaleRequest',
  contacts: 'contactMessage',
  audit: 'auditLog',
  inventory: 'inventoryMovement',
};
const softDelete = new Set(['category', 'publication', 'testimonial', 'faq', 'discount', 'productReview']);
const publicData = {
  category: ['name', 'slug', 'description', 'isActive', 'sortOrder'],
  publication: ['title', 'slug', 'excerpt', 'content', 'status', 'publishedAt'],
  testimonial: ['authorName', 'content', 'rating', 'status', 'publishedAt'],
  faq: ['question', 'answer', 'sortOrder', 'status'],
  siteSetting: ['key', 'value', 'type', 'description', 'isPublic'],
  discount: ['name', 'type', 'value', 'productId', 'startsAt', 'endsAt', 'isActive'],
  coupon: ['discountId', 'code', 'maxUses', 'startsAt', 'expiresAt', 'isActive'],
  productReview: ['status', 'publishedAt'],
  wholesaleRequest: ['status', 'internalNotes', 'reviewedAt'],
  contactMessage: ['status'],
};
const clean = (model, payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([key]) => publicData[model]?.includes(key) && !/password|token|secret/i.test(key)),
  );
export async function dashboard() {
  const [products, orders, users, pendingOrders, lowStock, contacts] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
    prisma.product.count({ where: { deletedAt: null, stock: { lte: 5 } } }),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
  ]);
  return { products, orders, users, pendingOrders, lowStock, newContacts: contacts };
}
export async function list(resource, query = {}) {
  const model = resources[resource];
  if (!model) throw new AppError('Módulo administrativo no válido.', 404);
  const page = Number(query.page) || 1,
    limit = Math.min(Number(query.limit) || 20, 100);
  const where = {
    ...(query.status && { status: query.status }),
    ...(query.search &&
      ['category', 'publication', 'faq'].includes(model) && {
        OR:
          model === 'faq'
            ? [{ question: { contains: query.search } }, { answer: { contains: query.search } }]
            : [{ name: { contains: query.search } }, { slug: { contains: query.search } }],
      }),
    ...(softDelete.has(model) && { deletedAt: null }),
  };
  const delegate = prisma[model];
  const [items, total] = await prisma.$transaction([
    delegate.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    delegate.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
export async function create(resource, payload) {
  const model = resources[resource];
  if (!publicData[model]) throw new AppError('Este módulo no admite creación genérica.', 400);
  const data = clean(model, payload);
  for (const key of ['publishedAt', 'startsAt', 'endsAt', 'expiresAt', 'reviewedAt'])
    if (data[key]) data[key] = new Date(data[key]);
  return prisma[model].create({ data });
}
export async function update(resource, id, payload) {
  const model = resources[resource];
  if (!publicData[model]) throw new AppError('Este módulo no admite edición genérica.', 400);
  const exists = await prisma[model].findUnique({ where: { id } });
  if (!exists) throw new AppError('Registro no encontrado.', 404);
  const data = clean(model, payload);
  for (const key of ['publishedAt', 'startsAt', 'endsAt', 'expiresAt', 'reviewedAt'])
    if (data[key]) data[key] = new Date(data[key]);
  return prisma[model].update({ where: { id }, data });
}
export async function remove(resource, id) {
  const model = resources[resource];
  if (!softDelete.has(model)) throw new AppError('Este módulo no admite eliminación.', 400);
  return prisma[model].update({
    where: { id },
    data: { deletedAt: new Date(), ...(model === 'category' && { isActive: false }) },
  });
}
export async function listProducts(query = {}) {
  const page = Number(query.page) || 1,
    limit = Math.min(Number(query.limit) || 20, 100),
    where = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { sku: { contains: query.search } },
          { slug: { contains: query.search } },
        ],
      }),
    };
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { images: true, videos: true, categories: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
const productFields = [
  'name',
  'slug',
  'sku',
  'description',
  'presentation',
  'priceInCents',
  'wholesalePriceInCents',
  'minimumWholesaleQuantity',
  'wholesaleOnly',
  'stock',
  'minimumStock',
  'status',
  'featured',
];
export async function saveProduct(id, payload) {
  const data = Object.fromEntries(Object.entries(payload).filter(([key]) => productFields.includes(key)));
  for (const key of ['priceInCents', 'wholesalePriceInCents', 'minimumWholesaleQuantity', 'stock', 'minimumStock'])
    if (data[key] !== undefined) data[key] = Number(data[key]);
  if (id) return prisma.product.update({ where: { id }, data });
  return prisma.product.create({ data });
}
export async function deleteProduct(id) {
  return prisma.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
}
export async function addProductImage(productId, file) {
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw new AppError('Producto no encontrado.', 404);
  return prisma.productImage.create({
    data: {
      productId,
      url: `/api/admin/files/${file.filename}`,
      altText: file.originalname.replace(/\.[^.]+$/, ''),
      isPrimary: false,
    },
  });
}
export async function listRecipes(query = {}) {
  const page = Number(query.page) || 1,
    limit = Math.min(Number(query.limit) || 20, 100),
    where = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.search && { title: { contains: query.search } }),
    };
  const [items, total] = await prisma.$transaction([
    prisma.recipe.findMany({
      where,
      include: { ingredients: true, steps: true, categories: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recipe.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
export async function saveRecipe(id, payload, authorId) {
  const data = {
    title: payload.title,
    slug: payload.slug,
    summary: payload.summary,
    preparationTimeMinutes: payload.preparationTimeMinutes ? Number(payload.preparationTimeMinutes) : null,
    servings: payload.servings ? Number(payload.servings) : null,
    difficulty: payload.difficulty || null,
    imageUrl: payload.imageUrl || null,
    videoUrl: payload.videoUrl || null,
    status: payload.status || 'DRAFT',
    publishedAt: payload.status === 'PUBLISHED' ? new Date() : null,
  };
  return prisma.$transaction(async (tx) => {
    let recipe;
    if (id) {
      recipe = await tx.recipe.update({ where: { id }, data });
      await Promise.all([
        tx.recipeIngredient.deleteMany({ where: { recipeId: id } }),
        tx.recipeStep.deleteMany({ where: { recipeId: id } }),
        tx.recipeCategory.deleteMany({ where: { recipeId: id } }),
      ]);
    } else recipe = await tx.recipe.create({ data: { ...data, authorId } });
    if (payload.ingredients?.length)
      await tx.recipeIngredient.createMany({
        data: payload.ingredients.map((x, i) => ({
          recipeId: recipe.id,
          name: x.name,
          quantity: x.quantity,
          sortOrder: i,
        })),
      });
    if (payload.steps?.length)
      await tx.recipeStep.createMany({
        data: payload.steps.map((x, i) => ({ recipeId: recipe.id, instruction: x.instruction, sortOrder: i })),
      });
    if (payload.categories?.length)
      await tx.recipeCategory.createMany({
        data: payload.categories.map((x) => ({ recipeId: recipe.id, name: x.name, slug: x.slug })),
      });
    return recipe;
  });
}
export const deleteRecipe = (id) =>
  prisma.recipe.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
