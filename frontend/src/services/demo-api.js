import { ApiError } from './api.js';

const STORE_KEY = 'guadalupana_demo_data_v1';
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const products = [
  ['p-250', 'Orellana fresca de 250 g', 'OR-FR-250', '250 g', 1200000, 20],
  ['p-500', 'Orellana fresca de 500 g', 'OR-FR-500', '500 g', 2200000, 15],
  ['p-1000', 'Orellana fresca de 1 kg', 'OR-FR-1000', '1 kg', 4000000, 10],
  ['p-kit', 'Kit para cocinar orellanas', 'OR-KIT-001', '1 kit', 2800000, 8],
].map(([productId, name, sku, presentation, priceInCents, stock]) => ({
  id: productId,
  name,
  slug: productId,
  sku,
  presentation,
  priceInCents,
  stock,
  minimumStock: 5,
  status: 'ACTIVE',
  description: 'Producto fresco cultivado localmente por nuestra empresa familiar.',
  createdAt: '2026-01-15T12:00:00.000Z',
}));

const accounts = {
  'admin@guadalupana.local': ['AdminLocal2026!', 'Administración', 'Local', ['ADMIN'], 'admin.local'],
  'cliente@guadalupana.local': ['ClienteLocal2026!', 'Cliente', 'Demostración', ['CLIENT'], 'cliente.local'],
  'editor@guadalupana.local': ['EditorLocal2026!', 'Editor', 'Contenido', ['CONTENT_EDITOR'], 'editor.local'],
  'pedidos@guadalupana.local': ['PedidosLocal2026!', 'Gestor', 'Pedidos', ['ORDER_MANAGER'], 'pedidos.local'],
};

function initialData() {
  return {
    products,
    orders: [
      {
        id: 'order-demo-1',
        number: 'GLP-DEMO-001',
        userEmail: 'cliente@guadalupana.local',
        status: 'DELIVERED',
        customerName: 'Cliente Demostración',
        customerEmail: 'cliente@guadalupana.local',
        paymentMethod: 'CASH_ON_DELIVERY',
        subtotalInCents: 2400000,
        discountInCents: 0,
        shippingInCents: 0,
        totalInCents: 2400000,
        createdAt: '2026-07-15T15:00:00.000Z',
        items: [
          {
            id: 'oi-1',
            productId: 'p-250',
            productName: 'Orellana fresca de 250 g',
            presentation: '250 g',
            quantity: 2,
            unitPriceInCents: 1200000,
            totalInCents: 2400000,
          },
        ],
      },
    ],
    addresses: [],
    wholesaleRequests: [],
    contacts: [],
    inventory: [],
    custom: {},
  };
}

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || initialData();
  } catch {
    return initialData();
  }
}
function save(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}
function userFromAccount(email, account) {
  return {
    id: `user-${email}`,
    email,
    username: account[4],
    firstName: account[1],
    lastName: account[2],
    roles: account[3],
    customerType: 'RETAIL',
    city: 'Medellín',
    emailVerifiedAt: now(),
  };
}
function currentUser(token) {
  const email = token?.replace('demo-token:', '');
  const account = accounts[email];
  if (!account) throw new ApiError('La sesión de demostración no es válida.', 401);
  return userFromAccount(email, account);
}
function collection(data, module) {
  if (module === 'products') return data.products;
  if (module === 'orders') return data.orders;
  if (module === 'users')
    return Object.entries(accounts).map(([email, account]) => ({
      ...userFromAccount(email, account),
      status: 'ACTIVE',
      createdAt: '2026-01-01T12:00:00.000Z',
    }));
  return (data.custom[module] ||= [
    {
      id: `${module}-demo`,
      name: `Registro demostrativo de ${module}`,
      title: `Contenido demostrativo de ${module}`,
      status: 'ACTIVE',
      createdAt: '2026-06-01T12:00:00.000Z',
    },
  ]);
}
const response = (data, message) => ({ status: 'ok', ...(message && { message }), ...(data && { data }) });

function dashboard(data) {
  const total = data.orders.reduce((sum, order) => sum + order.totalInCents, 0);
  const chart = (label, value) => [{ label, total: value }];
  return {
    indicators: {
      salesToday: 2400000,
      salesMonth: total,
      totalOrders: data.orders.length,
      users: Object.keys(accounts).length,
      newCustomers: 2,
      pendingOrders: data.orders.filter((x) => x.status === 'PENDING').length,
      preparingOrders: 1,
      deliveredOrders: data.orders.filter((x) => x.status === 'DELIVERED').length,
      lowStock: data.products.filter((x) => x.stock <= x.minimumStock).length,
      outOfStock: data.products.filter((x) => !x.stock).length,
      retailSales: total,
      wholesaleSales: 0,
      restaurants: 1,
    },
    topProducts: data.products.slice(0, 3).map((x, index) => ({
      productId: x.id,
      productName: x.name,
      _sum: { quantity: 12 - index * 3 },
    })),
    topRecipes: [
      { id: 'r1', title: 'Orellanas al ajillo', viewCount: 128 },
      { id: 'r2', title: 'Hamburguesa de orellanas', viewCount: 91 },
    ],
    mostVisitedProducts: data.products.slice(0, 3).map((x, index) => ({ ...x, viewCount: 95 - index * 15 })),
    charts: {
      salesByDate: chart('Hoy', total),
      salesByProduct: data.products.slice(0, 3).map((x) => ({ label: x.name, total: x.priceInCents })),
      salesByCategory: chart('Orellanas frescas', total),
      salesByCustomerType: chart('Hogar', data.orders.length),
      ordersByStatus: chart('Entregados', data.orders.length),
      newUsers: chart('Julio', 2),
      recurringCustomers: chart('Cliente demo', 2),
      cities: chart('Medellín', 3),
      inventory: data.products.map((x) => ({ label: x.name, stock: x.stock, minimumStock: x.minimumStock })),
    },
  };
}

export async function demoRequest(path, { method = 'GET', body, token } = {}) {
  await Promise.resolve();
  const data = read();
  const [pathname] = path.split('?');

  if (pathname === '/health') return { status: 'ok', message: 'Modo demostración activo' };
  if (pathname === '/auth/login') {
    const key = Object.keys(accounts).find(
      (email) => email === body.identifier?.toLowerCase() || accounts[email][4] === body.identifier,
    );
    if (!key || accounts[key][0] !== body.password) throw new ApiError('Correo, usuario o contraseña incorrectos.', 401);
    return response({
      accessToken: `demo-token:${key}`,
      refreshToken: `demo-refresh:${key}`,
      user: userFromAccount(key, accounts[key]),
    });
  }
  if (pathname === '/auth/me') return response({ user: currentUser(token) });
  if (pathname === '/auth/logout') return response(null, 'Sesión cerrada.');
  if (pathname === '/auth/register')
    return response(null, 'Cuenta demostrativa creada. Para explorar usa una de las credenciales de acceso publicadas.');
  if (pathname.startsWith('/auth/'))
    return response(null, 'Operación simulada correctamente. No se enviaron correos ni se cambiaron credenciales reales.');

  const user = token ? currentUser(token) : null;
  if (pathname === '/products') return response({ items: data.products });
  if (pathname === '/cart/sync') {
    const items = (body?.items || []).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      product: data.products.find((x) => x.id === item.productId),
    }));
    return response({ cart: { items } });
  }
  if (pathname === '/orders/checkout' && method === 'POST') {
    const cart = JSON.parse(localStorage.getItem('guadalupana_cart') || '[]');
    if (!cart.length) throw new ApiError('El carrito está vacío.', 400);
    const subtotal = cart.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);
    const order = {
      id: id('order'),
      number: `GLP-DEMO-${String(data.orders.length + 1).padStart(3, '0')}`,
      userEmail: user.email,
      status: 'PENDING',
      customerName: body.name,
      customerEmail: body.email,
      paymentMethod: body.paymentMethod,
      subtotalInCents: subtotal,
      discountInCents: 0,
      shippingInCents: 0,
      totalInCents: subtotal,
      createdAt: now(),
      items: cart.map((item) => ({
        id: id('item'),
        productId: item.productId,
        productName: item.name,
        presentation: item.presentation,
        quantity: item.quantity,
        unitPriceInCents: item.priceInCents,
        totalInCents: item.priceInCents * item.quantity,
      })),
    };
    data.orders.unshift(order);
    save(data);
    return response({ order });
  }
  if (pathname === '/orders') return response({ items: data.orders.filter((x) => x.userEmail === user.email) });
  const orderMatch = pathname.match(/^\/orders\/([^/]+)(?:\/cancel)?$/);
  if (orderMatch) {
    const order = data.orders.find((x) => x.id === orderMatch[1]);
    if (!order) throw new ApiError('Pedido no encontrado.', 404);
    if (pathname.endsWith('/cancel')) {
      order.status = 'CANCELLED';
      save(data);
    }
    return response({ order });
  }

  if (pathname === '/users/me/dashboard') {
    const orders = data.orders.filter((x) => x.userEmail === user.email);
    return response({
      pendingOrders: orders.filter((x) => ['PENDING', 'CONFIRMED'].includes(x.status)).length,
      completedOrders: orders.filter((x) => x.status === 'DELIVERED').length,
      favoriteProducts: 1,
      favoriteRecipes: 1,
      lastOrder: orders[0] || null,
    });
  }
  if (pathname === '/users/me/profile') return response({ user }, 'Perfil actualizado en la demostración.');
  if (pathname === '/users/me/addresses') {
    if (method === 'POST') {
      data.addresses.push({ ...body, id: id('address') });
      save(data);
    }
    return response({ addresses: data.addresses });
  }
  const addressMatch = pathname.match(/^\/users\/me\/addresses\/(.+)$/);
  if (addressMatch) {
    data.addresses = data.addresses.filter((x) => x.id !== addressMatch[1]);
    save(data);
    return response({});
  }
  if (pathname === '/users/me/favorites')
    return response({
      products: [{ id: 'fp1', productId: data.products[0].id, product: data.products[0] }],
      recipes: [{ id: 'fr1', recipeId: 'r1', recipe: { title: 'Orellanas al ajillo' } }],
    });
  if (pathname.startsWith('/users/me/favorites/')) return response({});
  if (pathname === '/users/me/wholesale-requests') {
    if (method === 'POST') {
      data.wholesaleRequests.unshift({ ...body, id: id('wholesale'), status: 'PENDING' });
      save(data);
    }
    return response({ requests: data.wholesaleRequests });
  }
  if (pathname === '/users/me/support') {
    data.contacts.unshift({ ...body, id: id('contact'), status: 'NEW', createdAt: now() });
    save(data);
    return response({});
  }

  if (pathname === '/admin/dashboard') return response(dashboard(data));
  if (pathname === '/admin/inventory') {
    return response({
      products: data.products,
      items: data.inventory,
      alerts: {
        lowStock: data.products.filter((x) => x.stock <= x.minimumStock && x.stock > 0),
        outOfStock: data.products.filter((x) => !x.stock),
        unusual: 0,
      },
      pagination: { page: 1, pages: 1, total: data.inventory.length },
    });
  }
  if (pathname === '/admin/inventory/movements') {
    const product = data.products.find((x) => x.id === body.productId);
    const negative = ['LOSS', 'SALE', 'DAMAGE', 'EXPIRATION'].includes(body.type);
    const quantity = Math.abs(body.quantity) * (negative ? -1 : 1);
    product.stock = Math.max(0, product.stock + quantity);
    data.inventory.unshift({
      ...body,
      id: id('movement'),
      quantity,
      product,
      actor: user,
      createdAt: now(),
    });
    save(data);
    return response({});
  }
  if (pathname === '/admin/reports/options')
    return response({
      products: data.products,
      categories: [{ id: 'fresh', name: 'Orellanas frescas' }],
      customers: Object.entries(accounts).map(([email, account]) => userFromAccount(email, account)),
    });
  if (/^\/admin\/reports\/[^/]+$/.test(pathname))
    return response({
      rows: data.orders.map((x) => ({
        pedido: x.number,
        cliente: x.customerName,
        estado: x.status,
        total: x.totalInCents,
        fecha: x.createdAt,
      })),
    });

  const adminMatch = pathname.match(/^\/admin\/([^/]+)(?:\/([^/]+))?$/);
  if (adminMatch) {
    const [, module, recordId] = adminMatch;
    const items = collection(data, module);
    if (method === 'POST') {
      items.unshift({ ...body, id: id(module), createdAt: now() });
      save(data);
    } else if (method === 'DELETE' && recordId) {
      const index = items.findIndex((x) => x.id === recordId);
      if (index >= 0) items.splice(index, 1);
      save(data);
    }
    return response({ items, pagination: { page: 1, pages: 1, total: items.length } });
  }

  throw new ApiError(`La acción ${method} ${pathname} no está disponible en la demostración.`, 404);
}
