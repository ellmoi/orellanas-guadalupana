import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let token;
let editorToken;
let managerToken;
let product;
before(async () => {
  const login = async (identifier, password) =>
    (await request(app).post('/api/auth/login').send({ identifier, password })).body.data.accessToken;
  [token, editorToken, managerToken] = await Promise.all([
    login('admin@guadalupana.local', 'AdminLocal2026!'),
    login('editor@guadalupana.local', 'EditorLocal2026!'),
    login('pedidos@guadalupana.local', 'PedidosLocal2026!'),
  ]);
  product = await prisma.product.create({
    data: {
      name: 'Producto analitica',
      slug: `analitica-${Date.now()}`,
      sku: `AN-${Date.now()}`,
      description: 'Prueba',
      presentation: 'Unidad',
      priceInCents: 1000,
      stock: 2,
      minimumStock: 3,
      status: 'ACTIVE',
    },
  });
});
after(async () => {
  if (product) {
    await prisma.inventoryMovement.deleteMany({ where: { productId: product.id } });
    await prisma.product.deleteMany({ where: { id: product.id } });
  }
  await prisma.$disconnect();
});

test('dashboard entrega los 13 totales y las 9 series principales', async () => {
  const response = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(Object.keys(response.body.data.indicators).length, 13);
  assert.deepEqual(
    Object.keys(response.body.data.charts).sort(),
    [
      'cities',
      'inventory',
      'newUsers',
      'ordersByStatus',
      'recurringCustomers',
      'salesByCategory',
      'salesByCustomerType',
      'salesByDate',
      'salesByProduct',
    ].sort(),
  );
  assert.equal(typeof response.body.data.indicators.salesMonth, 'number');
  assert.ok(response.body.data.charts.inventory.length);
  assert.ok(response.body.data.charts.salesByDate.length);
});
test('movimiento actualiza stock y conserva responsable, motivo y referencia', async () => {
  const response = await request(app)
    .post('/api/admin/inventory/movements')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product.id, type: 'ENTRY', quantity: 5, reason: 'Entrada de prueba', reference: 'DOC-1' });
  assert.equal(response.status, 201);
  const stored = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(stored.stock, 7);
  assert.equal(response.body.data.item.reference, 'DOC-1');
});
test('inventario impide stock negativo', async () => {
  const response = await request(app)
    .post('/api/admin/inventory/movements')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product.id, type: 'DAMAGE', quantity: 100, reason: 'Prueba' });
  assert.equal(response.status, 409);
});
test('inventario pagina, filtra y calcula alertas globales', async () => {
  const response = await request(app)
    .get(`/api/admin/inventory?productId=${product.id}&page=1&limit=1`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.pagination.limit, 1);
  assert.equal(response.body.data.items.length, 1);
  assert.equal(typeof response.body.data.alerts.unusual, 'number');
});
test('reportes respetan rango, exportan CSV y PDF', async () => {
  const list = await request(app)
    .get('/api/admin/reports/orders?from=2020-01-01&to=2030-12-31')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(list.status, 200);
  const csv = await request(app).get('/api/admin/reports/products/export/csv').set('Authorization', `Bearer ${token}`);
  assert.equal(csv.status, 200);
  assert.match(csv.headers['content-type'], /text\/csv/);
  const pdf = await request(app).get('/api/admin/reports/inventory/export/pdf').set('Authorization', `Bearer ${token}`);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.body.subarray(0, 4).toString(), '%PDF');
});
test('rango inválido se rechaza y las exportaciones no incluyen secretos', async () => {
  const invalid = await request(app)
    .get('/api/admin/reports/orders?from=no-es-fecha')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(invalid.status, 422);
  const csv = await request(app).get('/api/admin/reports/users/export/csv').set('Authorization', `Bearer ${token}`);
  assert.doesNotMatch(csv.text, /password|token|secret/i);
});
test('opciones de filtros contienen productos, categorías y clientes', async () => {
  const response = await request(app).get('/api/admin/reports/options').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.ok(response.body.data.products.length);
  assert.ok(response.body.data.categories.length);
  assert.ok(response.body.data.customers.length);
});
test('gestor de pedidos accede a inventario y reportes', async () => {
  const inventory = await request(app).get('/api/admin/inventory').set('Authorization', `Bearer ${managerToken}`);
  const reports = await request(app).get('/api/admin/reports/orders').set('Authorization', `Bearer ${managerToken}`);
  assert.equal(inventory.status, 200);
  assert.equal(reports.status, 200);
});
test('editor de contenido no accede a reportes privados', async () => {
  const response = await request(app).get('/api/admin/reports/orders').set('Authorization', `Bearer ${editorToken}`);
  assert.equal(response.status, 403);
});
