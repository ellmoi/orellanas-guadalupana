import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
let adminToken, editorToken, managerToken, productId, categoryId, uploaded;
before(async () => {
  const login = async (identifier, password) =>
    (await request(app).post('/api/auth/login').send({ identifier, password })).body.data.accessToken;
  [adminToken, editorToken, managerToken] = await Promise.all([
    login('admin@guadalupana.local', 'AdminLocal2026!'),
    login('editor@guadalupana.local', 'EditorLocal2026!'),
    login('pedidos@guadalupana.local', 'PedidosLocal2026!'),
  ]);
});
after(async () => {
  if (productId) await prisma.product.deleteMany({ where: { id: productId } });
  if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
  if (uploaded) await unlink(path.resolve('uploads', uploaded)).catch(() => {});
  await prisma.$disconnect();
});
test('administrador accede al dashboard', async () => {
  const response = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data.products, 'number');
});
test('editor puede crear producto y la eliminación es lógica', async () => {
  const created = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${editorToken}`)
    .send({
      name: 'Producto panel prueba',
      slug: `producto-panel-${Date.now()}`,
      sku: `PANEL-${Date.now()}`,
      description: 'Prueba administrativa',
      presentation: '250 g',
      priceInCents: 1000000,
      stock: 3,
      minimumStock: 1,
      status: 'DRAFT',
    });
  assert.equal(created.status, 201);
  productId = created.body.data.item.id;
  const removed = await request(app)
    .delete(`/api/admin/products/${productId}`)
    .set('Authorization', `Bearer ${editorToken}`);
  assert.equal(removed.status, 200);
  const stored = await prisma.product.findUnique({ where: { id: productId } });
  assert.ok(stored.deletedAt);
  assert.equal(stored.status, 'ARCHIVED');
});
test('administrador completa CRUD de categoría', async () => {
  const slug = `categoria-panel-${Date.now()}`;
  const created = await request(app)
    .post('/api/admin/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Categoría panel', slug, isActive: true, sortOrder: 20 });
  assert.equal(created.status, 201);
  categoryId = created.body.data.item.id;
  const updated = await request(app)
    .put(`/api/admin/categories/${categoryId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Categoría editada' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.item.name, 'Categoría editada');
  const removed = await request(app)
    .delete(`/api/admin/categories/${categoryId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(removed.status, 200);
  assert.ok((await prisma.category.findUnique({ where: { id: categoryId } })).deletedAt);
});
test('editor no administra usuarios ni pagos', async () => {
  const users = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${editorToken}`);
  assert.equal(users.status, 403);
  const orders = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${editorToken}`);
  assert.equal(orders.status, 403);
});
test('gestor consulta pedidos pero no cambia roles', async () => {
  const orders = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${managerToken}`);
  assert.equal(orders.status, 200);
  const admin = await prisma.user.findUnique({ where: { email: 'admin@guadalupana.local' } });
  const role = await request(app)
    .patch(`/api/admin/users/${admin.id}/role`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ role: 'CLIENT' });
  assert.equal(role.status, 403);
});
test('carga protegida valida y guarda imagen con nombre seguro', async () => {
  const product = await prisma.product.findFirst({ where: { deletedAt: null } });
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const response = await request(app)
    .post(`/api/admin/products/${product.id}/images`)
    .set('Authorization', `Bearer ${editorToken}`)
    .attach('image', png, { filename: 'foto prueba.png', contentType: 'image/png' });
  assert.equal(response.status, 201);
  uploaded = response.body.data.image.url.split('/').at(-1);
  assert.match(uploaded, /^[0-9a-f-]+\.png$/);
  await prisma.productImage.delete({ where: { id: response.body.data.image.id } });
});
test('rechaza archivo con tipo no permitido', async () => {
  const product = await prisma.product.findFirst({ where: { deletedAt: null } });
  const response = await request(app)
    .post(`/api/admin/products/${product.id}/images`)
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('image', Buffer.from('texto'), { filename: 'archivo.txt', contentType: 'text/plain' });
  assert.equal(response.status, 422);
});
test('rechaza contenido falso aunque declare imagen PNG', async () => {
  const product = await prisma.product.findFirst({ where: { deletedAt: null } });
  const response = await request(app)
    .post(`/api/admin/products/${product.id}/images`)
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('image', Buffer.from('esto no es una imagen'), { filename: 'archivo.png', contentType: 'image/png' });
  assert.equal(response.status, 422);
});
