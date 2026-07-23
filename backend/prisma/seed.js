import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const roles = [
  ['Administrador', 'ADMIN', 'Acceso administrativo completo'],
  ['Cliente', 'CLIENT', 'Cuenta de compra minorista'],
  ['Editor de contenido', 'CONTENT_EDITOR', 'Gestión de recetas y publicaciones'],
  ['Gestor de pedidos', 'ORDER_MANAGER', 'Operación de pedidos e inventario'],
];

const categories = [
  ['Orellanas frescas', 'orellanas-frescas'],
  ['Presentaciones mayoristas', 'presentaciones-mayoristas'],
  ['Kits y preparados', 'kits-y-preparados'],
  ['Próximamente', 'proximamente'],
];

const products = [
  {
    name: 'Orellana fresca de 250 g',
    slug: 'orellana-fresca-250-g',
    sku: 'OR-FR-250',
    presentation: '250 g',
    priceInCents: 1200000,
    stock: 20,
    category: 'orellanas-frescas',
    status: 'ACTIVE',
  },
  {
    name: 'Orellana fresca de 500 g',
    slug: 'orellana-fresca-500-g',
    sku: 'OR-FR-500',
    presentation: '500 g',
    priceInCents: 2200000,
    stock: 15,
    category: 'orellanas-frescas',
    status: 'ACTIVE',
  },
  {
    name: 'Orellana fresca de 1 kg',
    slug: 'orellana-fresca-1-kg',
    sku: 'OR-FR-1000',
    presentation: '1 kg',
    priceInCents: 4000000,
    stock: 10,
    category: 'orellanas-frescas',
    status: 'ACTIVE',
  },
  {
    name: 'Presentación mayorista de 5 kg',
    slug: 'orellana-mayorista-5-kg',
    sku: 'OR-MA-5000',
    presentation: '5 kg',
    priceInCents: 18000000,
    wholesalePriceInCents: 16500000,
    minimumWholesaleQuantity: 2,
    stock: 5,
    category: 'presentaciones-mayoristas',
    wholesaleOnly: true,
    status: 'ACTIVE',
  },
  {
    name: 'Presentación mayorista de 10 kg',
    slug: 'orellana-mayorista-10-kg',
    sku: 'OR-MA-10000',
    presentation: '10 kg',
    priceInCents: 34000000,
    wholesalePriceInCents: 31000000,
    minimumWholesaleQuantity: 2,
    stock: 3,
    category: 'presentaciones-mayoristas',
    wholesaleOnly: true,
    status: 'ACTIVE',
  },
  {
    name: 'Kit para cocinar orellanas',
    slug: 'kit-cocinar-orellanas',
    sku: 'OR-KIT-001',
    presentation: '1 kit',
    priceInCents: 2800000,
    stock: 8,
    category: 'kits-y-preparados',
    status: 'ACTIVE',
  },
  {
    name: 'Orellanas deshidratadas',
    slug: 'orellanas-deshidratadas',
    sku: 'OR-DE-FUT',
    presentation: 'Presentación por definir',
    priceInCents: 0,
    stock: 0,
    category: 'proximamente',
    status: 'FUTURE',
  },
];

const recipes = [
  ['Orellanas al ajillo', 'orellanas-al-ajillo'],
  ['Hamburguesa de orellanas', 'hamburguesa-de-orellanas'],
  ['Orellanas apanadas', 'orellanas-apanadas'],
  ['Arroz con orellanas', 'arroz-con-orellanas'],
  ['Pasta cremosa con orellanas', 'pasta-cremosa-con-orellanas'],
  ['Tacos de orellanas', 'tacos-de-orellanas'],
  ['Sopa de orellanas', 'sopa-de-orellanas'],
  ['Orellanas a la parrilla', 'orellanas-a-la-parrilla'],
];

async function main() {
  const createdRoles = {};
  for (const [name, slug, description] of roles) {
    const legacySlugs = {
      ADMIN: 'administrador',
      CLIENT: 'cliente',
      CONTENT_EDITOR: 'editor',
      ORDER_MANAGER: 'gestor-pedidos',
    };
    const existing = await prisma.role.findFirst({ where: { OR: [{ slug }, { slug: legacySlugs[slug] }] } });
    createdRoles[slug] = existing
      ? await prisma.role.update({ where: { id: existing.id }, data: { name, slug, description } })
      : await prisma.role.create({ data: { name, slug, description } });
  }

  // Estas claves son solo para desarrollo local y deben reemplazarse fuera de este entorno.
  const [adminHash, clientHash, editorHash, managerHash] = await Promise.all([
    bcrypt.hash('AdminLocal2026!', 10),
    bcrypt.hash('ClienteLocal2026!', 10),
    bcrypt.hash('EditorLocal2026!', 10),
    bcrypt.hash('PedidosLocal2026!', 10),
  ]);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@guadalupana.local' },
    update: {
      username: 'admin.local',
      birthDate: new Date('1990-01-01'),
      termsAcceptedAt: new Date('2026-01-01'),
      dataProcessingAcceptedAt: new Date('2026-01-01'),
    },
    create: {
      email: 'admin@guadalupana.local',
      username: 'admin.local',
      passwordHash: adminHash,
      firstName: 'Administración',
      lastName: 'Local',
      birthDate: new Date('1990-01-01'),
      status: 'ACTIVE',
      termsAcceptedAt: new Date(),
      dataProcessingAcceptedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });
  const client = await prisma.user.upsert({
    where: { email: 'cliente@guadalupana.local' },
    update: {
      username: 'cliente.local',
      birthDate: new Date('1995-01-01'),
      termsAcceptedAt: new Date('2026-01-01'),
      dataProcessingAcceptedAt: new Date('2026-01-01'),
    },
    create: {
      email: 'cliente@guadalupana.local',
      username: 'cliente.local',
      passwordHash: clientHash,
      firstName: 'Cliente',
      lastName: 'Demostración',
      birthDate: new Date('1995-01-01'),
      status: 'ACTIVE',
      termsAcceptedAt: new Date(),
      dataProcessingAcceptedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });
  const editor = await prisma.user.upsert({
    where: { email: 'editor@guadalupana.local' },
    update: {},
    create: {
      email: 'editor@guadalupana.local',
      username: 'editor.local',
      passwordHash: editorHash,
      firstName: 'Editor',
      lastName: 'Contenido',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      dataProcessingAcceptedAt: new Date(),
    },
  });
  const manager = await prisma.user.upsert({
    where: { email: 'pedidos@guadalupana.local' },
    update: {},
    create: {
      email: 'pedidos@guadalupana.local',
      username: 'pedidos.local',
      passwordHash: managerHash,
      firstName: 'Gestor',
      lastName: 'Pedidos',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      dataProcessingAcceptedAt: new Date(),
    },
  });
  const restaurant = await prisma.user.upsert({
    where: { email: 'restaurante@guadalupana.local' },
    update: { customerType: 'RESTAURANT', city: 'Medellín' },
    create: {
      email: 'restaurante@guadalupana.local',
      username: 'restaurante.local',
      passwordHash: clientHash,
      firstName: 'Restaurante',
      lastName: 'Demostración',
      city: 'Medellín',
      customerType: 'RESTAURANT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      dataProcessingAcceptedAt: new Date(),
    },
  });
  for (const assignment of [
    { userId: admin.id, roleId: createdRoles.ADMIN.id },
    { userId: client.id, roleId: createdRoles.CLIENT.id },
    { userId: editor.id, roleId: createdRoles.CONTENT_EDITOR.id },
    { userId: manager.id, roleId: createdRoles.ORDER_MANAGER.id },
    { userId: restaurant.id, roleId: createdRoles.CLIENT.id },
  ]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: assignment },
      update: {},
      create: assignment,
    });
  }

  const categoryMap = {};
  for (const [name, slug] of categories) {
    categoryMap[slug] = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug, description: 'Categoría de demostración para desarrollo local.' },
    });
  }

  for (const product of products) {
    const { category, ...data } = product;
    const { stock: initialStock, ...updateData } = data;
    const savedProduct = await prisma.product.upsert({
      where: { slug: data.slug },
      update: updateData,
      create: {
        ...data,
        stock: initialStock,
        description:
          'Producto de demostración. Precio, disponibilidad y descripción sujetos a validación antes de producción.',
      },
    });
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: savedProduct.id, categoryId: categoryMap[category].id } },
      update: {},
      create: { productId: savedProduct.id, categoryId: categoryMap[category].id },
    });
  }

  for (const [title, slug] of recipes) {
    await prisma.recipe.upsert({
      where: { slug },
      update: { title },
      create: {
        title,
        slug,
        summary:
          'Receta de demostración. Ingredientes, cantidades e instrucciones se completarán con contenido revisado.',
        status: 'DRAFT',
        authorId: admin.id,
        ingredients: { create: [{ name: 'Contenido por definir', quantity: 'TODO', sortOrder: 1 }] },
        steps: { create: [{ instruction: 'TODO: redactar y validar el procedimiento.', sortOrder: 1 }] },
        categories: { create: [{ name: 'Con orellanas', slug: 'con-orellanas' }] },
      },
    });
  }
  await prisma.recipe.updateMany({
    where: { slug: { in: ['orellanas-al-ajillo', 'hamburguesa-de-orellanas', 'tacos-de-orellanas'] } },
    data: { viewCount: 18 },
  });
  await prisma.product.updateMany({
    where: { slug: { in: ['orellana-fresca-250-g', 'orellana-fresca-500-g', 'orellana-fresca-1-kg'] } },
    data: { viewCount: 25, minimumStock: 5 },
  });

  const settings = [
    ['site_name', 'Setas La Guadalupana', 'Nombre público del sitio'],
    ['welcome_message', 'Del trabajo de nuestra familia a la cocina de la tuya', 'Mensaje principal de marca'],
    ['currency', 'COP', 'Moneda para importes'],
    ['checkout_mode', 'simulation', 'El pago permanece simulado en desarrollo'],
    ['nit', 'TODO CONFIGURAR', 'NIT mostrado en comprobantes'],
    ['address', 'Dirección por configurar', 'Dirección comercial'],
    ['phone', 'Teléfono por configurar', 'Teléfono comercial'],
    ['email', 'contacto@guadalupana.local', 'Correo comercial'],
    ['frontend_url', 'http://localhost:5173', 'URL para consultar pedidos'],
  ];
  for (const [key, value, description] of settings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description, isPublic: true },
    });
  }

  const demoNumber = 'GLP-DEMO-0001';
  const demoExists = await prisma.order.findUnique({ where: { number: demoNumber } });
  if (!demoExists) {
    const demoProduct = await prisma.product.findUnique({ where: { slug: 'orellana-fresca-250-g' } });
    await prisma.$transaction(async (tx) => {
      const demoOrder = await tx.order.create({
        data: {
          number: demoNumber,
          userId: client.id,
          status: 'CONFIRMED',
          customerType: 'RETAIL',
          customerName: 'Cliente Demostración',
          customerEmail: client.email,
          customerPhone: '3001234567',
          shippingAddress: JSON.stringify({
            address: 'Dirección de demostración',
            city: 'Bogotá',
            neighborhood: 'Centro',
            reference: '',
          }),
          deliveryType: 'DELIVERY',
          paymentMethod: 'PENDING',
          subtotalInCents: demoProduct.priceInCents,
          shippingInCents: 1200000,
          totalInCents: demoProduct.priceInCents + 1200000,
          items: {
            create: {
              productId: demoProduct.id,
              productName: demoProduct.name,
              sku: demoProduct.sku,
              presentation: demoProduct.presentation,
              quantity: 1,
              unitPriceInCents: demoProduct.priceInCents,
              totalInCents: demoProduct.priceInCents,
            },
          },
          payments: {
            create: {
              provider: 'MANUAL',
              method: 'PENDING',
              status: 'PENDING',
              amountInCents: demoProduct.priceInCents + 1200000,
            },
          },
          statusHistory: {
            create: {
              actorId: client.id,
              toStatus: 'CONFIRMED',
              comment: 'Pedido de demostración creado por el seed.',
            },
          },
        },
      });
      await tx.product.update({ where: { id: demoProduct.id }, data: { stock: { decrement: 1 } } });
      await tx.inventoryMovement.create({
        data: {
          productId: demoProduct.id,
          actorId: client.id,
          type: 'SALE',
          quantity: -1,
          reason: 'Pedido de demostración',
          reference: demoNumber,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: client.id,
          action: 'ORDER_CREATED',
          entity: 'Order',
          entityId: demoOrder.id,
          changesJson: JSON.stringify({ demo: true }),
        },
      });
    });
  }

  for (const demo of [
    {
      number: 'GLP-DEMO-0002',
      user: client,
      status: 'DELIVERED',
      customerType: 'RETAIL',
      city: 'Bogotá',
      slug: 'orellana-fresca-500-g',
      quantity: 2,
      daysAgo: 0,
    },
    {
      number: 'GLP-DEMO-0003',
      user: restaurant,
      status: 'PREPARING',
      customerType: 'RESTAURANT',
      city: 'Medellín',
      slug: 'orellana-mayorista-5-kg',
      quantity: 2,
      daysAgo: 3,
    },
    {
      number: 'GLP-DEMO-0004',
      user: client,
      status: 'DELIVERED',
      customerType: 'RETAIL',
      city: 'Cali',
      slug: 'orellana-fresca-1-kg',
      quantity: 1,
      daysAgo: 35,
    },
  ]) {
    if (await prisma.order.findUnique({ where: { number: demo.number } })) continue;
    const product = await prisma.product.findUnique({ where: { slug: demo.slug } });
    const createdAt = new Date(Date.now() - demo.daysAgo * 86400000);
    const subtotal = product.priceInCents * demo.quantity;
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          number: demo.number,
          userId: demo.user.id,
          status: demo.status,
          customerType: demo.customerType,
          customerName: `${demo.user.firstName} ${demo.user.lastName}`,
          customerEmail: demo.user.email,
          shippingAddress: JSON.stringify({ address: 'Dirección de demostración', city: demo.city }),
          deliveryType: 'DELIVERY',
          paymentMethod: 'TRANSFER',
          subtotalInCents: subtotal,
          shippingInCents: 1200000,
          totalInCents: subtotal + 1200000,
          createdAt,
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              presentation: product.presentation,
              quantity: demo.quantity,
              unitPriceInCents: product.priceInCents,
              totalInCents: subtotal,
              createdAt,
            },
          },
          payments: {
            create: {
              provider: 'MANUAL',
              method: 'TRANSFER',
              status: 'APPROVED',
              amountInCents: subtotal + 1200000,
              paidAt: createdAt,
              createdAt,
            },
          },
          statusHistory: {
            create: {
              actorId: admin.id,
              toStatus: demo.status,
              comment: 'Estado de demostración para estadísticas.',
              createdAt,
            },
          },
        },
      });
      await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: demo.quantity } } });
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          actorId: admin.id,
          type: 'SALE',
          quantity: -demo.quantity,
          reason: 'Venta de demostración',
          reference: demo.number,
          createdAt,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: 'DEMO_ORDER_CREATED',
          entity: 'Order',
          entityId: order.id,
          changesJson: JSON.stringify({ demo: true }),
        },
      });
    });
  }

  console.log(
    `Seed completado: ${roles.length} roles, ${products.length} productos, ${recipes.length} recetas y 4 pedidos demostrativos.`,
  );
}

main()
  .catch((error) => {
    console.error('No fue posible ejecutar el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
